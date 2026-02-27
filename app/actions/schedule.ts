'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ========================
// Create a schedule override (block/release tables)
// ========================

export async function createScheduleOverride(data: {
    restaurant_id: string
    table_id?: string
    override_date: string
    start_time?: string
    end_time?: string
    status: 'blocked' | 'available'
    reason?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: override, error } = await supabase
        .from('schedule_overrides')
        .insert(data)
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/dashboard/schedule')
    return { data: override, error: null }
}

// ========================
// Delete a schedule override
// ========================

export async function deleteScheduleOverride(overrideId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('schedule_overrides')
        .delete()
        .eq('id', overrideId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/schedule')
    return { success: true }
}

// ========================
// Get overrides for a date range
// ========================

export async function getScheduleOverrides(restaurantId: string, fromDate: string, toDate: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('schedule_overrides')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('override_date', fromDate)
        .lte('override_date', toDate)
        .order('override_date', { ascending: true })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

// ========================
// Check if a table is blocked on a given date/time
// ========================

export async function isTableBlocked(
    tableId: string,
    restaurantId: string,
    date: string,
    time: string
): Promise<boolean> {
    const supabase = await createClient()

    const { data } = await supabase
        .from('schedule_overrides')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('override_date', date)
        .eq('status', 'blocked')
        .or(`table_id.is.null,table_id.eq.${tableId}`)
        .limit(1)

    return (data?.length ?? 0) > 0
}
