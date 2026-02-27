import {
    Body, Container, Head, Heading, Html, Preview,
    Section, Text, Button, Hr
} from '@react-email/components'

interface ReminderEmailProps {
    guestName: string
    restaurantName: string
    reservationTime: string
    guestCount: number
    restaurantAddress?: string
    confirmUrl?: string
    cancelUrl?: string
    hoursAway: 24 | 2
    locale?: string
}

export function ReminderEmail({
    guestName,
    restaurantName,
    reservationTime,
    guestCount,
    restaurantAddress,
    confirmUrl,
    cancelUrl,
    hoursAway,
    locale = 'en',
}: ReminderEmailProps) {
    const isKa = locale === 'ka'
    const title = isKa
        ? `⏰ შეხსენება: ${hoursAway} საათში`
        : `⏰ Reminder: ${hoursAway} hours away`

    return (
        <Html>
            <Head />
            <Preview>{title} – {restaurantName}</Preview>
            <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'system-ui, sans-serif' }}>
                <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '40px 20px' }}>
                    <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <Heading style={{ fontSize: '28px', color: '#0f172a', margin: 0 }}>Tablo</Heading>
                        <Text style={{ color: '#6b7280', marginTop: '4px' }}>Restaurant Reservations</Text>
                    </Section>

                    <Section style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <Heading as="h2" style={{ fontSize: '22px', color: '#111827', marginTop: 0 }}>
                            {title}
                        </Heading>
                        <Text style={{ color: '#374151' }}>
                            {isKa
                                ? `გამარჯობა ${guestName}! არ დაგავიწყდეთ თქვენი ჯავშანი.`
                                : `Hi ${guestName}! Don't forget your upcoming reservation.`}
                        </Text>

                        <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />

                        <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            <strong style={{ color: '#111827' }}>Restaurant:</strong> {restaurantName}
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            <strong style={{ color: '#111827' }}>Time:</strong> {reservationTime}
                        </Text>
                        <Text style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            <strong style={{ color: '#111827' }}>Party:</strong> {guestCount} guest{guestCount !== 1 ? 's' : ''}
                        </Text>
                        {restaurantAddress && (
                            <Text style={{ fontSize: '14px', color: '#6b7280' }}>
                                <strong style={{ color: '#111827' }}>Address:</strong> {restaurantAddress}
                            </Text>
                        )}

                        {(confirmUrl || cancelUrl) && (
                            <Section style={{ marginTop: '28px', display: 'flex', gap: '12px' }}>
                                {confirmUrl && (
                                    <Button
                                        href={confirmUrl}
                                        style={{
                                            background: '#16a34a', color: '#fff',
                                            borderRadius: '8px', padding: '12px 24px',
                                            fontSize: '14px', fontWeight: '600',
                                            textDecoration: 'none', marginRight: '12px',
                                        }}
                                    >
                                        {isKa ? 'დადასტურება' : 'Confirm'}
                                    </Button>
                                )}
                                {cancelUrl && (
                                    <Button
                                        href={cancelUrl}
                                        style={{
                                            background: '#f3f4f6', color: '#374151',
                                            borderRadius: '8px', padding: '12px 24px',
                                            fontSize: '14px', fontWeight: '600',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        {isKa ? 'გაუქმება' : 'Cancel'}
                                    </Button>
                                )}
                            </Section>
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
