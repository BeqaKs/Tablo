'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireOwner } from './owner'

export async function getStaff() {
    const { supabase, restaurantId, role, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { data: [], error: authError || 'No restaurant found' }

    // Only owners and maybe managers can view the full staff list
    if (role !== 'owner' && role !== 'manager') {
        return { data: [], error: 'Not authorized to view staff list' }
    }

    const { data, error } = await supabase
        .from('staff_roles')
        .select(`
            id,
            role,
            created_at,
            user_id,
            users:user_id(email, full_name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data: data || [], error: null }
}

export async function addStaff(email: string, targetRole: 'manager' | 'host') {
    const { supabase, restaurantId, role, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { error: authError || 'No restaurant found' }

    if (role !== 'owner') {
        return { error: 'Only the restaurant owner can add staff members' }
    }

    // Call securely definer RPC
    const { data, error } = await supabase.rpc('add_staff_member', {
        p_restaurant_id: restaurantId,
        p_email: email.trim().toLowerCase(),
        p_role: targetRole
    })

    if (error) return { error: error.message }

    if (data && data.error) return { error: data.error }

    revalidatePath('/dashboard/staff')
    return { success: true }
}

export async function removeStaff(staffRoleId: string) {
    const { supabase, restaurantId, role, error: authError } = await requireOwner()
    if (authError || !restaurantId) return { error: authError || 'No restaurant found' }

    if (role !== 'owner') {
        return { error: 'Only the restaurant owner can remove staff members' }
    }

    const { error } = await supabase
        .from('staff_roles')
        .delete()
        .eq('id', staffRoleId)
        .eq('restaurant_id', restaurantId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/staff')
    return { success: true }
}
