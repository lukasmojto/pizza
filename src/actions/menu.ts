'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { categorySchema, menuItemSchema } from '@/lib/validators'

// ==================== CATEGORIES ====================

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createCategory(_prevState: unknown, formData: FormData) {
  const raw = {
    name: formData.get('name') as string,
    sort_order: formData.get('sort_order') as string,
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').insert(parsed.data)

  if (error) return { error: 'Nepodarilo sa vytvoriť kategóriu' }

  revalidatePath('/admin/menu/kategorie')
  return { success: true }
}

export async function updateCategory(_prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const raw = {
    name: formData.get('name') as string,
    sort_order: formData.get('sort_order') as string,
  }

  const parsed = categorySchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').update(parsed.data).eq('id', id)

  if (error) return { error: 'Nepodarilo sa aktualizovať kategóriu' }

  revalidatePath('/admin/menu/kategorie')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) return { error: 'Nepodarilo sa vymazať kategóriu. Možno obsahuje položky.' }

  revalidatePath('/admin/menu/kategorie')
  return { success: true }
}

// ==================== MENU ITEMS ====================

export async function getMenuItems() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, categories(name)')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function getMenuItemsByCategory(categoryId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', categoryId)
    .eq('active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createMenuItem(_prevState: unknown, formData: FormData) {
  const raw = {
    category_id: formData.get('category_id') as string,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    price: formData.get('price') as string,
    weight_grams: (formData.get('weight_grams') as string) || null,
    active: formData.get('active') === 'on',
    sort_order: formData.get('sort_order') as string,
  }

  const parsed = menuItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Handle image upload
  let image_url: string | null = null
  const imageFile = formData.get('image') as File | null
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, imageFile)

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }
  }

  const { error } = await supabase.from('menu_items').insert({
    ...parsed.data,
    image_url,
  })

  if (error) return { error: 'Nepodarilo sa vytvoriť položku' }

  revalidatePath('/admin/menu/polozky')
  return { success: true }
}

export async function updateMenuItem(_prevState: unknown, formData: FormData) {
  const id = formData.get('id') as string
  const raw = {
    category_id: formData.get('category_id') as string,
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    price: formData.get('price') as string,
    weight_grams: (formData.get('weight_grams') as string) || null,
    active: formData.get('active') === 'on',
    sort_order: formData.get('sort_order') as string,
  }

  const parsed = menuItemSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Handle image upload
  let image_url: string | undefined
  const imageFile = formData.get('image') as File | null
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, imageFile)

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }
  }

  const updateData: Record<string, unknown> = { ...parsed.data }
  if (image_url !== undefined) {
    updateData.image_url = image_url
  }

  const { error } = await supabase.from('menu_items').update(updateData).eq('id', id)

  if (error) return { error: 'Nepodarilo sa aktualizovať položku' }

  revalidatePath('/admin/menu/polozky')
  return { success: true }
}

export async function deleteMenuItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('menu_items').delete().eq('id', id)

  if (error) return { error: 'Nepodarilo sa vymazať položku' }

  revalidatePath('/admin/menu/polozky')
  return { success: true }
}
