import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,   
    Preview,
    Section,
    Text,
} from '@react-email/components';
import * as React from 'react';

interface BookingConfirmationEmailProps {
    guestName: string;
    restaurantName: string;
    reservationTime: string; // Formatting to be done before passing, or here
    guestCount: number;
    restaurantAddress?: string;
    locale?: string; // 'en' or 'ka'
}

export const BookingConfirmationEmail = ({
    guestName,
    restaurantName,
    reservationTime,
    guestCount,
    restaurantAddress,
    locale = 'en',
}: BookingConfirmationEmailProps) => {
    const isKa = locale === 'ka';
    const previewText = isKa
        ? `თქვენი ჯავშნის მოთხოვნა გაგზავნილია რესტორანში ${restaurantName}`
        : `Your reservation request at ${restaurantName} has been received`;

    const title = isKa ? 'მოთხოვნა გაგზავნილია!' : 'Request Received!';
    const greeting = isKa ? `გამარჯობა ${guestName},` : `Hi ${guestName},`;

    const detailsHeader = isKa ? 'ჯავშნის დეტალები:' : 'Reservation Details:';
    const numGuests = isKa ? `${guestCount} სტუმარი` : `${guestCount} ${guestCount === 1 ? 'Guest' : 'Guests'}`;
    const dateText = isKa ? 'თარიღი და დრო:' : 'Date & Time:';
    const locationText = isKa ? 'ლოკაცია:' : 'Location:';

    const thankYou = isKa
        ? 'მადლობა რომ იყენებთ Tablo-ს!'
        : 'Thank you for booking with Tablo!';

    const footerNotes = isKa
        ? 'ეს არის დასტურის მოთხოვნა. თქვენ მიიღებთ ახალ შეტყობინებას როგორც კი რესტორანი დაადასტურებს თქვენს ჯავშანს.'
        : 'This is a pending request. You will receive another notification as soon as the restaurant confirms your reservation.';

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logoText}>Tablo</Text>
                    </Section>
                    <Heading style={h1}>{title}</Heading>
                    <Text style={text}>{greeting}</Text>
                    <Text style={text}>
                        {isKa
                            ? `თქვენი მაგიდის მოთხოვნა რესტორანში `
                            : `We have received your request for a table at `}
                        <strong>{restaurantName}</strong>
                        {isKa ? ' წარმატებით გაიგზავნა და ელოდება რესტორნის დასტურს.' : ' and it is currently awaiting confirmation from the restaurant.'}
                    </Text>

                    <Section style={detailsContainer}>
                        <Heading as="h2" style={h2}>
                            {detailsHeader}
                        </Heading>
                        <Text style={detailText}>
                            <strong>{dateText}</strong> <br />
                            {reservationTime}
                        </Text>
                        <Text style={detailText}>
                            <strong>{isKa ? 'სტუმრების რაოდენობა:' : 'Party Size:'}</strong> <br />
                            {numGuests}
                        </Text>
                        {restaurantAddress && (
                            <Text style={detailText}>
                                <strong>{locationText}</strong> <br />
                                {restaurantAddress}
                            </Text>
                        )}
                    </Section>

                    <Hr style={hr} />

                    <Text style={text}>{thankYou}</Text>
                    <Text style={footerText}>{footerNotes}</Text>
                </Container>
            </Body>
        </Html>
    );
};

export default BookingConfirmationEmail;

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const header = {
    padding: '24px 32px',
    backgroundColor: '#be123c', // Tablo Primary Red
    textAlign: 'center' as const,
};

const logoText = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
    letterSpacing: '1px',
};

const h1 = {
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '40px',
    margin: '32px 32px 16px',
    textAlign: 'center' as const,
};

const h2 = {
    color: '#1e293b',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 16px',
};

const text = {
    color: '#334155',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 32px 16px',
};

const detailsContainer = {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    margin: '24px 32px',
    padding: '24px',
    border: '1px solid #e2e8f0',
};

const detailText = {
    color: '#334155',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px',
};

const hr = {
    borderColor: '#e2e8f0',
    margin: '20px 32px',
};

const footerText = {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0 32px',
};
