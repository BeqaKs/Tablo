'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(
    userId: string,
    data: {
        full_name?: string
        phone?: string
        dietary_restrictions?: string[]
        preferred_cuisines?: string[]
        email_notifications?: boolean
        sms_notifications?: boolean
    }
) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/profile')
    return { success: true }
}

export async function getProfile(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        return { profile: null, error: error.message }
    }

    return { profile: data, error: null }
}
