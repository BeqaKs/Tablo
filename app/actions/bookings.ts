'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ReservationStatus } from '@/types/database'
import { sendBookingConfirmation, sendStatusChangeEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'
import { isTableBlocked } from '@/app/actions/schedule'
import { promoteFromWaitlist } from '@/app/actions/waitlist'

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
    seating_preference?: string
    occasion?: string
    dietary_restrictions?: string
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

    // Get restaurant details for validation and email
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('name, address, turn_duration_minutes, turn_times_config, is_open')
        .eq('id', data.restaurant_id)
        .single()

    if (!restaurant?.is_open) {
        return { error: 'This restaurant is not currently accepting reservations.' }
    }

    // Check schedule overrides (Gap 5)
    const overrideDate = startTime.toISOString().slice(0, 10) // YYYY-MM-DD
    const overrideTime = startTime.toTimeString().slice(0, 5) // HH:MM
    const blocked = await isTableBlocked(data.table_id, data.restaurant_id, overrideDate, overrideTime)
    if (blocked) {
        return { error: 'This table is not available on the selected date/time due to a schedule override.' }
    }

    let turnDuration = restaurant?.turn_duration_minutes || 90;
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

    const endTime = new Date(startTime.getTime() + turnDuration * 60000)

    let validUserId = null;
    if (user?.id) {
        // Double check if the user actually exists in the users table to prevent foreign key errors
        // during fast OAuth redirects before triggers complete
        const { data: profileCheck } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single()

        if (profileCheck?.id) {
            validUserId = user.id;
        }
    }

    const { error } = await supabase
        .from('reservations')
        .insert({
            ...data,
            user_id: validUserId,
            end_time: endTime.toISOString(),
            status: 'pending' as ReservationStatus
        })

    if (error) {
        // Check for temporal overlap constraint
        if (error.message.includes('exclusion')) {
            return { error: 'This table is already booked for the selected time. Please choose a different time or table.' }
        }
        console.error('Error creating booking:', error)
        return { error: error.message }
    }

    // Attempt to send email + SMS confirmation
    const guestEmail = user?.email;
    const guestPhone = data.guest_phone;
    const finalGuestName = data.guest_name || user?.user_metadata?.full_name || 'Guest';
    const timeStr = new Date(data.reservation_time).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });

    if (guestEmail && restaurant) {
        sendBookingConfirmation({
            to: guestEmail,
            guestName: finalGuestName,
            restaurantName: restaurant.name,
            restaurantAddress: restaurant.address,
            reservationTime: timeStr,
            guestCount: data.guest_count,
            locale: 'en'
        }).catch(err => console.error('Non-critical error sending email:', err));
    }

    if (guestPhone && restaurant) {
        sendSMS(guestPhone, 'confirmation', {
            to: guestPhone,
            guestName: finalGuestName,
            restaurantName: restaurant.name,
            reservationTime: timeStr,
            partySize: data.guest_count,
        }).catch(err => console.error('Non-critical error sending SMS:', err));
    }

    revalidatePath('/my-bookings')
    revalidatePath(`/(main)/restaurants/${data.restaurant_id}`)

    return { success: true, reservationId: (await supabase.from('reservations').select('id').eq('user_id', validUserId ?? '').eq('reservation_time', data.reservation_time).eq('table_id', data.table_id).single()).data?.id ?? null }
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

    // Fetch reservation details BEFORE cancellation (for notifications + waitlist)
    const { data: reservation } = await supabase
        .from('reservations')
        .select(`
            id, restaurant_id, reservation_time, guest_count, guest_name, guest_phone,
            user_id,
            restaurants:restaurant_id (name, address),
            users:user_id (email, full_name)
        `)
        .eq('id', bookingId)
        .single()

    const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

    if (error) return { error: error.message }

    if (reservation) {
        const restaurant = Array.isArray(reservation.restaurants)
            ? reservation.restaurants[0] as any
            : reservation.restaurants as any
        const userProfile = Array.isArray(reservation.users)
            ? reservation.users[0] as any
            : reservation.users as any

        const guestEmail = userProfile?.email
        const guestPhone = reservation.guest_phone
        const guestName = reservation.guest_name || userProfile?.full_name || 'Guest'
        const timeStr = new Date(reservation.reservation_time).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        })

        if (guestEmail && restaurant) {
            sendStatusChangeEmail({
                to: guestEmail,
                guestName,
                restaurantName: restaurant.name,
                restaurantAddress: restaurant.address,
                reservationTime: timeStr,
                guestCount: reservation.guest_count,
                newStatus: 'cancelled',
                locale: 'en',
            }).catch(console.error)
        }

        if (guestPhone && restaurant) {
            sendSMS(guestPhone, 'cancelled', {
                to: guestPhone,
                guestName,
                restaurantName: restaurant.name,
                reservationTime: timeStr,
            }).catch(console.error)
        }

        // Promote first waitlisted person for this slot
        promoteFromWaitlist(reservation.restaurant_id, reservation.reservation_time)
            .catch(console.error)
    }

    revalidatePath('/my-bookings')
    return { success: true }
}

export async function updateBookingDetails(bookingId: string, data: {
    guest_notes?: string;
    occasion?: string;
    dietary_restrictions?: string;
}) {
    const supabase = await createClient()

    // Validate ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: booking } = await supabase
        .from('reservations')
        .select('user_id')
        .eq('id', bookingId)
        .single()

    if (booking?.user_id !== user.id) {
        return { error: 'Not authorized to modify this booking' }
    }

    const { error } = await supabase
        .from('reservations')
        .update({
            guest_notes: data.guest_notes,
            occasion: data.occasion,
            dietary_restrictions: data.dietary_restrictions
        })
        .eq('id', bookingId)

    if (error) {
        console.error('Error updating booking:', error)
        return { error: error.message }
    }

    revalidatePath('/my-bookings')
    return { success: true }
}
