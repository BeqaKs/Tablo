'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========================
// Auth helper
// ========================

async function requireOwner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null as any, user: null, restaurantId: null, error: 'Not authenticated' as string | null }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'restaurant_owner') return { supabase: null as any, user: null, restaurantId: null, error: 'Not authorized: owner only' as string | null }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { supabase: null as any, user: null, restaurantId: null, error: 'No restaurant assigned to owner' as string | null }

    return { supabase, user, restaurantId: restaurant.id, error: null as string | null }
}

// ========================
// TABLES & FLOOR PLAN
// ========================

export async function getOwnerTables() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number')

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function createOwnerTable(tableData: {
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
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
        .from('tables')
        .insert({ ...tableData, restaurant_id: restaurantId })
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/floor-plan')
    return { data, error: null }
}

export async function updateOwnerTable(id: string, updates: Record<string, any>) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', id)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/floor-plan')
    return { success: true }
}

export async function deleteOwnerTable(id: string) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/floor-plan')
    return { success: true }
}

export async function saveOwnerFloorPlan(
    tables: any[],
    backgroundImage: string | null
) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { error: authError }

    const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({
            floor_plan_json: {
                version: '1.0',
                canvasWidth: 1200,
                canvasHeight: 800,
                gridSize: 20,
                backgroundImage,
                zones: []
            }
        })
        .eq('id', restaurantId)

    if (restaurantError) return { error: 'Failed to save background image: ' + restaurantError.message }

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
            .eq('restaurant_id', restaurantId)
    );

    const results = await Promise.all(updates);
    const firstError = results.find(r => r.error)?.error;

    if (firstError) return { error: 'Failed to update some tables: ' + firstError.message }

    revalidatePath('/dashboard/floor-plan')
    return { success: true }
}

export async function getOwnerRestaurant() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { data: null, error: authError }

    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

// ========================
// BOOKINGS / GUESTS
// ========================

export async function getOwnerBookings() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('reservations')
        .select(`
            *,
            tables:table_id (id, table_number, capacity)
        `)
        .eq('restaurant_id', restaurantId)
        .order('reservation_time', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function updateOwnerBookingStatus(bookingId: string, status: string) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', bookingId)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/guests')
    return { success: true }
}
