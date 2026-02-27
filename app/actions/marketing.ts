'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all campaigns for a restaurant
export async function getCampaigns(restaurantId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'Not authenticated' }

    const { data, error } = await supabase
        .from('automated_campaigns')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data, error: null }
}

// Create a new campaign
export async function createCampaign(data: {
    restaurant_id: string
    name: string
    trigger_type: 'lapsed_customer' | 'birthday' | 'anniversary'
    trigger_condition: any
    message_template: string
    is_active: boolean
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('automated_campaigns')
        .insert(data)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/marketing')
    return { success: true }
}

// Toggle campaign status
export async function toggleCampaignStatus(campaignId: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('automated_campaigns')
        .update({ is_active: isActive })
        .eq('id', campaignId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/marketing')
    return { success: true }
}

// Delete campaign
export async function deleteCampaign(campaignId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automated_campaigns')
        .delete()
        .eq('id', campaignId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/marketing')
    return { success: true }
}

export async function getLapsedCustomers(restaurantId: string, daysLapsed: number) {
    const supabase = await createClient()

    // Date X days ago
    const lapsedDate = new Date()
    lapsedDate.setDate(lapsedDate.getDate() - daysLapsed)

    const { data, error } = await supabase
        .from('guest_profiles')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .not('last_visit_date', 'is', null)
        .lt('last_visit_date', lapsedDate.toISOString())
        .order('last_visit_date', { ascending: false })

    if (error) return { data: [], error: error.message }
    return { data, error: null }
}
