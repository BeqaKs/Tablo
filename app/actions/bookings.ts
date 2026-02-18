'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function updateBooking(
    bookingId: string,
    data: {
        reservation_time?: string
        guest_count?: number
        guest_notes?: string
    }
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('reservations')
        .update(data)
        .eq('id', bookingId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/my-bookings')
    return { success: true }
}
