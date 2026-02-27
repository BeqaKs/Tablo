'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Share2, ChevronRight, PartyPopper, Clock, Users, MapPin, QrCode } from 'lucide-react';
import { format } from 'date-fns';

function ConfirmedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useLocale();
    const [confetti, setConfetti] = useState(false);
    const [qrUrl, setQrUrl] = useState('');

    const restaurant = searchParams.get('restaurant') || 'Restaurant';
    const date = searchParams.get('date') || '';
    const time = searchParams.get('time') || '';
    const guests = searchParams.get('guests') || '2';
    const bookingId = searchParams.get('id') || '';
    const address = searchParams.get('address') || '';
    const occasion = searchParams.get('occasion') || '';

    useEffect(() => {
        // Trigger confetti animation
        setConfetti(true);
        const timer = setTimeout(() => setConfetti(false), 4000);

        // Generate QR code URL using a free API
        if (bookingId) {
            const content = `tablo://booking/${bookingId}`;
            setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}`);
        }

        return () => clearTimeout(timer);
    }, [bookingId]);

    const generateICS = () => {
        if (!date || !time) return;
        const start = new Date(`${date}T${time}`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, '').slice(0, 15) + 'Z';

        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tablo//EN',
            'BEGIN:VEVENT',
            `DTSTART:${fmt(start)}`,
            `DTEND:${fmt(end)}`,
            `SUMMARY:Dinner at ${restaurant}`,
            `DESCRIPTION:Your reservation at ${restaurant}. Booking ID: ${bookingId}`,
            `LOCATION:${address}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tablo-reservation-${restaurant.replace(/\s/g, '-')}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const shareBooking = async () => {
        const text = `I just booked a table at ${restaurant} on ${date} at ${time} for ${guests} guests via Tablo! 🍽️`;
        if (navigator.share) {
            try { await navigator.share({ title: `Dinner at ${restaurant}`, text }); } catch (_) { }
        } else {
            await navigator.clipboard.writeText(text);
        }
    };

    const formattedDate = date ? format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy') : '';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center p-4 pt-24">
            {/* Confetti particles */}
            {confetti && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {Array.from({ length: 60 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 rounded-full animate-confetti-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${Math.random() * 20}px`,
                                background: ['#c0392b', '#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#f1c40f'][Math.floor(Math.random() * 7)],
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                                transform: `rotate(${Math.random() * 360}deg)`,
                            }}
                        />
                    ))}
                </div>
            )}

            <div className="max-w-md w-full">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                        <PartyPopper className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('bookings.confirmedPage.title')}</h1>
                    <p className="text-gray-500 text-lg">
                        {t('bookings.confirmedPage.subtitle').split('{restaurant}')[0]}
                        <span className="font-semibold text-gray-800">{restaurant}</span>
                        {t('bookings.confirmedPage.subtitle').split('{restaurant}')[1]}
                    </p>
                    {occasion && (
                        <p className="mt-2 text-primary font-medium">🎉 {t('bookings.confirmedPage.celebrationReady', { occasion })}</p>
                    )}
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-4">
                    {/* Top colored strip */}
                    <div className="h-2 bg-gradient-to-r from-primary via-red-400 to-orange-400" />

                    <div className="p-6 space-y-5">
                        {/* Booking Details */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <CalendarPlus className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 leading-none mb-0.5">{t('restaurant.date')} & {t('restaurant.time')}</p>
                                    <p className="font-semibold text-gray-900">{formattedDate} {t('common.at')} {time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <Users className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 leading-none mb-0.5">{t('restaurant.partySize')}</p>
                                    <p className="font-semibold text-gray-900">{guests} {Number(guests) === 1 ? t('bookings.guest') : t('bookings.guests')}</p>
                                </div>
                            </div>
                            {address && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                                    <div>
                                        <p className="text-xs text-gray-500 leading-none mb-0.5">{t('contact.infoAddress')}</p>
                                        <p className="font-semibold text-gray-900">{address}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* QR Code */}
                        {bookingId && (
                            <div className="border-t border-dashed border-gray-200 pt-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            <QrCode className="h-3.5 w-3.5" /> {t('bookings.confirmedPage.scanHostStand')}
                                        </p>
                                        <p className="text-[10px] font-mono text-gray-400">#{bookingId.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    {qrUrl ? (
                                        <img src={qrUrl} alt="Booking QR" className="h-20 w-20 rounded-lg border" />
                                    ) : (
                                        <div className="h-20 w-20 bg-gray-100 rounded-lg border flex items-center justify-center">
                                            <QrCode className="h-8 w-8 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button variant="outline" className="gap-2 rounded-xl h-12" onClick={generateICS}>
                        <Clock className="h-4 w-4 text-primary" />
                        {t('bookings.confirmedPage.addToCalendar')}
                    </Button>
                    <Button variant="outline" className="gap-2 rounded-xl h-12" onClick={shareBooking}>
                        <Share2 className="h-4 w-4 text-primary" />
                        {t('bookings.confirmedPage.inviteGuests')}
                    </Button>
                </div>

                <Button asChild className="w-full rounded-xl h-12 gap-2">
                    <Link href="/my-bookings">
                        {t('bookings.confirmedPage.viewBookings')} <ChevronRight className="h-4 w-4" />
                    </Link>
                </Button>

                <p className="text-center text-xs text-gray-400 mt-4">
                    {t('bookings.confirmedPage.confirmationSent')}
                </p>
            </div>
        </div>
    );
}

export default function BookingConfirmedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <PartyPopper className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-gray-500">Loading your confirmation...</p>
                </div>
            </div>
        }>
            <ConfirmedContent />
        </Suspense>
    );
}
