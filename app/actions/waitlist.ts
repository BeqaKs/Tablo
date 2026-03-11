'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendSMS } from '@/lib/sms'

const CLAIM_WINDOW_MINUTES = 15

// ========================
// Join waitlist
// ========================

export async function calculateWaitTime(restaurantId: string, partySize: number, requestedTime: string) {
    const supabase = await createClient()

    // Count how many people are currently waiting
    const { count } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('requested_time', requestedTime)
        .in('status', ['waiting', 'offered'])

    const position = (count ?? 0)

    // Base rule: 15 minutes + 10 mins per party ahead
    const quoteTime = 15 + (position * 10)

    return { data: quoteTime, error: null }
}

export async function joinWaitlist(data: {
    restaurant_id: string
    party_size: number
    requested_time: string
    guest_name?: string
    guest_phone?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Determine next position
    const { count } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', data.restaurant_id)
        .eq('requested_time', data.requested_time)
        .in('status', ['waiting', 'offered'])

    const position = (count ?? 0) + 1

    // Calculate quote time 
    const quoted_wait_time = 15 + ((position - 1) * 10)

    const { data: entry, error } = await supabase
        .from('waitlist')
        .insert({
            ...data,
            user_id: user?.id ?? null,
            position,
            status: 'waiting',
            quoted_wait_time
        })
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath(`/restaurants`)
    return { data: entry, error: null }
}

// ========================
// Leave / cancel waitlist
// ========================

export async function leaveWaitlist(waitlistId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('waitlist')
        .update({ status: 'cancelled' })
        .eq('id', waitlistId)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/my-waitlist')
    return { success: true }
}

// ========================
// Promote next in waitlist (called when a booking is cancelled)
// ========================

export async function promoteFromWaitlist(restaurantId: string, requestedTime: string) {
    const supabase = await createClient()

    // Find the first 'waiting' entry for this slot
    const { data: next, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('requested_time', requestedTime)
        .eq('status', 'waiting')
        .order('position', { ascending: true })
        .limit(1)
        .single()

    if (error || !next) return { data: null, error: 'No one on waitlist' }

    const expiresAt = new Date(Date.now() + CLAIM_WINDOW_MINUTES * 60 * 1000).toISOString()

    const { error: updateError } = await supabase
        .from('waitlist')
        .update({
            status: 'offered',
            offered_at: new Date().toISOString(),
            expires_at: expiresAt,
        })
        .eq('id', next.id)

    if (updateError) return { error: updateError.message }

    // Fetch restaurant setting for SMS
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('sms_enabled')
        .eq('id', restaurantId)
        .single();

    // Notify the promoted person via SMS if they have a phone and SMS is enabled
    if (next.guest_phone && restaurant?.sms_enabled) {
        sendSMS(next.guest_phone, 'waitlist_offer', {
            to: next.guest_phone,
            guestName: next.guest_name || 'Guest',
        }).catch(console.error)
    }

    return { data: next, expiresAt, error: null }
}

// ========================
// Claim a waitlist spot
// ========================

export async function claimWaitlistSpot(waitlistId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Check it's still valid
    const { data: entry } = await supabase
        .from('waitlist')
        .select('*')
        .eq('id', waitlistId)
        .single()

    if (!entry) return { error: 'Waitlist entry not found' }
    if (entry.status !== 'offered') return { error: 'Spot is no longer available' }
    if (entry.expires_at && new Date(entry.expires_at) < new Date())
        return { error: 'Your claim window has expired' }

    const { error } = await supabase
        .from('waitlist')
        .update({ status: 'claimed' })
        .eq('id', waitlistId)

    if (error) return { error: error.message }
    revalidatePath('/my-waitlist')
    return { success: true, entry }
}

// ========================
// Get user's waitlist entries
// ========================

export async function getMyWaitlist() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('waitlist')
        .select('*, restaurants(id, name, slug, address)')
        .eq('user_id', user.id)
        .in('status', ['waiting', 'offered'])
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

// ========================
// Get waitlist for a restaurant/time slot (owner)
// ========================

export async function getRestaurantWaitlist(restaurantId: string, requestedTime?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('waitlist')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['waiting', 'offered'])
        .order('position', { ascending: true })

    if (requestedTime) query = query.eq('requested_time', requestedTime)

    const { data, error } = await query

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

// ========================
// Hostess Panel Actions
// ========================

export async function getLiveWaitlist() {
    const { requireOwner } = await import('./owner');
    const { supabase, restaurantId, error: authError } = await requireOwner();
    
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' };

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['waiting', 'offered']) // Include offered to show they were recently pinged
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function addWalkInToWaitlist(guestName: string, guestPhone: string, partySize: number) {
    const { requireOwner } = await import('./owner');
    const { supabase, restaurantId, error: authError } = await requireOwner();
    
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant found' };

    const { data, error } = await supabase
        .from('waitlist')
        .insert({
            restaurant_id: restaurantId,
            guest_name: guestName,
            guest_phone: guestPhone || null,
            party_size: partySize,
            status: 'waiting',
            requested_time: new Date().toISOString()
        })
        .select()
        .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
}

export async function updateWaitlistStatusOwner(id: string, status: 'offered' | 'claimed' | 'expired' | 'cancelled') {
    const { requireOwner } = await import('./owner');
    const { supabase, error: authError } = await requireOwner();
    
    if (authError) return { error: authError };

    const updateData: any = { status };
    if (status === 'offered') updateData.offered_at = new Date().toISOString();

    const { error } = await supabase
        .from('waitlist')
        .update(updateData)
        .eq('id', id);

    if (error) return { error: error.message };
    return { error: null };
}

