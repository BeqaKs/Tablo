import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    // Instantiate inside the handler to prevent build-time crashes if env vars are missing
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key_for_build'
    );
    try {
        // Twilio sends data as form URL encoded
        const text = await req.text();
        const params = new URLSearchParams(text);

        const from = params.get('From'); // e.g., +1234567890
        const to = params.get('To');
        const body = params.get('Body');

        if (!from || !body) {
            return new NextResponse('Missing From or Body', { status: 400 });
        }

        // To log this message, we need to know WHICH restaurant it belongs to.
        // In a real app with 1 Twilio number per restaurant, we match `to` -> restaurant_id.
        // Here, we try to find the restaurant based on the guest's recent booking or waitlist.

        let restaurantId = null;

        // Strip non-digits for matching
        const phoneDigits = from.replace(/\D/g, '');

        const { data: profiles } = await supabase
            .from('guest_profiles')
            .select('restaurant_id')
            .like('phone', `%${phoneDigits}%`)
            .order('last_visit_date', { ascending: false })
            .limit(1);

        if (profiles && profiles.length > 0) {
            restaurantId = profiles[0].restaurant_id;
        }

        // If we still didn't find a restaurant, we can't properly log it for the owner unless we put it in a global queue.
        // For the sake of the demo, if we don't find it, we'll just drop it or log an error.
        if (!restaurantId) {
            console.warn(`Received SMS from ${from} but couldn't map to a restaurant.`);
            return new NextResponse('OK', { status: 200 }); // Still return ok to Twilio
        }

        // Insert into sms_messages
        await supabase.from('sms_messages').insert({
            restaurant_id: restaurantId,
            guest_phone: from,
            direction: 'inbound',
            content: body,
            status: 'received'
        });

        // TwiML response (empty, no auto-reply, we just consume it)
        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

        return new NextResponse(twiml, {
            status: 200,
            headers: {
                'Content-Type': 'text/xml'
            }
        });

    } catch (error: any) {
        console.error('Twilio Webhook Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
