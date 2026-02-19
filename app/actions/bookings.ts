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

    // Get user session
    const { data: { user } } = await supabase.auth.getUser()

    // Get restaurant turn duration to calculate end_time
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('turn_duration_minutes')
        .eq('id', data.restaurant_id)
        .single()

    const turnDuration = restaurant?.turn_duration_minutes || 90
    const startTime = new Date(data.reservation_time)
    const endTime = new Date(startTime.getTime() + turnDuration * 60000)

    const { data: booking, error } = await supabase
        .from('reservations')
        .insert({
            ...data,
            user_id: user?.id || null, // Allow anonymous or logged in
            end_time: endTime.toISOString(),
            status: 'pending' as ReservationStatus
        })
        .select()
        .single()

    if (error) {
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
