import { NextResponse } from 'next/server';
import { createTBCPayment } from '@/lib/payments/tbc';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // Example payload we expect from the frontend
        // {
        //    amount: 50.00,
        //    bookingId: "uuid-1234..." 
        // }

        if (!body.amount || isNaN(body.amount)) {
            return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
        }

        // We construct the absolute Return URL where TBC will redirect the user
        // We can pass the bookingId as a query parameter or custom identifier
        // to handle fulfilling the booking inside the callback.
        const origin = new URL(req.url).origin;
        const returnUrl = `${origin}/api/payments/tbc/callback?bookingId=${body.bookingId || 'unknown'}`;

        const paymentRes = await createTBCPayment({
            amount: Number(body.amount),
            returnUrl,
            // (Optional) additional properties from body...
        });

        // TBC returns an object containing "payId" and "links" array. 
        // We typically need to redirect the user to the link with uri describing the checkout page.
        // Usually, the first link in the array contains the redirect URI.
        const redirectLink = paymentRes.links?.find((l: any) => l.method === 'REDIRECT') || paymentRes.links?.[0];

        if (!redirectLink || !redirectLink.uri) {
             throw new Error("TBC API did not return a valid redirect URI");
        }

        return NextResponse.json({
            success: true,
            payId: paymentRes.payId,
            redirectUrl: redirectLink.uri, 
        });

    } catch (error: any) {
        console.error('TBC Initiate Payment Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to initiate TBC Payment' },
            { status: 500 }
        );
    }
}
