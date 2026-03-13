import { NextResponse } from 'next/server';
import { getTBCPaymentDetails } from '@/lib/payments/tbc';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        // TBC usually appends the payId or it might be in the request params based on how they redirect.
        // We must extract it. Often it's passed as '?PaymentId=xxx' or similar. 
        // We should check exactly what the returnUrl receives. Let's assume 'payId' or 'PaymentId'.
        const payId = searchParams.get('payId') || searchParams.get('PaymentId');
        const bookingId = searchParams.get('bookingId'); 

        if (!payId) {
             // If payId is missing, something went wrong with the redirect
             return NextResponse.redirect(new URL('/payment/error?reason=missing_pay_id', req.url));
        }

        // Verify the ACTUAL payment status directly with TBC's backend
        // This is crucial for security so users can't just fake a successful redirect callback.
        const details = await getTBCPaymentDetails(payId);

        console.log(`TBC Callback Details for ${payId}:`, details);

        // Typical TBC Payment statuses: 'Created', 'Processing', 'Succeeded', 'Failed'
        const isSuccess = details.status === 'Succeeded';

        if (isSuccess) {
            // NOTE: Here you would update your database to mark the order/booking as paid.
            // e.g. 
            // const supabase = await createClient();
            // await supabase.from('bookings').update({ payment_status: 'paid' }).eq('id', bookingId);
            
            // Redirect user to a frontend success page Let's assume '/payment/success'
            return NextResponse.redirect(new URL(`/payment/success?bookingId=${bookingId}`, req.url));
        } else {
            // Payment failed or was cancelled
            console.warn(`TBC Payment ${payId} did not succeed. Status: ${details.status}`);
            return NextResponse.redirect(new URL(`/payment/error?reason=${details.status}`, req.url));
        }

    } catch (error: any) {
        console.error('TBC Callback Processing Error:', error);
        return NextResponse.redirect(new URL('/payment/error?reason=internal_error', req.url));
    }
}
