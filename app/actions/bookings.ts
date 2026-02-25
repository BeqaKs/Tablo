'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ReservationStatus } from '@/types/database'

export async function getRestaurants() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('is_open', true)
        .order('name')

    if (error) {
        console.error('Error fetching restaurants:', error)
        return { data: [], error: error.message }
    }
    return { data: data || [], error: null }
}

export async function getRestaurantBySlug(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('restaurants')
        .select('*, tables(*)')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching restaurant:', error)
        return { data: null, error: error.message }
    }
    return { data: data || null, error: null }
}

export async function createBooking(data: {
    restaurant_id: string
    table_id: string
    guest_count: number
    reservation_time: string // ISO
    guest_name?: string
    guest_phone?: string
    guest_notes?: string
}) {
    const supabase = await createClient()

    // === Server-side Validation ===
    if (!data.restaurant_id || !data.table_id || !data.reservation_time) {
        return { error: 'Missing required booking information.' }
    }

    if (!data.guest_count || data.guest_count < 1 || data.guest_count > 20) {
        return { error: 'Party size must be between 1 and 20 guests.' }
    }

    const startTime = new Date(data.reservation_time)
    if (isNaN(startTime.getTime())) {
        return { error: 'Invalid reservation date/time.' }
    }

    // Prevent booking in the past (allow 30 min buffer)
    const now = new Date()
    if (startTime.getTime() < now.getTime() - 30 * 60000) {
        return { error: 'Cannot create a reservation in the past.' }
    }

    // Prevent bookings more than 30 days out
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    if (startTime > maxDate) {
        return { error: 'Reservations can only be made up to 30 days in advance.' }
    }

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    // Validate table belongs to restaurant and has enough capacity
    const { data: table, error: tableError } = await supabase
        .from('tables')
        .select('id, capacity, restaurant_id')
        .eq('id', data.table_id)
        .eq('restaurant_id', data.restaurant_id)
        .single()

    if (tableError || !table) {
        return { error: 'Selected table is not available at this restaurant.' }
    }

    if (table.capacity < data.guest_count) {
        return { error: `This table only seats ${table.capacity} guests. Please choose a larger table.` }
    }

    // Get restaurant turn duration to calculate end_time
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('turn_duration_minutes, is_open')
        .eq('id', data.restaurant_id)
        .single()

    if (!restaurant?.is_open) {
        return { error: 'This restaurant is not currently accepting reservations.' }
    }

    const turnDuration = restaurant?.turn_duration_minutes || 90
    const endTime = new Date(startTime.getTime() + turnDuration * 60000)

    const { data: booking, error } = await supabase
        .from('reservations')
        .insert({
            ...data,
            user_id: user?.id || null,
            end_time: endTime.toISOString(),
            status: 'pending' as ReservationStatus
        })
        .select()
        .single()

    if (error) {
        // Check for temporal overlap constraint
        if (error.message.includes('exclusion')) {
            return { error: 'This table is already booked for the selected time. Please choose a different time or table.' }
        }
        console.error('Error creating booking:', error)
        return { error: error.message }
    }

    revalidatePath('/my-bookings')
    revalidatePath(`/(main)/restaurants/${booking.restaurant_id}`)

    return { success: true, booking }
}

export async function getCustomerBookings(userId: string) {
    const supabase = await createClient()

    const { data: bookings, error } = await supabase
        .from('reservations')
        .select(`
      *,
      restaurants:restaurant_id (
        id,
        name,
        slug,
        address,
        cuisine_type
      ),
      tables:table_id (
        id,
        table_number,
        capacity,
        zone_name
      )
    `)
        .eq('user_id', userId)
        .order('reservation_time', { ascending: false })

    if (error) {
        console.error('Error fetching bookings:', error)
        return { bookings: [], error: error.message }
    }

    return { bookings: bookings || [], error: null }
}

export async function cancelBooking(bookingId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/my-bookings')
    return { success: true }
}
