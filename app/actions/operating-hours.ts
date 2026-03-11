'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOwner } from './owner'

export type DayHours = {
    open: string
    close: string
    is_closed: boolean
}

export type OperatingHours = {
    mon: DayHours
    tue: DayHours
    wed: DayHours
    thu: DayHours
    fri: DayHours
    sat: DayHours
    sun: DayHours
}

export type BookingRules = {
    max_party_size: number
    max_advance_days: number
    min_lead_time_hours: number
    buffer_minutes: number
    auto_confirm: boolean
}

const DEFAULT_HOURS: OperatingHours = {
    mon: { open: '10:00', close: '23:00', is_closed: false },
    tue: { open: '10:00', close: '23:00', is_closed: false },
    wed: { open: '10:00', close: '23:00', is_closed: false },
    thu: { open: '10:00', close: '23:00', is_closed: false },
    fri: { open: '10:00', close: '00:00', is_closed: false },
    sat: { open: '10:00', close: '00:00', is_closed: false },
    sun: { open: '12:00', close: '22:00', is_closed: false },
}

const DEFAULT_RULES: BookingRules = {
    max_party_size: 20,
    max_advance_days: 90,
    min_lead_time_hours: 2,
    buffer_minutes: 15,
    auto_confirm: false,
}

// ========================
// Get Operating Hours
// ========================

export async function getOperatingHours() {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: null, error: authError || 'No restaurant' }

    const { data, error } = await supabase
        .from('restaurants')
        .select('operating_hours, booking_rules')
        .eq('id', restaurantId)
        .single()

    if (error) return { data: null, error: error.message }

    return {
        data: {
            operating_hours: (data?.operating_hours || DEFAULT_HOURS) as OperatingHours,
            booking_rules: (data?.booking_rules || DEFAULT_RULES) as BookingRules,
        },
        error: null
    }
}

// ========================
// Save Operating Hours
// ========================

export async function saveOperatingHours(hours: OperatingHours) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { error: authError || 'No restaurant' }

    const { error } = await supabase
        .from('restaurants')
        .update({ operating_hours: hours })
        .eq('id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}

// ========================
// Save Booking Rules
// ========================

export async function saveBookingRules(rules: BookingRules) {
    const { supabase, restaurantId, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { error: authError || 'No restaurant' }

    const { error } = await supabase
        .from('restaurants')
        .update({ booking_rules: rules })
        .eq('id', restaurantId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/settings')
    return { success: true }
}
