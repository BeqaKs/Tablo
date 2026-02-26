'use client';

import { useState, useEffect } from 'react';
import { getOwnerBookings } from '@/app/actions/owner';
import { toast } from 'sonner'
import { Loader2, Star, Phone, Mail } from 'lucide-react';

export default function OwnerGuestsPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 58%)' }} />
                    <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>Loading guests...</p>
                </div>
            </div>
        );
    }

    const guestsMap = new Map<string, any>();
    bookings.forEach(b => {
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
                history: [],
            });
        }
        const g = guestsMap.get(key);
        g.history.push(b);
        g.totalVisits += 1;
        if (b.status === 'cancelled') g.cancelled += 1;
        if (b.status === 'no_show') g.noShow += 1;
        if (new Date(b.reservation_time) < new Date(g.firstVisit)) g.firstVisit = b.reservation_time;
        if (new Date(b.reservation_time) > new Date(g.lastVisit)) g.lastVisit = b.reservation_time;
    });

    const allGuests = Array.from(guestsMap.values()).sort((a, b) => b.totalVisits - a.totalVisits);
    const uniqueGuests = search
        ? allGuests.filter(g => g.guest_name?.toLowerCase().includes(search.toLowerCase()) || g.guest_phone?.includes(search))
        : allGuests;

    // Color avatar gradient based on name
    const avatarGradient = (name: string) => {
        const h = (name?.charCodeAt(0) || 65) % 360;
        return `linear-gradient(135deg, hsl(${h} 60% 40%), hsl(${(h + 40) % 360} 70% 55%))`;
    };

    const vipCount = (g: any) => g.totalVisits - g.cancelled - g.noShow;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Guest Directory</h1>
                    <p className="text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>{uniqueGuests.length} unique guests</p>
                </div>
                <input
                    type="text"
                    placeholder="Search guests..."
                    className="dash-input sm:w-64"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Guests', value: allGuests.length, color: 'hsl(347 78% 58%)' },
                    { label: 'Total Visits', value: bookings.length, color: 'hsl(262 60% 56%)' },
                    { label: 'Regulars (3+)', value: allGuests.filter(g => vipCount(g) >= 3).length, color: 'hsl(38 80% 55%)' },
                    { label: 'No Shows', value: allGuests.reduce((sum, g) => sum + g.noShow, 0), color: 'hsl(160 60% 45%)' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="dash-card p-4">
                        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                        <div className="text-xs mt-1" style={{ color: 'hsl(220 15% 45%)' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="dash-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid hsl(231 24% 14%)' }}>
                                {['Guest', 'Contact', 'Visits', 'Status History', 'Last Visit'].map(col => (
                                    <th
                                        key={col}
                                        className={`px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest ${col === 'Last Visit' ? 'text-right' : ''}`}
                                        style={{ color: 'hsl(220 15% 38%)' }}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueGuests.map((guest, idx) => {
                                const completed = vipCount(guest);
                                const isVip = completed >= 3;
                                return (
                                    <tr
                                        key={idx}
                                        className="smooth-transition"
                                        style={{ borderBottom: '1px solid hsl(231 24% 12%)' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'hsl(231 24% 12%)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = ''}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                                    style={{ background: avatarGradient(guest.guest_name || 'U') }}
                                                >
                                                    {guest.guest_name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-white">{guest.guest_name}</span>
                                                        {isVip && (
                                                            <Star className="h-3 w-3" style={{ color: 'hsl(38 80% 60%)', fill: 'hsl(38 80% 60%)' }} />
                                                        )}
                                                    </div>
                                                    {isVip && (
                                                        <span className="text-[10px] font-medium" style={{ color: 'hsl(38 80% 58%)' }}>Regular guest</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                {guest.guest_phone && (
                                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(220 15% 50%)' }}>
                                                        <Phone className="h-3 w-3" /> {guest.guest_phone}
                                                    </div>
                                                )}
                                                {guest.guest_email && (
                                                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(220 15% 50%)' }}>
                                                        <Mail className="h-3 w-3" /> {guest.guest_email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xl font-bold text-white">{guest.totalVisits}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {completed > 0 && (
                                                    <span className="badge-seated px-2 py-0.5 rounded-full text-[11px] font-medium">{completed} Completed</span>
                                                )}
                                                {guest.cancelled > 0 && (
                                                    <span className="badge-cancelled px-2 py-0.5 rounded-full text-[11px] font-medium">{guest.cancelled} Cancelled</span>
                                                )}
                                                {guest.noShow > 0 && (
                                                    <span className="badge-no-show px-2 py-0.5 rounded-full text-[11px] font-medium">{guest.noShow} No Show</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
                                            {new Date(guest.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                    </tr>
                                );
                            })}
                            {uniqueGuests.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-sm" style={{ color: 'hsl(220 15% 40%)' }}>
                                        {search ? `No guests matching "${search}"` : 'No guests found for your restaurant.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
