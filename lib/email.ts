import { Resend } from 'resend';
import { render } from '@react-email/components';
import { BookingConfirmationEmail } from '@/components/emails/booking-confirmation';
import { StatusChangeEmail } from '@/components/emails/status-change';
import { ReminderEmail } from '@/components/emails/reminder';

const FROM = 'Tablo <hello@tablo.ge>';

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

export async function sendReviewRequestEmail({
    to, guestName, restaurantName, reviewUrl, locale = 'en'
}: {
    to: string; guestName: string; restaurantName: string;
    reviewUrl: string; locale?: string;
}) {
    const resend = getResend();
    if (!resend) return { success: false, message: 'Skipped' };
    try {
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">How was your experience at ${restaurantName}?</h2>
                <p style="color: #555;">Hi ${guestName},</p>
                <p style="color: #555;">We hope you enjoyed your recent visit to <strong>${restaurantName}</strong>.</p>
                <p style="color: #555;">We'd love to hear about your experience! Your feedback helps the restaurant improve and helps other guests discover great food.</p>
                <div style="margin: 30px 0;">
                    <a href="${reviewUrl}" style="background-color: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Leave a Review
                    </a>
                </div>
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                    Powered by Tablo
                </p>
            </div>
        `;
        const subject = locale === 'ka'
            ? `როგორ შეაფასებდით ${restaurantName}-ს?`
            : `How was your visit to ${restaurantName}?`;

        const data = await resend.emails.send({
            from: FROM,
            to: [to],
            subject,
            html,
        });
        if (data.error) return { success: false, error: data.error };
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send review email:', error);
        return { success: false, error };
    }
}
