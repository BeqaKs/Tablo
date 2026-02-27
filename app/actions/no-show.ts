'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendStatusChangeEmail } from '@/lib/email'
import { sendSMS } from '@/lib/sms'

const NO_SHOW_PENALTY_THRESHOLD = 3
const PENALTY_DAYS = 30

// ========================
// Mark No-Show (owner/admin only)
// ========================

export async function markNoShow(bookingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch the reservation first so we know the user_id
    const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('id, user_id, restaurant_id, restaurants(owner_id)')
        .eq('id', bookingId)
        .single()

    if (fetchError || !reservation) return { error: 'Reservation not found' }

    // Verify caller is the restaurant owner or admin
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    const restaurant = Array.isArray(reservation.restaurants)
        ? reservation.restaurants[0]
        : reservation.restaurants as any

    const isOwner = restaurant?.owner_id === user.id
    const isAdmin = profile?.role === 'admin'
    if (!isOwner && !isAdmin) return { error: 'Not authorized' }

    // Update reservation status and attendance
    const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'no_show', attendance_status: 'no_show' })
        .eq('id', bookingId)

    if (updateError) return { error: updateError.message }

    // Fire email + SMS notification (non-blocking)
    if (reservation.user_id) {
        const { data: guestUser } = await supabase
            .from('users')
            .select('no_show_count, is_penalized')
            .eq('id', reservation.user_id)
            .single()

        const newCount = (guestUser?.no_show_count ?? 0) + 1
        const shouldPenalize = newCount >= NO_SHOW_PENALTY_THRESHOLD

        await supabase
            .from('users')
            .update({
                no_show_count: newCount,
                is_penalized: shouldPenalize,
                penalty_until: shouldPenalize
                    ? new Date(Date.now() + PENALTY_DAYS * 24 * 60 * 60 * 1000).toISOString()
                    : null,
            })
            .eq('id', reservation.user_id)

        // Fetch email + name for notification
        const { data: guestProfile } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', reservation.user_id)
            .single()

        const { data: restaurantData } = await supabase
            .from('restaurants')
            .select('name, address')
            .eq('id', reservation.restaurant_id)
            .single()

        const { data: reservationFull } = await supabase
            .from('reservations')
            .select('reservation_time, guest_count')
            .eq('id', bookingId)
            .single()

        if (guestProfile?.email && restaurantData && reservationFull) {
            const timeStr = new Date(reservationFull.reservation_time).toLocaleString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
            })
            sendStatusChangeEmail({
                to: guestProfile.email,
                guestName: guestProfile.full_name || 'Guest',
                restaurantName: restaurantData.name,
                restaurantAddress: restaurantData.address,
                reservationTime: timeStr,
                guestCount: reservationFull.guest_count,
                newStatus: 'no_show',
                locale: 'en',
            }).catch(console.error)
        }
    }

    revalidatePath('/dashboard/guests')
    revalidatePath('/dashboard/calendar')
    return { success: true }
}

// ========================
// Mark Arrived
// ========================

export async function markArrived(bookingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('reservations')
        .update({ status: 'seated', attendance_status: 'arrived' })
        .eq('id', bookingId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/guests')
    revalidatePath('/dashboard/calendar')
    return { success: true }
}

// ========================
// Check penalty before booking
// ========================

export async function checkUserPenalty(userId: string): Promise<{
    isPenalized: boolean
    penaltyUntil: string | null
    noShowCount: number
}> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('users')
        .select('is_penalized, penalty_until, no_show_count')
        .eq('id', userId)
        .single()

    const now = new Date()
    const penaltyUntil = data?.penalty_until ? new Date(data.penalty_until) : null
    const isPenalized = data?.is_penalized === true && penaltyUntil !== null && penaltyUntil > now

    // Auto-lift expired penalties
    if (data?.is_penalized && penaltyUntil && penaltyUntil <= now) {
        await supabase
            .from('users')
            .update({ is_penalized: false, penalty_until: null })
            .eq('id', userId)
    }

    return {
        isPenalized,
        penaltyUntil: data?.penalty_until ?? null,
        noShowCount: data?.no_show_count ?? 0,
    }
}
