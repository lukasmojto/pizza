-- ============================================
-- Customer Auth Migration
-- ============================================

-- Tabuľka zákazníckych profilov
create table customer_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  address text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index pre vyhľadávanie podľa emailu
create index idx_customer_profiles_email on customer_profiles(email);

-- Trigger pre automatickú aktualizáciu updated_at (reuse existujúcej funkcie)
create trigger customer_profiles_updated_at
  before update on customer_profiles
  for each row
  execute function update_updated_at();

-- RLS pre customer_profiles
alter table customer_profiles enable row level security;

create policy "Customer can read own profile"
  on customer_profiles for select
  using (id = auth.uid() or is_admin());

create policy "Customer can update own profile"
  on customer_profiles for update
  using (id = auth.uid());

create policy "Customer can insert own profile"
  on customer_profiles for insert
  with check (id = auth.uid());

-- Trigger: automaticky vytvorí profil pri registrácii (preskočí adminov)
-- EXCEPTION handler zabraňuje rollbacku user creation ak profil insert zlyhá
create or replace function handle_new_customer()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Preskočí adminov
  if exists (select 1 from admin_profiles where id = new.id) then
    return new;
  end if;

  insert into customer_profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
exception
  when others then
    -- Nezablokuje vytvorenie usera, profil sa vytvorí neskôr cez aplikáciu
    return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_customer();

-- Pridať customer_id do orders
alter table orders
  add column customer_id uuid references auth.users(id) on delete set null;

create index idx_orders_customer on orders(customer_id);

-- Aktualizovať RLS pre orders - zákazník vidí svoje objednávky
create policy "Customer can read own orders"
  on orders for select
  using (customer_id = auth.uid());

-- Aktualizovať place_order funkciu s customer_id
create or replace function place_order(
  p_time_slot_id uuid,
  p_pizza_day_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_customer_address text default null,
  p_customer_note text default null,
  p_items jsonb default '[]'::jsonb,
  p_pizza_count integer default 0,
  p_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_slot record;
  v_order_id uuid;
  v_total_price numeric(10, 2) := 0;
  v_item jsonb;
begin
  -- Zamkneme slot pre atomickú aktualizáciu
  select * into v_slot
  from time_slots
  where id = p_time_slot_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Časové okno neexistuje');
  end if;

  if not v_slot.is_open then
    return jsonb_build_object('success', false, 'error', 'Časové okno je zatvorené');
  end if;

  if v_slot.current_pizza_count + p_pizza_count > v_slot.max_pizzas then
    return jsonb_build_object('success', false, 'error', 'Prekročená maximálna kapacita v tomto časovom okne');
  end if;

  -- Vypočítame celkovú cenu
  select coalesce(sum((item->>'itemPrice')::numeric * (item->>'quantity')::integer), 0)
  into v_total_price
  from jsonb_array_elements(p_items) as item;

  -- Vytvoríme objednávku
  insert into orders (time_slot_id, pizza_day_id, customer_name, customer_phone, customer_email, customer_address, customer_note, total_price, pizza_count, customer_id)
  values (p_time_slot_id, p_pizza_day_id, p_customer_name, p_customer_phone, p_customer_email, p_customer_address, p_customer_note, v_total_price, p_pizza_count, p_customer_id)
  returning id into v_order_id;

  -- Vytvoríme položky objednávky
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (order_id, menu_item_id, item_name, item_price, quantity)
    values (
      v_order_id,
      (v_item->>'menuItemId')::uuid,
      v_item->>'itemName',
      (v_item->>'itemPrice')::numeric,
      (v_item->>'quantity')::integer
    );
  end loop;

  -- Zvýšime počítadlo kapacity
  update time_slots
  set current_pizza_count = current_pizza_count + p_pizza_count
  where id = p_time_slot_id;

  return jsonb_build_object('success', true, 'order_id', v_order_id);
end;
$$;
