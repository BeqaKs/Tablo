import {
    Body, Container, Head, Heading, Html, Preview,
    Section, Text, Button, Hr, Img
} from '@react-email/components'

interface StatusChangeEmailProps {
    guestName: string
    restaurantName: string
    reservationTime: string
    guestCount: number
    newStatus: 'confirmed' | 'cancelled' | 'no_show' | 'completed'
    restaurantAddress?: string
    locale?: string
}

const STATUS_LABELS: Record<string, Record<string, string>> = {
    en: {
        confirmed: '✅ Reservation Confirmed',
        cancelled: '❌ Reservation Cancelled',
        no_show: '⚠️ Marked as No-Show',
        completed: '🎉 We Hope You Enjoyed It!',
    },
    ka: {
        confirmed: '✅ ჯავშანი დადასტურებულია',
        cancelled: '❌ ჯავშანი გაუქმდა',
        no_show: '⚠️ No-Show სტატუსი',
        completed: '🎉 გმადლობთ, რომ ეწვიეთ!',
    },
}

const STATUS_MESSAGES: Record<string, Record<string, string>> = {
    en: {
        confirmed: 'Great news! Your reservation has been confirmed. We look forward to welcoming you.',
        cancelled: 'Your reservation has been cancelled. You can book again anytime on our website.',
        no_show: 'You were marked as a no-show for your reservation. Repeated no-shows may affect future bookings.',
        completed: 'Thank you for dining with us! We hope you had a wonderful experience.',
    },
    ka: {
        confirmed: 'შესანიშნავია! თქვენი ჯავშანი დადასტურდა. გველის თქვენ!',
        cancelled: 'თქვენი ჯავშანი გაუქმდა. ნებისმიერ დროს შეგიძლიათ ხელახლა დაჯავშნოთ.',
        no_show: 'თქვენ მონიშნეს no-show სტატუსით. გამეორებამ შეიძლება შეზღუდოს მომავალი ჯავშნები.',
        completed: 'გმადლობთ! ვიმედოვნებთ, რომ მოეწონათ.',
    },
}

export function StatusChangeEmail({
    guestName,
    restaurantName,
    reservationTime,
    guestCount,
    newStatus,
    restaurantAddress,
    locale = 'en',
}: StatusChangeEmailProps) {
    const l = locale === 'ka' ? 'ka' : 'en'
    const title = STATUS_LABELS[l][newStatus] ?? STATUS_LABELS.en[newStatus]
    const message = STATUS_MESSAGES[l][newStatus] ?? STATUS_MESSAGES.en[newStatus]

    return (
        <Html>
            <Head />
            <Preview>{title} – {restaurantName}</Preview>
            <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
                <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
                    {/* Header */}
                    <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <Heading style={{ fontSize: '28px', color: '#0f172a', margin: 0 }}>
                            Tablo
                        </Heading>
                        <Text style={{ color: '#6b7280', marginTop: '4px' }}>Restaurant Reservations</Text>
                    </Section>

                    {/* Card */}
                    <Section style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <Heading as="h2" style={{ fontSize: '22px', color: '#111827', marginTop: 0 }}>
                            {title}
                        </Heading>
                        <Text style={{ color: '#374151' }}>Hi {guestName},</Text>
                        <Text style={{ color: '#374151' }}>{message}</Text>

                        <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

                        <Text style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
                            <strong style={{ color: '#111827' }}>Restaurant:</strong> {restaurantName}
                        </Text>
                        <Text style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
                            <strong style={{ color: '#111827' }}>Date & Time:</strong> {reservationTime}
                        </Text>
                        <Text style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>
                            <strong style={{ color: '#111827' }}>Party Size:</strong> {guestCount} guest{guestCount !== 1 ? 's' : ''}
                        </Text>
                        {restaurantAddress && (
                            <Text style={{ color: '#6b7280', fontSize: '14px' }}>
                                <strong style={{ color: '#111827' }}>Address:</strong> {restaurantAddress}
                            </Text>
                        )}
                    </Section>

                    <Text style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px', marginTop: '24px' }}>
                        © {new Date().getFullYear()} Tablo. All rights reserved.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}
