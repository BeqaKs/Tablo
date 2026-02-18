import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { LocaleProvider } from '@/lib/locale-context';

const fontSans = Plus_Jakarta_Sans({
    variable: "--font-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata = {
    title: "Tablo - Premium Restaurant Reservations",
    description: "Book the finest restaurants in Tbilisi instantly.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ka">
            <body className={`${fontSans.variable} font-sans antialiased`}>
                <LocaleProvider>
                    {children}
                    <Toaster />
                </LocaleProvider>
            </body>
        </html>
    );
}
