import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReviewRequestEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
    // Basic auth check for cron jobs if needed
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // We use service role key if available to bypass RLS, otherwise anon key might not see all bookings
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Find reservations that are completed, ended > 2 hours ago, and no review email sent yet
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        const { data: reservations, error } = await supabase
            .from('reservations')
            .select(`
                id, 
                guest_name,
                end_time,
                restaurants:restaurant_id (name, slug),
                users:user_id (email, full_name)
            `)
            .eq('status', 'completed')
            .eq('review_email_sent', false)
            .lte('end_time', twoHoursAgo)
            .limit(50); // Batch limit

        if (error) {
            console.error('Error fetching reservations for reviews:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!reservations || reservations.length === 0) {
            return NextResponse.json({ message: 'No eligible reservations found for review requests.' });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        let sentCount = 0;

        for (const res of reservations) {
            const restaurant = Array.isArray(res.restaurants) ? res.restaurants[0] : res.restaurants;
            const user = Array.isArray(res.users) ? res.users[0] : res.users;

            // Only send if we have a valid email
            const guestEmail = user?.email;
            if (guestEmail && restaurant) {
                const guestName = res.guest_name || user?.full_name || 'Guest';
                const reviewUrl = `${appUrl}/restaurants/${restaurant.slug}/review?bookingId=${res.id}`;

                await sendReviewRequestEmail({
                    to: guestEmail,
                    guestName: guestName,
                    restaurantName: restaurant.name,
                    reviewUrl
                });

                // Mark as sent
                await supabase
                    .from('reservations')
                    .update({ review_email_sent: true })
                    .eq('id', res.id);

                sentCount++;
            } else {
                // Mark as sent to avoid stalling queue on missing email
                await supabase
                    .from('reservations')
                    .update({ review_email_sent: true })
                    .eq('id', res.id);
            }
        }

        return NextResponse.json({ success: true, processed: reservations.length, sentEmails: sentCount });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
