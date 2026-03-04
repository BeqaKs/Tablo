'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, MessageSquare, X, Edit, CalendarPlus, Share2, QrCode, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { ka, enUS } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { cancelBooking, updateBookingDetails } from '@/app/actions/bookings';
import { toast } from 'sonner';
import { useLocale } from '@/lib/locale-context';
import Link from 'next/link';

interface BookingCardProps {
    booking: {
        id: string;
        reservation_time: string;
        guest_count: number;
        status: string;
        guest_notes?: string;
        occasion?: string;
        dietary_restrictions?: string;
        restaurants: {
            name: string;
            slug: string;
            address: string;
            cuisine_type?: string;
        };
        tables?: {
            table_number: string;
            capacity: number;
            zone_name?: string;
        };
    };
    isPast?: boolean;
}

export function BookingCard({ booking, isPast = false }: BookingCardProps) {
    const { t, locale } = useLocale();
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const [showModifyDialog, setShowModifyDialog] = useState(false);
    const [isModifying, setIsModifying] = useState(false);
    const [editNotes, setEditNotes] = useState(booking.guest_notes || '');
    const [editOccasion, setEditOccasion] = useState(booking.occasion || '');
    const [editDietary, setEditDietary] = useState(booking.dietary_restrictions || '');

    const reservationDate = new Date(booking.reservation_time);
    const isUpcoming = reservationDate > new Date();
    const dateLocale = locale === 'ka' ? ka : enUS;

    // Countdown timer
    const [countdown, setCountdown] = useState('');
    useEffect(() => {
        if (!isUpcoming) return;
        const update = () => {
            const diff = reservationDate.getTime() - Date.now();
            if (diff <= 0) { setCountdown('Now!'); return; }
            const days = Math.floor(diff / 86400000);
            const hrs = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            if (days > 0) setCountdown(`${days}${t('bookings.countdown.d')} ${hrs}${t('bookings.countdown.h')}`);
            else if (hrs > 0) setCountdown(`${hrs}${t('bookings.countdown.h')} ${mins}${t('bookings.countdown.m')}`);
            else setCountdown(`${mins} ${t('bookings.countdown.m')}`);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [isUpcoming, reservationDate]);

    // QR Code URL
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`tablo://booking/${booking.id}`)}`;

    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-green-100 text-green-800',
        seated: 'bg-blue-100 text-blue-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
        no_show: 'bg-orange-100 text-orange-800',
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        const result = await cancelBooking(booking.id);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(locale === 'ka' ? 'დაჯავშნა წარმატებით გაუქმდა' : 'Reservation cancelled successfully');
            setShowCancelDialog(false);
        }
        setIsCancelling(false);
    };

    const handleModify = async () => {
        setIsModifying(true);
        const result = await updateBookingDetails(booking.id, {
            guest_notes: editNotes,
            occasion: editOccasion,
            dietary_restrictions: editDietary,
        });

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(t('bookings.modifyDialog.success'));
            setShowModifyDialog(false);
        }
        setIsModifying(false);
    };

    const generateICS = () => {
        const start = reservationDate.toISOString().replace(/-|:|\.\d+/g, '');
        const end = new Date(reservationDate.getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
        const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:Reservation at ${booking.restaurants.name}\nLOCATION:${booking.restaurants.address}\nDESCRIPTION:Reservation for ${booking.guest_count} guests.\\nTable: ${booking.tables?.table_number || 'N/A'}\nEND:VEVENT\nEND:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservation-${booking.restaurants.slug.replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const shareBooking = () => {
        const text = `Join me for dinner at ${booking.restaurants.name} on ${format(reservationDate, 'MMM dd, yyyy', { locale: dateLocale })} at ${format(reservationDate, 'h:mm a', { locale: dateLocale })}.\nAddress: ${booking.restaurants.address}`;
        if (navigator.share) {
            navigator.share({
                title: `Dinner at ${booking.restaurants.name}`,
                text: text,
                url: window.location.origin + `/restaurants/${booking.restaurants.slug}`
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Invitation text copied to clipboard!');
        }
    };

    return (
        <>
            <Card className="rounded-[2rem] border-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_rgb(0,0,0,0.12)] hover:-translate-y-1">
                {/* Color strip based on status */}
                <div className={`h-2 w-full ${booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                    booking.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                        booking.status === 'seated' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                            booking.status === 'cancelled' ? 'bg-gray-300' :
                                'bg-gradient-to-r from-red-500 to-rose-600'
                    }`} />
                <div className="p-7">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold font-[family-name:var(--font-geist-sans)] tracking-tight mb-1">{booking.restaurants.name}</h3>
                            <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {booking.restaurants.address}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                                {t(`bookings.status.${booking.status}`)}
                            </Badge>
                            {isUpcoming && countdown && booking.status !== 'cancelled' && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wider">
                                    <Timer className="h-3 w-3" /> {t('bookings.countdown.in')} {countdown}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6 bg-gray-50/80 p-5 rounded-[1.25rem] border border-gray-100/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">{t('bookings.date')}</p>
                                <span className="font-bold text-sm text-gray-900">{format(reservationDate, 'MMM dd', { locale: dateLocale })}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                <Clock className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">{t('bookings.time')}</p>
                                <span className="font-bold text-sm text-gray-900">{format(reservationDate, 'h:mm a', { locale: dateLocale })}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">{booking.guest_count === 1 ? t('bookings.guest') : t('bookings.guests')}</p>
                                <span className="font-bold text-sm text-gray-900">{booking.guest_count}</span>
                            </div>
                        </div>
                        {booking.tables && (
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                    <MapPin className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">{t('bookings.table')}</p>
                                    <span className="font-bold text-sm text-gray-900">{booking.tables.table_number}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {booking.occasion && (
                        <div className="mb-3 p-4 bg-amber-50/50 border border-amber-100 rounded-[1.25rem]">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 shrink-0">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-xs text-amber-900/60 uppercase tracking-wider mb-0.5">{t('bookings.modifyDialog.occasion')}</p>
                                    <p className="font-medium text-amber-950">{booking.occasion}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {booking.dietary_restrictions && (
                        <div className="mb-3 p-4 bg-red-50/50 border border-red-100 rounded-[1.25rem]">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="bg-red-100 p-1.5 rounded-lg text-red-600 shrink-0">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-xs text-red-900/60 uppercase tracking-wider mb-0.5">{t('bookings.modifyDialog.dietary')}</p>
                                    <p className="font-medium text-red-950">{booking.dietary_restrictions}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {booking.guest_notes && (
                        <div className="mb-5 p-4 bg-blue-50/50 border border-blue-100 rounded-[1.25rem]">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600 shrink-0">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="font-bold text-xs text-blue-900/60 uppercase tracking-wider mb-0.5">{t('bookings.specialRequests')}</p>
                                    <p className="font-medium text-blue-950">{booking.guest_notes}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isPast && booking.status !== 'cancelled' && (
                        <div className="flex gap-3 mb-6">
                            <Button variant="outline" className="flex-1 rounded-full font-bold border-gray-200 hover:border-primary hover:text-primary transition-colors hover:bg-primary/5 text-xs py-5" onClick={generateICS}>
                                <CalendarPlus className="h-4 w-4 mr-1.5" />
                                {t('bookings.confirmedPage.addToCalendar')}
                            </Button>
                            <Button variant="outline" className="flex-1 rounded-full font-bold border-gray-200 hover:border-primary hover:text-primary transition-colors hover:bg-primary/5 text-xs py-5" onClick={shareBooking}>
                                <Share2 className="h-4 w-4 mr-1.5" />
                                {t('bookings.confirmedPage.inviteGuests')}
                            </Button>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-gray-100">
                        {!isPast && isUpcoming && booking.status !== 'cancelled' && (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-full font-bold border-gray-200 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    onClick={() => setShowCancelDialog(true)}
                                >
                                    <X className="h-4 w-4 mr-1.5" />
                                    {t('bookings.cancel')}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-full font-bold border-gray-200 hover:border-primary hover:text-primary transition-colors hover:bg-primary/5"
                                    onClick={() => setShowModifyDialog(true)}
                                >
                                    <Edit className="h-4 w-4 mr-1.5" />
                                    {t('bookings.modify')}
                                </Button>
                            </>
                        )}
                        <Button
                            className="flex-1 rounded-full font-bold bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-900/20 transition-all border-0 uppercase tracking-wider text-xs"
                            asChild
                        >
                            <Link href={`/restaurants/${booking.restaurants.slug}`}>
                                {t('bookings.viewRestaurant')}
                            </Link>
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Cancel Confirmation Dialog */}
            {showCancelDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-2">{t('bookings.cancelDialog.title')}</h3>
                        <p className="text-muted-foreground mb-4">
                            {t('bookings.cancelDialog.message')
                                .replace('{restaurant}', booking.restaurants.name)
                                .replace('{date}', format(reservationDate, 'MMM dd, yyyy', { locale: dateLocale }))
                                .replace('{time}', format(reservationDate, 'h:mm a', { locale: dateLocale }))
                            }
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">Reason for Cancellation ({t('common.optional')})</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                placeholder="Schedule conflict, illness, etc."
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowCancelDialog(false)}
                                disabled={isCancelling}
                            >
                                {t('bookings.cancelDialog.keep')}
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                onClick={handleCancel}
                                disabled={isCancelling}
                            >
                                {isCancelling ? t('bookings.cancelDialog.cancelling') : t('bookings.cancelDialog.confirm')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modify Dialog */}
            {showModifyDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">{t('bookings.modifyDialog.title')}</h3>
                        <div className="space-y-4 mb-6">
                            <p className="text-sm text-muted-foreground">{t('bookings.modifyDialog.description')}</p>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('bookings.modifyDialog.occasion')}</label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    value={editOccasion}
                                    onChange={e => setEditOccasion(e.target.value)}
                                >
                                    <option value="">None</option>
                                    <option value="Birthday">Birthday</option>
                                    <option value="Anniversary">Anniversary</option>
                                    <option value="Date Night">Date Night</option>
                                    <option value="Business">Business</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('bookings.modifyDialog.dietary')}</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    placeholder={t('bookings.modifyDialog.dietaryPlaceholder')}
                                    value={editDietary}
                                    onChange={e => setEditDietary(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">{t('bookings.modifyDialog.requests')}</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                                    placeholder={t('bookings.modifyDialog.requestsPlaceholder')}
                                    rows={3}
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowModifyDialog(false)}
                                disabled={isModifying}
                            >
                                {t('bookings.modifyDialog.cancel')}
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleModify}
                                disabled={isModifying}
                            >
                                {isModifying ? t('bookings.modifyDialog.saving') : t('bookings.modifyDialog.save')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
