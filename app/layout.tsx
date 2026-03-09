import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { LocaleProvider } from '@/lib/locale-context';
import { getDictionary } from '@/lib/get-dictionary';

const fontSans = Plus_Jakarta_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'Tablo - Premium Restaurant Reservations in Tbilisi',
        template: '%s | Tablo',
    },
    description: 'Discover and book the finest restaurants in Tbilisi, Georgia. Real-time availability, interactive floor plans, and instant confirmation. Your table awaits.',
    keywords: ['restaurant reservations', 'Tbilisi', 'Georgia', 'dining', 'book a table', 'fine dining', 'Georgian restaurants'],
    authors: [{ name: 'Tablo LLC' }],
    creator: 'Tablo',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://tablo.ge',
        siteName: 'Tablo',
        title: 'Tablo - Premium Restaurant Reservations',
        description: 'Discover and book the finest restaurants in Tbilisi instantly.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Tablo - Premium Restaurant Reservations',
        description: 'Book your perfect table in Tbilisi. Interactive floor plans, real-time availability.',
    },
    robots: {
        index: true,
        follow: true,
    },
    metadataBase: new URL('https://tablo.ge'),
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { locale } = await getDictionary();
    return (
        <html lang={locale}>
            <body className={`${fontSans.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
                <LocaleProvider>
                    {children}
                    <Toaster />
                </LocaleProvider>
            </body>
        </html>
    );
}
