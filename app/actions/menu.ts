'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========================
// PUBLIC: Fetch menu
// ========================

export async function getMenuByRestaurant(restaurantId: string) {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
        .from('menu_categories')
        .select(`
            *,
            menu_items (*)
        `)
        .eq('restaurant_id', restaurantId)
        .order('sort_order')

    if (error) {
        console.error('Error fetching menu:', error)
        return { data: [], error: error.message }
    }

    // Sort items within each category by name
    const sorted = (categories || []).map((cat: any) => ({
        ...cat,
        menu_items: (cat.menu_items || [])
            .filter((item: any) => item.is_available)
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
    }))

    return { data: sorted, error: null }
}

// ========================
// OWNER: Menu CRUD helpers
// ========================

async function requireOwnerForMenu() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null as any, user: null, restaurantId: null, error: 'Not authenticated' as string | null }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'restaurant_owner' && profile?.role !== 'admin')
        return { supabase: null as any, user: null, restaurantId: null, error: 'Not authorized' as string | null }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { supabase: null as any, user: null, restaurantId: null, error: 'No restaurant found' as string | null }

    return { supabase, user, restaurantId: restaurant.id, error: null as string | null }
}

// ========================
// Categories
// ========================

export async function createMenuCategory(data: { name: string; sort_order?: number }) {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { data: null, error: authError }

    const { data: category, error } = await supabase
        .from('menu_categories')
        .insert({ ...data, restaurant_id: restaurantId })
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/menu')
    return { data: category, error: null }
}

export async function updateMenuCategory(id: string, updates: { name?: string; sort_order?: number }) {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('menu_categories')
        .update(updates)
        .eq('id', id)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/menu')
    return { success: true }
}

export async function deleteMenuCategory(id: string) {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/menu')
    return { success: true }
}

// ========================
// Menu Items
// ========================

export async function createMenuItem(data: {
    category_id: string
    name: string
    description?: string
    price: number
    image_url?: string
    dietary_tags?: string[]
    is_available?: boolean
}) {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { data: null, error: authError }

    const { data: item, error } = await supabase
        .from('menu_items')
        .insert({ ...data, restaurant_id: restaurantId })
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/menu')
    return { data: item, error: null }
}

export async function updateMenuItem(id: string, updates: Record<string, any>) {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/menu')
    return { success: true }
}

export async function deleteMenuItem(id: string) {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/menu')
    return { success: true }
}

// ========================
// Owner: get full menu with unavailable items
// ========================

export async function getOwnerMenu() {
    const { supabase, restaurantId, error: authError } = await requireOwnerForMenu()
    if (authError) return { data: [], error: authError }

    const { data: categories, error } = await supabase
        .from('menu_categories')
        .select(`*, menu_items (*)`)
        .eq('restaurant_id', restaurantId)
        .order('sort_order')

    if (error) return { data: [], error: error.message }
    return { data: categories || [], error: null }
}
