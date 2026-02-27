'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all unique conversations (last message per phone number)
export async function getSmsInbox(restaurantId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], error: 'Not authenticated' }

    // In a real app, this would be a more complex SQL view or query. 
    // We'll get all messages and reduce them to unique threads.
    const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

    if (error) return { data: [], error: error.message }
    if (!data) return { data: [], error: null }

    const threadsMap = new Map<string, any[]>()

    data.forEach(msg => {
        if (!threadsMap.has(msg.guest_phone)) {
            threadsMap.set(msg.guest_phone, [])
        }
        threadsMap.get(msg.guest_phone)!.push(msg)
    })

    const threads = Array.from(threadsMap.entries()).map(([phone, messages]) => {
        return {
            phone,
            messages: messages.reverse(), // chronologically
            lastMessage: messages[0], // since original was sorted desc
        }
    })

    return { data: threads, error: null }
}

// Send SMS
export async function sendReplySms(restaurantId: string, phone: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // 1. Log to database
    const { data: msg, error: dbError } = await supabase
        .from('sms_messages')
        .insert({
            restaurant_id: restaurantId,
            guest_phone: phone,
            direction: 'outbound',
            content,
            status: 'pending' // will be updated when sent, but for demo assuming sent
        })
        .select()
        .single()

    if (dbError) return { error: dbError.message }

    // 2. Call real Twilio (simulated here)
    // await twilioClient.messages.create({ body: content, to: phone, from: myTwilioNumber })

    // Simulate successful send
    await supabase
        .from('sms_messages')
        .update({ status: 'delivered' })
        .eq('id', msg.id)

    revalidatePath('/dashboard/inbox')
    return { success: true }
}
