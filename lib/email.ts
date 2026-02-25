import { Resend } from 'resend';
import { render } from '@react-email/components';
import { BookingConfirmationEmail } from '@/components/emails/booking-confirmation';


export async function sendBookingConfirmation({
    to,
    guestName,
    restaurantName,
    reservationTime,
    guestCount,
    restaurantAddress,
    locale = 'en'
}: {
    to: string;
    guestName: string;
    restaurantName: string;
    reservationTime: string;
    guestCount: number;
    restaurantAddress?: string;
    locale?: string;
}) {
    // If no API key configured, don't crash, just gracefully skip
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email dispatch.');
        return { success: false, message: 'Skipped' };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const emailHtml = await render(BookingConfirmationEmail({
            guestName,
            restaurantName,
            reservationTime,
            guestCount,
            restaurantAddress,
            locale
        }));

        const subject = locale === 'ka'
            ? `ჯავშანი დადასტურებულია: ${restaurantName}`
            : `Reservation Confirmed: ${restaurantName}`;

        const data = await resend.emails.send({
            from: 'Tablo Reservations <no-reply@tablo.ge>', // Assuming this domain. Usually needs to be a verified domain in Resend
            to: [to],
            subject: subject,
            html: emailHtml,
        });

        if (data.error) {
            console.error('Resend error:', data.error);
            return { success: false, error: data.error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
}
