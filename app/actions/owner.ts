'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========================
// Auth helper
// ========================

export async function requireOwner() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null as any, user: null, restaurantId: null, role: null as string | null, error: 'Not authenticated' as string | null }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'restaurant_owner') {
        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (restaurant) {
            return { supabase, user, restaurantId: restaurant.id, role: 'owner', error: null as string | null }
        }
    }

    // Try finding staff role
    const { data: staffRole } = await supabase
        .from('staff_roles')
        .select('restaurant_id, role')
        .eq('user_id', user.id)
        .single()

    if (staffRole) {
        return { supabase, user, restaurantId: staffRole.restaurant_id, role: staffRole.role, error: null as string | null }
    }

    return { supabase: null as any, user: null, restaurantId: null, role: null as string | null, error: 'Not authorized: no owner or staff access assigned' as string | null }
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

export async function getOwnerGuestProfiles() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { data: [], error: authError }

    const { data, error } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('restaurant_id', restaurantId)

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

export async function createWalkInBooking(data: {
    table_id: string
    guest_name: string
    guest_count: number
    guest_phone?: string
    guest_notes?: string
    reservation_time: string
    end_time?: string
}) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { data: null, error: authError }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('turn_duration_minutes, turn_times_config')
        .eq('id', restaurantId)
        .single();

    let turnDuration = restaurant?.turn_duration_minutes || 120;
    if (restaurant?.turn_times_config) {
        const config = restaurant.turn_times_config as Record<string, number>;
        const countStr = data.guest_count.toString();
        if (config[countStr]) {
            turnDuration = config[countStr];
        } else {
            const keys = Object.keys(config).map(Number).filter(k => !isNaN(k)).sort((a, b) => a - b);
            const bestKey = keys.find(k => k >= data.guest_count) || keys[keys.length - 1];
            if (bestKey !== undefined && config[bestKey.toString()]) {
                turnDuration = config[bestKey.toString()];
            }
        }
    }

    const endTime = data.end_time || new Date(new Date(data.reservation_time).getTime() + turnDuration * 60000).toISOString()

    const { data: reservation, error } = await supabase
        .from('reservations')
        .insert({
            restaurant_id: restaurantId,
            table_id: data.table_id,
            guest_name: data.guest_name,
            guest_count: data.guest_count,
            guest_phone: data.guest_phone || null,
            guest_notes: data.guest_notes || null,
            reservation_time: data.reservation_time,
            end_time: endTime,
            status: 'seated',
        })
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/calendar')
    return { data: reservation, error: null }
}

export async function updateBookingNotes(bookingId: string, notes: string) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError) return { error: authError }

    const { error } = await supabase
        .from('reservations')
        .update({ guest_notes: notes })
        .eq('id', bookingId)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/calendar')
    return { success: true }
}
