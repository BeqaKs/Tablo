'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========================
// Auth helper
// ========================

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null as any, user: null, error: 'Not authenticated' as string | null }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') return { supabase: null as any, user: null, error: 'Not authorized: admin only' as string | null }
    return { supabase, user, error: null as string | null }
}

// ========================
// USERS
// ========================

export async function getAdminUsers() {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function updateUserRole(userId: string, role: string) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/users')
    return { success: true }
}

// ========================
// RESTAURANTS
// ========================

export async function getAdminRestaurants() {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('restaurants')
        .select('*, tables(count)')
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function createAdminRestaurant(formData: {
    name: string
    slug: string
    description?: string
    address: string
    city: string
    cuisine_type?: string
    price_range?: string
    is_open?: boolean
    owner_id: string
    images?: string[]
    lat?: number
    lng?: number
}) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
        .from('restaurants')
        .insert(formData)
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/admin/restaurants')
    return { data, error: null }
}

export async function updateAdminRestaurant(id: string, updates: Record<string, any>) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('restaurants')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/restaurants')
    return { success: true }
}

export async function deleteAdminRestaurant(id: string) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/restaurants')
    revalidatePath('/restaurants')
    return { success: true }
}

// ========================
// TABLES
// ========================

export async function getAdminTables(restaurantId: string) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number')

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function createAdminTable(tableData: {
    restaurant_id: string
    table_number: string
    capacity: number
    shape: string
    x_coord?: number
    y_coord?: number
    rotation?: number
    zone_name?: string
    width?: number
    height?: number
}) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
        .from('tables')
        .insert(tableData)
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/admin/tables')
    return { data, error: null }
}

export async function updateAdminTable(id: string, updates: Record<string, any>) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/tables')
    return { success: true }
}

export async function deleteAdminTable(id: string) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/tables')
    return { success: true }
}

// ========================
// BOOKINGS
// ========================

export async function getAdminBookings() {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            restaurants:restaurant_id (id, name, slug),
            tables:table_id (id, table_number, capacity)
        `)
        .order('reservation_time', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function updateBookingStatus(bookingId: string, status: string) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', bookingId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/bookings')
    return { success: true }
}

export async function deleteAdminBooking(bookingId: string) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', bookingId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/admin/bookings')
    return { success: true }
}

// ========================
// FLOOR PLAN
// ========================

export async function saveFloorPlan(
    restaurantId: string,
    tables: any[],
    backgroundImage: string | null
) {
    const { supabase, error: authError } = await requireAdmin()
    if (authError) return { error: authError }

    // 1. Update restaurant floor plan settings (background image)
    const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({
            floor_plan_json: {
                version: '1.0',
                canvasWidth: 1200,
                canvasHeight: 800,
                gridSize: 20,
                backgroundImage,
                zones: [] // We can implement zones later
            }
        })
        .eq('id', restaurantId)

    if (restaurantError) return { error: 'Failed to save background image: ' + restaurantError.message }

    // 2. Update all tables
    // In a real app we might use an RPC or upsert, but Promise.all is fine for ~50 tables
    const updates = tables.map(table =>
        supabase
            .from('tables')
            .update({
                x_coord: table.x_coord,
                y_coord: table.y_coord,
                rotation: table.rotation,
                width: table.width,
                height: table.height
            })
            .eq('id', table.id)
    );

    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;

    if (firstError) return { error: 'Failed to update some tables: ' + firstError.message }

    revalidatePath('/dashboard/admin/tables')
    revalidatePath('/restaurants') // Revalidate public pages too
    return { success: true }
}
