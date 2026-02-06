-- ============================================
-- Pizza na Objednavku - Databazova schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- TABULKY
-- ============================================

-- Admin profily (napojene na Supabase Auth)
create table admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz default now() not null
);

-- Kategorie menu
create table categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Polozky menu
create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  weight_grams integer,
  image_url text,
  active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Pizza dni
create table pizza_days (
  id uuid primary key default uuid_generate_v4(),
  date date not null unique,
  active boolean default true not null,
  note text,
  created_at timestamptz default now() not null
);

-- Casove okna
create table time_slots (
  id uuid primary key default uuid_generate_v4(),
  pizza_day_id uuid not null references pizza_days(id) on delete cascade,
  time_from time not null,
  time_to time not null,
  max_pizzas integer not null default 10 check (max_pizzas > 0),
  current_pizza_count integer not null default 0 check (current_pizza_count >= 0),
  is_open boolean default true not null,
  created_at timestamptz default now() not null,
  constraint time_order check (time_from < time_to)
);

-- Objednavky
create table orders (
  id uuid primary key default uuid_generate_v4(),
  time_slot_id uuid not null references time_slots(id),
  pizza_day_id uuid not null references pizza_days(id),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  customer_note text,
  status text not null default 'nova' check (status in ('nova', 'potvrdena', 'pripravuje_sa', 'hotova', 'vydana', 'zrusena')),
  total_price numeric(10, 2) not null,
  pizza_count integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Polozky objednavky (snapshot ceny a nazvu)
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id),
  item_name text not null,
  item_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz default now() not null
);

-- ============================================
-- INDEXY
-- ============================================

create index idx_menu_items_category on menu_items(category_id);
create index idx_time_slots_pizza_day on time_slots(pizza_day_id);
create index idx_orders_time_slot on orders(time_slot_id);
create index idx_orders_pizza_day on orders(pizza_day_id);
create index idx_orders_status on orders(status);
create index idx_order_items_order on order_items(order_id);
create index idx_pizza_days_date on pizza_days(date);

-- ============================================
-- FUNKCIE
-- ============================================

-- Helper: je aktualny pouzivatel admin?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from admin_profiles
    where id = auth.uid()
  );
$$;

-- Atomicke vytvorenie objednavky s kontrolou kapacity
create or replace function place_order(
  p_time_slot_id uuid,
  p_pizza_day_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_customer_note text default null,
  p_items jsonb default '[]'::jsonb,
  p_pizza_count integer default 0
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
  -- Zamkneme slot pre atomicku aktualizaciu
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
    return jsonb_build_object('success', false, 'error', 'Nedostatočná kapacita v tomto časovom okne');
  end if;

  -- Vypocitame celkovu cenu
  select coalesce(sum((item->>'itemPrice')::numeric * (item->>'quantity')::integer), 0)
  into v_total_price
  from jsonb_array_elements(p_items) as item;

  -- Vytvorime objednavku
  insert into orders (time_slot_id, pizza_day_id, customer_name, customer_phone, customer_email, customer_note, total_price, pizza_count)
  values (p_time_slot_id, p_pizza_day_id, p_customer_name, p_customer_phone, p_customer_email, p_customer_note, v_total_price, p_pizza_count)
  returning id into v_order_id;

  -- Vytvorime polozky objednavky
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

  -- Zvysime pocitadlo kapacity
  update time_slots
  set current_pizza_count = current_pizza_count + p_pizza_count
  where id = p_time_slot_id;

  return jsonb_build_object('success', true, 'order_id', v_order_id);
end;
$$;

-- Zrusenie objednavky so znizenim pocitadla
create or replace function cancel_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  v_order record;
begin
  select * into v_order
  from orders
  where id = p_order_id and status != 'zrusena'
  for update;

  if not found then
    return false;
  end if;

  -- Znizime pocitadlo
  update time_slots
  set current_pizza_count = greatest(0, current_pizza_count - v_order.pizza_count)
  where id = v_order.time_slot_id;

  -- Zmenime stav
  update orders
  set status = 'zrusena', updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

-- Trigger pre automaticku aktualizaciu updated_at
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
  before update on orders
  for each row
  execute function update_updated_at();

-- ============================================
-- RLS POLITIKY
-- ============================================

alter table admin_profiles enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table pizza_days enable row level security;
alter table time_slots enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Admin profiles: iba admin cita vlastny profil
create policy "Admin can read own profile"
  on admin_profiles for select
  using (id = auth.uid());

-- Kategorie: verejne citanie, admin zapis
create policy "Anyone can read categories"
  on categories for select
  using (true);

create policy "Admin can insert categories"
  on categories for insert
  with check (is_admin());

create policy "Admin can update categories"
  on categories for update
  using (is_admin());

create policy "Admin can delete categories"
  on categories for delete
  using (is_admin());

-- Menu items: verejne citanie aktivnych, admin vsetko
create policy "Anyone can read active menu items"
  on menu_items for select
  using (true);

create policy "Admin can insert menu items"
  on menu_items for insert
  with check (is_admin());

create policy "Admin can update menu items"
  on menu_items for update
  using (is_admin());

create policy "Admin can delete menu items"
  on menu_items for delete
  using (is_admin());

-- Pizza days: verejne citanie aktivnych, admin vsetko
create policy "Anyone can read pizza days"
  on pizza_days for select
  using (true);

create policy "Admin can insert pizza days"
  on pizza_days for insert
  with check (is_admin());

create policy "Admin can update pizza days"
  on pizza_days for update
  using (is_admin());

create policy "Admin can delete pizza days"
  on pizza_days for delete
  using (is_admin());

-- Time slots: verejne citanie, admin zapis
create policy "Anyone can read time slots"
  on time_slots for select
  using (true);

create policy "Admin can insert time slots"
  on time_slots for insert
  with check (is_admin());

create policy "Admin can update time slots"
  on time_slots for update
  using (is_admin());

create policy "Admin can delete time slots"
  on time_slots for delete
  using (is_admin());

-- Orders: anonymous insert cez place_order, citanie cez UUID, admin vsetko
create policy "Anyone can read own order by id"
  on orders for select
  using (true);

create policy "Admin can update orders"
  on orders for update
  using (is_admin());

-- Order items: citanie ak ma pristup k objednavke
create policy "Anyone can read order items"
  on order_items for select
  using (true);

-- ============================================
-- STORAGE (pre obrazky menu)
-- ============================================

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

create policy "Anyone can read menu images"
  on storage.objects for select
  using (bucket_id = 'menu-images');

create policy "Admin can upload menu images"
  on storage.objects for insert
  with check (bucket_id = 'menu-images' and is_admin());

create policy "Admin can update menu images"
  on storage.objects for update
  using (bucket_id = 'menu-images' and is_admin());

create policy "Admin can delete menu images"
  on storage.objects for delete
  using (bucket_id = 'menu-images' and is_admin());

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for key tables
alter publication supabase_realtime add table time_slots;
alter publication supabase_realtime add table orders;
