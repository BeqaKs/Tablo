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

export async function getDashboardStats() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tonight = new Date(today)
    tonight.setHours(23, 59, 59, 999)

    // 1. Get Restaurant for Average Check
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('average_check')
        .eq('id', restaurantId)
        .single()

    const avgCheck = restaurant?.average_check || 0

    // 2. Get Today's Reservations
    const { data: reservations } = await supabase
        .from('reservations')
        .select('guest_count, status')
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', today.toISOString())
        .lte('reservation_time', tonight.toISOString())

    const totalCovers = reservations?.reduce((sum: number, r: any) => sum + (r.guest_count || 0), 0) || 0
    const activeReservations = reservations?.filter((r: any) => ['pending', 'confirmed', 'seated'].includes(r.status)).length || 0

    // 3. Get Today's Orders for Revenue
    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .lte('created_at', tonight.toISOString())
        .neq('status', 'cancelled')

    const actualRevenue = orders?.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0) || 0

    // Fallback revenue calculation for showcase consistency
    const estimatedRevenue = actualRevenue > 0 ? actualRevenue : (totalCovers * Number(avgCheck))

    // 4. Get Past 7 Days Revenue for Chart
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: pastOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .neq('status', 'cancelled')

    // Group by day for the chart
    const dailyRevenue: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        dailyRevenue[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0
    }

    pastOrders?.forEach((o: any) => {
        const day = new Date(o.created_at).toLocaleDateString('en-US', { weekday: 'short' })
        if (dailyRevenue[day] !== undefined) {
            dailyRevenue[day] += Number(o.total_amount || 0)
        }
    })

    const chartData = Object.entries(dailyRevenue).map(([name, revenue]) => ({ name, revenue })).reverse()

    // 5. Calculate Occupancy (Active tables / Total tables)
    const { data: tables } = await supabase
        .from('tables')
        .select('id')
        .eq('restaurant_id', restaurantId)

    const totalTables = tables?.length || 1
    const { count: seatedCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'seated')

    const occupancy = Math.min(Math.round(((seatedCount || 0) / totalTables) * 100), 100)

    // 6. Upcoming Bookings & Upsell Opportunities
    const { data: upcomingData } = await supabase
        .from('reservations')
        .select(`
            id, guest_name, guest_count, reservation_time, status, guest_phone, occasion,
            tables ( table_number ),
            orders:order_id (
                order_items (
                    quantity,
                    menu_items ( name )
                )
            )
        `)
        .eq('restaurant_id', restaurantId)
        .gte('reservation_time', new Date().toISOString())
        .in('status', ['pending', 'confirmed'])
        .order('reservation_time', { ascending: true })
        .limit(10)

    const upcomingBookings = upcomingData?.map((r: any) => ({
        id: r.id,
        time: new Date(r.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        guestName: r.guest_name || 'Guest',
        partySize: r.guest_count,
        table: r.tables?.table_number || 'TBD',
        phone: r.guest_phone || '—',
        status: r.status,
        occasion: r.occasion,
        preOrderedItems: r.orders?.order_items?.map((item: any) => `${item.quantity}x ${item.menu_items?.name}`).join(', ') || null,
        rawReservation: r
    })) || []

    const upsellOpportunities = upcomingData
        ?.filter((r: any) => r.occasion && r.occasion !== '')
        .map((r: any) => {
            const occasionEmoji: Record<string, { emoji: string; suggestion: string }> = {
                Birthday: { emoji: '🎂', suggestion: 'Send a birthday upgrade message?' },
                Anniversary: { emoji: '🥂', suggestion: 'Offer a champagne welcome?' },
                'Date Night': { emoji: '💕', suggestion: 'Prepare a romantic table setting?' },
                Business: { emoji: '💼', suggestion: 'Reserve a quiet section?' },
                'Baby Shower': { emoji: '🍼', suggestion: 'Prepare a special cake option?' },
                Graduation: { emoji: '🎓', suggestion: 'Arrange a graduation celebration?' },
            };
            const info = occasionEmoji[r.occasion!] || { emoji: '🎉', suggestion: 'Send a personalized welcome?' };
            return {
                id: r.id,
                guestName: r.guest_name || 'Guest',
                time: new Date(r.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                occasion: r.occasion,
                emoji: info.emoji,
                suggestion: info.suggestion,
            };
        }) || []

    return {
        data: {
            restaurantName: (await supabase.from('restaurants').select('name').eq('id', restaurantId).single()).data?.name || '',
            occupancy,
            totalTables,
            totalCovers,
            activeReservations,
            estimatedRevenue,
            chartData,
            avgCheck,
            upcomingBookings,
            upsellOpportunities
        },
        error: null
    }
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
