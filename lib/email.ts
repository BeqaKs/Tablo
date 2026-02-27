import { Resend } from 'resend';
import { render } from '@react-email/components';
import { BookingConfirmationEmail } from '@/components/emails/booking-confirmation';
import { StatusChangeEmail } from '@/components/emails/status-change';
import { ReminderEmail } from '@/components/emails/reminder';

const FROM = 'Tablo <onboarding@resend.dev>';

function getResend() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

export async function sendBookingConfirmation({
    to, guestName, restaurantName, reservationTime, guestCount, restaurantAddress, locale = 'en'
}: {
    to: string; guestName: string; restaurantName: string;
    reservationTime: string; guestCount: number;
    restaurantAddress?: string; locale?: string;
}) {
    const resend = getResend();
    if (!resend) {
        console.warn('RESEND_API_KEY is not set. Skipping email dispatch.');
        return { success: false, message: 'Skipped' };
    }
    try {
        const html = await render(BookingConfirmationEmail({ guestName, restaurantName, reservationTime, guestCount, restaurantAddress, locale }));
        const subject = locale === 'ka'
            ? `ჯავშნის მოთხოვნა გაგზავნილია: ${restaurantName}`
            : `Reservation Request Received: ${restaurantName}`;
        const data = await resend.emails.send({ from: FROM, to: [to], subject, html });
        if (data.error) return { success: false, error: data.error };
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send confirmation email:', error);
        return { success: false, error };
    }
}

export async function sendStatusChangeEmail({
    to, guestName, restaurantName, reservationTime, guestCount,
    newStatus, restaurantAddress, locale = 'en'
}: {
    to: string; guestName: string; restaurantName: string;
    reservationTime: string; guestCount: number;
    newStatus: 'confirmed' | 'cancelled' | 'no_show' | 'completed';
    restaurantAddress?: string; locale?: string;
}) {
    const resend = getResend();
    if (!resend) return { success: false, message: 'Skipped' };
    try {
        const html = await render(StatusChangeEmail({ guestName, restaurantName, reservationTime, guestCount, newStatus, restaurantAddress, locale }));
        const statusLabel = { confirmed: 'Confirmed', cancelled: 'Cancelled', no_show: 'No-Show', completed: 'Completed' }[newStatus];
        const data = await resend.emails.send({
            from: FROM,
            to: [to],
            subject: `Reservation ${statusLabel}: ${restaurantName}`,
            html,
        });
        if (data.error) return { success: false, error: data.error };
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send status change email:', error);
        return { success: false, error };
    }
}

export async function sendReminderEmail({
    to, guestName, restaurantName, reservationTime, guestCount,
    restaurantAddress, confirmUrl, cancelUrl, hoursAway, locale = 'en'
}: {
    to: string; guestName: string; restaurantName: string;
    reservationTime: string; guestCount: number;
    restaurantAddress?: string; confirmUrl?: string; cancelUrl?: string;
    hoursAway: 24 | 2; locale?: string;
}) {
    const resend = getResend();
    if (!resend) return { success: false, message: 'Skipped' };
    try {
        const html = await render(ReminderEmail({ guestName, restaurantName, reservationTime, guestCount, restaurantAddress, confirmUrl, cancelUrl, hoursAway, locale }));
        const data = await resend.emails.send({
            from: FROM,
            to: [to],
            subject: `Reminder (${hoursAway}h): Your table at ${restaurantName}`,
            html,
        });
        if (data.error) return { success: false, error: data.error };
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send reminder email:', error);
        return { success: false, error };
    }
}
