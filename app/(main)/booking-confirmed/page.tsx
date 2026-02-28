'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { CalendarPlus, Share2, ChevronRight, PartyPopper, Clock, Users, MapPin, QrCode, Copy, Check, X, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';

function ConfirmedContent() {
    const searchParams = useSearchParams();
    const { t } = useLocale();
    const [confetti, setConfetti] = useState(false);
    const [qrUrl, setQrUrl] = useState('');
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const restaurant = searchParams.get('restaurant') || 'Restaurant';
    const date = searchParams.get('date') || '';
    const time = searchParams.get('time') || '';
    const guests = searchParams.get('guests') || '2';
    const bookingId = searchParams.get('id') || '';
    const address = searchParams.get('address') || '';
    const occasion = searchParams.get('occasion') || '';
    const slug = searchParams.get('slug') || '';

    useEffect(() => {
        setConfetti(true);
        const timer = setTimeout(() => setConfetti(false), 4500);
        if (bookingId) {
            const content = `tablo://booking/${bookingId}`;
            setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}&color=1a1a2e&bgcolor=ffffff&margin=8`);
        }
        return () => clearTimeout(timer);
    }, [bookingId]);

    const generateICS = () => {
        if (!date || !time) return;
        const start = new Date(`${date}T${time}`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().replace(/[-:]|\\.\\d{3}/g, '').slice(0, 15) + 'Z';
        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tablo//EN',
            'BEGIN:VEVENT',
            `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`,
            `SUMMARY:Dinner at ${restaurant}`,
            `DESCRIPTION:Your reservation at ${restaurant}. Booking ID: ${bookingId}`,
            `LOCATION:${address}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `tablo-${restaurant.replace(/\s/g, '-')}.ics`; a.click();
        URL.revokeObjectURL(url);
    };

    const formattedDate = date ? format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy') : '';

    const shareLink = slug
        ? `${typeof window !== 'undefined' ? window.location.origin : 'https://tablo.ge'}/restaurants/${slug}?ref=${bookingId}`
        : '';

    const shareText = `🍽️ Joining me for dinner at ${restaurant}?\n📅 ${formattedDate || date} at ${time}\n👥 ${guests} guests\n\nBook your spot: ${shareLink}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (_) { }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Dinner at ${restaurant}`,
                    text: shareText,
                    url: shareLink,
                });
            } catch (_) { }
        } else {
            handleCopyLink();
        }
    };

    const CONFETTI_COLORS = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center p-4 pt-20 pb-12">
            {/* Confetti */}
            {confetti && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {Array.from({ length: 70 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-${10 + Math.random() * 20}px`,
                                width: `${6 + Math.random() * 6}px`,
                                height: `${6 + Math.random() * 6}px`,
                                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                background: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${2.5 + Math.random() * 2}s`,
                                transform: `rotate(${Math.random() * 360}deg)`,
                                opacity: 0.85,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Share Modal */}
            {shareOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShareOpen(false)}>
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{t('bookings.confirmedPage.shareModalTitle')}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{t('bookings.confirmedPage.shareModalDesc')}</p>
                            </div>
                            <button onClick={() => setShareOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                                <X className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>

                        {/* Mini Ticket Preview */}
                        <div className="mx-6 mb-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="h-1.5 bg-gradient-to-r from-primary via-red-400 to-orange-400" />
                            <div className="bg-gray-50 px-4 py-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-lg">{restaurant[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{restaurant}</p>
                                    <p className="text-xs text-gray-500">{date} · {time} · {guests} guests</p>
                                </div>
                            </div>
                        </div>

                        {/* Who's Joining? Avatars */}
                        <div className="px-6 mb-5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('bookings.confirmedPage.whosJoining')}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center shadow-sm">
                                    <UserCircle2 className="w-5 h-5 text-white" />
                                </div>
                                {Array.from({ length: Math.min(Number(guests) - 1, 4) }).map((_, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-primary/40 hover:text-primary/40 transition-colors cursor-pointer">
                                        <span className="text-lg leading-none">+</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 pb-6 flex flex-col gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                            >
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">{t('bookings.confirmedPage.copyLink')}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{shareText.split('\n')[0]}</p>
                                </div>
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-400 group-hover:text-primary flex-shrink-0 transition-colors" />
                                )}
                            </button>

                            {'share' in navigator && (
                                <button
                                    onClick={handleNativeShare}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                                >
                                    <Share2 className="w-4 h-4" />
                                    {t('bookings.confirmedPage.shareVia')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-md w-full">
                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-50 rounded-full flex items-center justify-center mx-auto animate-scale-in shadow-lg shadow-green-100">
                            <PartyPopper className="h-12 w-12 text-green-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                        {t('bookings.confirmedPage.title')}
                    </h1>
                    <p className="text-gray-500 text-base">
                        {t('bookings.confirmedPage.subtitle').split('{restaurant}')[0]}
                        <span className="font-semibold text-gray-800">{restaurant}</span>
                        {t('bookings.confirmedPage.subtitle').split('{restaurant}')[1]}
                    </p>
                    {occasion && (
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full">
                            <span className="text-sm font-semibold text-primary">🎉 {occasion} — we&apos;ll make it special</span>
                        </div>
                    )}
                </div>

                {/* ===== BOARDING PASS TICKET ===== */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-100 overflow-hidden mb-4">
                    {/* Top gradient strip */}
                    <div className="h-1.5 bg-gradient-to-r from-primary via-red-400 to-orange-400" />

                    {/* Restaurant Name Banner */}
                    <div className="px-7 pt-6 pb-4 flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{t('bookings.confirmedPage.reservationAt')}</p>
                            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-tight">{restaurant}</h2>
                            {address && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{address}</p>}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-red-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-2xl font-black text-primary">{restaurant[0]}</span>
                        </div>
                    </div>

                    {/* Booking Details Grid */}
                    <div className="px-7 pb-5 grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{t('bookings.confirmedPage.date')}</p>
                            <p className="text-sm font-bold text-gray-900">{date ? format(new Date(date + 'T12:00:00'), 'MMM d, yyyy') : '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{t('bookings.confirmedPage.time')}</p>
                            <p className="text-sm font-bold text-gray-900">{time || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{t('bookings.confirmedPage.guests')}</p>
                            <p className="text-sm font-bold text-gray-900">{guests}</p>
                        </div>
                    </div>

                    {/* Torn-edge dashed divider */}
                    <div className="relative px-7">
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-gray-100 z-10" />
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50 border border-gray-100 z-10" />
                        <div className="border-t-2 border-dashed border-gray-200 w-full" />
                    </div>

                    {/* QR Code section */}
                    <div className="px-7 pt-5 pb-6">
                        {bookingId ? (
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1 flex items-center gap-1">
                                        <QrCode className="w-3 h-3" /> Scan at host stand
                                    </p>
                                    <p className="text-xs font-mono text-gray-500 mt-1">#{bookingId.slice(0, 8).toUpperCase()}</p>
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-full">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[11px] font-semibold text-green-700">Confirmed</span>
                                    </div>
                                </div>
                                {qrUrl ? (
                                    <img src={qrUrl} alt="Booking QR Code" className="w-24 h-24 rounded-2xl border border-gray-100 shadow-sm flex-shrink-0" />
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 flex-shrink-0">
                                        <QrCode className="w-8 h-8 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Reservation confirmed</p>
                                    <p className="text-xs text-gray-400">{t('bookings.confirmedPage.confirmationSent')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Button variant="outline" className="gap-2 rounded-2xl h-12 text-sm font-semibold border-gray-200" onClick={generateICS}>
                        <CalendarPlus className="h-4 w-4 text-primary" />
                        Add to Calendar
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2 rounded-2xl h-12 text-sm font-semibold border-gray-200 hover:border-primary/40 hover:text-primary transition-colors"
                        onClick={() => setShareOpen(true)}
                    >
                        <Share2 className="h-4 w-4 text-primary" />
                        Invite Friends
                    </Button>
                </div>

                <Button asChild className="w-full rounded-2xl h-12 gap-2 font-semibold shadow-md shadow-primary/20">
                    <Link href="/my-bookings">
                        {t('bookings.confirmedPage.viewBookings')} <ChevronRight className="h-4 w-4" />
                    </Link>
                </Button>

                <p className="text-center text-xs text-gray-400 mt-5">
                    {t('bookings.confirmedPage.confirmationSent')}
                </p>
            </div>
        </div>
    );
}

export default function BookingConfirmedPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50/30">
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <PartyPopper className="h-10 w-10 text-green-400" />
                    </div>
                    <p className="text-gray-400 font-medium">Loading your confirmation…</p>
                </div>
            </div>
        }>
            <ConfirmedContent />
        </Suspense>
    );
}
