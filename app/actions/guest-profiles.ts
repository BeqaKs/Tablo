'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========================
// Flag a guest
// ========================

export async function flagGuest(data: {
    user_id: string
    restaurant_id: string
    flag_reason: string
    internal_notes?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('guest_profiles')
        .upsert({
            user_id: data.user_id,
            restaurant_id: data.restaurant_id,
            is_flagged: true,
            flag_reason: data.flag_reason,
            internal_notes: data.internal_notes ?? null,
        }, { onConflict: 'user_id,restaurant_id' })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/guests')
    return { success: true }
}

// ========================
// Unflag a guest
// ========================

export async function unflagGuest(userId: string, restaurantId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('guest_profiles')
        .update({ is_flagged: false, flag_reason: null })
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/guests')
    return { success: true }
}

// ========================
// Add internal note
// ========================

export async function updateGuestNote(userId: string, restaurantId: string, notes: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('guest_profiles')
        .upsert({
            user_id: userId,
            restaurant_id: restaurantId,
            internal_notes: notes,
        }, { onConflict: 'user_id,restaurant_id' })

    if (error) return { error: error.message }
    revalidatePath('/dashboard/guests')
    return { success: true }
}

// ========================
// Get guest profile
// ========================

export async function getGuestProfile(userId: string, restaurantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single()

    if (error) return { data: null, error: null } // not found = no profile yet
    return { data, error: null }
}

// ========================
// Get all flagged guests for a restaurant
// ========================

export async function getFlaggedGuests(restaurantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('guest_profiles')
        .select('*, users(id, full_name, email, phone, no_show_count)')
        .eq('restaurant_id', restaurantId)
        .eq('is_flagged', true)

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

// ========================
// Tags Management (Advanced CRM)
// ========================

export async function addGuestTag(userId: string, restaurantId: string, tag: string) {
    const supabase = await createClient()

    // First ensure profile exists
    const { data: profile } = await supabase
        .from('guest_profiles')
        .select('tags')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single();

    const tags = profile?.tags || [];
    if (!tags.includes(tag)) {
        tags.push(tag);
        const { error } = await supabase
            .from('guest_profiles')
            .upsert({
                user_id: userId,
                restaurant_id: restaurantId,
                tags: tags
            }, { onConflict: 'user_id,restaurant_id' })

        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/guests')
    return { success: true }
}

export async function removeGuestTag(userId: string, restaurantId: string, tag: string) {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('guest_profiles')
        .select('tags')
        .eq('user_id', userId)
        .eq('restaurant_id', restaurantId)
        .single();

    const tags = profile?.tags || [];
    if (tags.includes(tag)) {
        const newTags = tags.filter((t: string) => t !== tag);
        const { error } = await supabase
            .from('guest_profiles')
            .update({ tags: newTags })
            .eq('user_id', userId)
            .eq('restaurant_id', restaurantId);

        if (error) return { error: error.message }
    }

    revalidatePath('/dashboard/guests')
    return { success: true }
}
