'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { getOwnerBookings } from '@/app/actions/owner';
import { toast } from 'sonner';
import { Loader2, User, Phone, CalendarDays, History } from 'lucide-react';

export default function OwnerGuestsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const { data, error } = await getOwnerBookings();
        if (error) toast.error(error);
        if (data) setBookings(data);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Process unique guests CRM
    const guestsMap = new Map<string, any>();
    bookings.forEach(b => {
        // We use phone or email as key if possible, else guest_name
        const key = b.guest_phone || b.guest_email || b.guest_name;
        if (!key) return;

        if (!guestsMap.has(key)) {
            guestsMap.set(key, {
                guest_name: b.guest_name,
                guest_phone: b.guest_phone,
                guest_email: b.guest_email,
                totalVisits: 0,
                cancelled: 0,
                noShow: 0,
                firstVisit: b.reservation_time,
                lastVisit: b.reservation_time,
                history: []
            });
        }

        const guestInfo = guestsMap.get(key);
        guestInfo.history.push(b);
        guestInfo.totalVisits += 1;
        if (b.status === 'cancelled') guestInfo.cancelled += 1;
        if (b.status === 'no_show') guestInfo.noShow += 1;

        if (new Date(b.reservation_time) < new Date(guestInfo.firstVisit)) {
            guestInfo.firstVisit = b.reservation_time;
        }
        if (new Date(b.reservation_time) > new Date(guestInfo.lastVisit)) {
            guestInfo.lastVisit = b.reservation_time;
        }
    });

    const uniqueGuests = Array.from(guestsMap.values()).sort((a, b) => b.totalVisits - a.totalVisits);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Guest Directory</h1>
                    <p className="text-muted-foreground">{uniqueGuests.length} unique guests</p>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-muted-foreground border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Guest</th>
                                <th className="px-6 py-4 font-medium">Contact</th>
                                <th className="px-6 py-4 font-medium">Total Visits</th>
                                <th className="px-6 py-4 font-medium">Status History</th>
                                <th className="px-6 py-4 font-medium text-right">Last Visit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueGuests.map((guest, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50/50 smooth-transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold">
                                                {guest.guest_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <span className="font-medium">{guest.guest_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {guest.guest_phone && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                    <Phone className="w-3 h-3" /> {guest.guest_phone}
                                                </div>
                                            )}
                                            {guest.guest_email && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                    <User className="w-3 h-3" /> {guest.guest_email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-lg">
                                        {guest.totalVisits}
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        <div className="flex gap-2 text-muted-foreground">
                                            {guest.cancelled > 0 && <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">{guest.cancelled} Cancelled</span>}
                                            {guest.noShow > 0 && <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{guest.noShow} No Show</span>}
                                            {guest.totalVisits - guest.cancelled - guest.noShow > 0 && (
                                                <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded">{guest.totalVisits - guest.cancelled - guest.noShow} Completed</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-muted-foreground">
                                        {new Date(guest.lastVisit).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {uniqueGuests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-muted-foreground font-medium">
                                        No guests found for your restaurant.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
