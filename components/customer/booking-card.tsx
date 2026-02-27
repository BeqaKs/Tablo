'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, MapPin, MessageSquare, X, Edit, CalendarPlus, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { ka, enUS } from 'date-fns/locale';
import { useState } from 'react';
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
            toast.success('Reservation details updated!');
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
            <Card className="premium-card p-6 hover:shadow-luxury smooth-transition">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold mb-1">{booking.restaurants.name}</h3>
                        <p className="text-sm text-muted-foreground">{booking.restaurants.cuisine_type}</p>
                    </div>
                    <Badge className={statusColors[booking.status] || 'bg-gray-100'}>
                        {t(`bookings.status.${booking.status}`)}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(reservationDate, 'MMM dd, yyyy', { locale: dateLocale })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(reservationDate, 'h:mm a', { locale: dateLocale })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.guest_count} {booking.guest_count === 1 ? t('bookings.guest') : t('bookings.guests')}</span>
                    </div>
                    {booking.tables && (
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{t('bookings.table')} {booking.tables.table_number} {booking.tables.zone_name && `(${booking.tables.zone_name})`}</span>
                        </div>
                    )}
                </div>

                {booking.occasion && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Occasion</p>
                                <p className="text-foreground">{booking.occasion}</p>
                            </div>
                        </div>
                    </div>
                )}

                {booking.dietary_restrictions && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Dietary Restrictions</p>
                                <p className="text-foreground">{booking.dietary_restrictions}</p>
                            </div>
                        </div>
                    </div>
                )}

                {booking.guest_notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">{t('bookings.specialRequests')}</p>
                                <p className="text-foreground">{booking.guest_notes}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!isPast && booking.status !== 'cancelled' && (
                    <div className="flex gap-2 mb-4">
                        <Button variant="outline" size="sm" className="flex-1" onClick={generateICS}>
                            <CalendarPlus className="h-4 w-4 mr-2 text-primary" />
                            Add to Calendar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={shareBooking}>
                            <Share2 className="h-4 w-4 mr-2 text-primary" />
                            Invite Guests
                        </Button>
                    </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t">
                    {!isPast && isUpcoming && booking.status !== 'cancelled' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setShowCancelDialog(true)}
                            >
                                <X className="h-4 w-4 mr-2" />
                                {t('bookings.cancel')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setShowModifyDialog(true)}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                {t('bookings.modify')}
                            </Button>
                        </>
                    )}
                    <Button
                        size="sm"
                        className="flex-1 bg-primary hover:bg-tablo-red-600"
                        asChild
                    >
                        <Link href={`/restaurants/${booking.restaurants.slug}`}>
                            {t('bookings.viewRestaurant')}
                        </Link>
                    </Button>
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
                            <label className="block text-sm font-medium mb-2">Reason for Cancellation (Optional)</label>
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
                        <h3 className="text-xl font-bold mb-4">Modify Booking Details</h3>
                        <div className="space-y-4 mb-6">
                            <p className="text-sm text-muted-foreground">To change the date, time, or table, please cancel this booking and create a new reservation.</p>

                            <div>
                                <label className="block text-sm font-medium mb-1">Occasion</label>
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
                                <label className="block text-sm font-medium mb-1">Dietary Restrictions</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2 text-sm"
                                    placeholder="e.g. Vegan, Nut Allergy"
                                    value={editDietary}
                                    onChange={e => setEditDietary(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Special Requests</label>
                                <textarea
                                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                                    placeholder="Any special notes for the host?"
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
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleModify}
                                disabled={isModifying}
                            >
                                {isModifying ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
