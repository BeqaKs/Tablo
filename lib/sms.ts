// lib/sms.ts
// Twilio SMS integration for booking notifications
// Gracefully no-ops when TWILIO_* env vars are not set

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER

export interface SMSPayload {
    to: string
    guestName?: string
    restaurantName?: string
    reservationTime?: string
    partySize?: number
    confirmUrl?: string
    cancelUrl?: string
}

function buildMessage(template: 'confirmation' | 'reminder' | 'cancelled' | 'waitlist_offer', payload: SMSPayload): string {
    const { guestName = 'Guest', restaurantName = 'the restaurant', reservationTime = '', partySize = 1 } = payload

    switch (template) {
        case 'confirmation':
            return `Hi ${guestName}! Your reservation at ${restaurantName} for ${partySize} on ${reservationTime} is confirmed. We look forward to seeing you! – Tablo`
        case 'reminder':
            return `Reminder: You have a reservation at ${restaurantName} for ${partySize} on ${reservationTime}.${payload.confirmUrl ? ` Confirm: ${payload.confirmUrl}` : ''}${payload.cancelUrl ? ` | Cancel: ${payload.cancelUrl}` : ''} – Tablo`
        case 'cancelled':
            return `Your reservation at ${restaurantName} on ${reservationTime} has been cancelled. Book again at tablo.ge – Tablo`
        case 'waitlist_offer':
            return `Great news, ${guestName}! A table at ${restaurantName} for ${reservationTime} is now available. You have 15 minutes to claim it.${payload.confirmUrl ? ` Claim: ${payload.confirmUrl}` : ''} – Tablo`
    }
}

export async function sendSMS(
    to: string,
    template: 'confirmation' | 'reminder' | 'cancelled' | 'waitlist_offer',
    payload: SMSPayload
): Promise<{ success: boolean; error?: string }> {
    if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
        console.warn('[SMS] Twilio credentials not set. Skipping SMS dispatch.')
        return { success: false, error: 'Twilio credentials not configured' }
    }

    // Normalize phone number
    const normalizedTo = to.startsWith('+') ? to : `+${to.replace(/[^\d]/g, '')}`
    if (normalizedTo.length < 8) {
        return { success: false, error: 'Invalid phone number' }
    }

    const body = buildMessage(template, payload)

    try {
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    From: FROM_NUMBER,
                    To: normalizedTo,
                    Body: body,
                }).toString(),
            }
        )

        if (!response.ok) {
            const err = await response.json()
            console.error('[SMS] Twilio error:', err)
            return { success: false, error: err.message }
        }

        return { success: true }
    } catch (error: any) {
        console.error('[SMS] Failed to send:', error)
        return { success: false, error: error.message }
    }
}
