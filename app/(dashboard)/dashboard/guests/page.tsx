'use client';

import { useState, useEffect } from 'react';
import { getOwnerBookings, getOwnerGuestProfiles } from '@/app/actions/owner';
import { markNoShow } from '@/app/actions/no-show';
import { flagGuest, unflagGuest, addGuestTag, removeGuestTag } from '@/app/actions/guest-profiles';
import { useTranslations } from '@/components/translations-provider';
import { toast } from 'sonner'
import { Loader2, Star, Phone, Mail, Flag, AlertOctagon, X, Plus, Tag as TagIcon, AlertCircle } from 'lucide-react';

export default function OwnerGuestsPage() {
    const { t } = useTranslations();
    const [bookings, setBookings] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [actionRow, setActionRow] = useState<string | null>(null);
    const [taggingRow, setTaggingRow] = useState<string | null>(null);
    const [newTag, setNewTag] = useState('');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [bookingsRes, profilesRes] = await Promise.all([
            getOwnerBookings(),
            getOwnerGuestProfiles()
        ]);

        if (bookingsRes.error) toast.error(bookingsRes.error);
        if (bookingsRes.data) {
            setBookings(bookingsRes.data);
            const first = (bookingsRes.data as any[]).find(b => b.restaurant_id);
            if (first) setRestaurantId(first.restaurant_id);
        }

        if (profilesRes.data) {
            setProfiles(profilesRes.data);
            // Pre-load flagged set
            const flagged = new Set<string>();
            profilesRes.data.forEach((p: any) => {
                if (p.is_flagged && p.user_id) flagged.add(p.user_id);
            });
            setFlaggedIds(flagged);
        }
        setLoading(false);
    }

    async function handleMarkNoShow(bookingId: string) {
        const result = await markNoShow(bookingId);
        if (result.error) { toast.error(result.error); return; }
        toast.success('Marked as no-show. Penalty applied if ≥3 no-shows.');
        loadData();
    }

    async function handleFlag(guestUserId: string | null, guestKey: string, reason: string) {
        if (!restaurantId || !guestUserId) { toast.error('Cannot flag guest-only booking (no account)'); return; }
        const alreadyFlagged = flaggedIds.has(guestUserId);
        if (alreadyFlagged) {
            await unflagGuest(guestUserId, restaurantId);
            setFlaggedIds(prev => { const s = new Set(prev); s.delete(guestUserId); return s; });
            toast.success('Guest flag removed');
        } else {
            await flagGuest({ user_id: guestUserId, restaurant_id: restaurantId, flag_reason: reason });
            setFlaggedIds(prev => new Set(prev).add(guestUserId));
            toast.success('Guest flagged');
        }
        setActionRow(null);
    }

    async function handleAddTag(guestUserId: string | null) {
        if (!restaurantId || !guestUserId) { toast.error('Cannot tag guest without an account'); return; }
        if (!newTag.trim()) return;

        const result = await addGuestTag(guestUserId, restaurantId, newTag.trim().toLowerCase());
        if (result.error) toast.error(result.error);
        else {
            toast.success('Tag added');
            setNewTag('');
            setTaggingRow(null);
            loadData();
        }
    }

    async function handleRemoveTag(guestUserId: string | null, tag: string) {
        if (!restaurantId || !guestUserId) return;
        const result = await removeGuestTag(guestUserId, restaurantId, tag);
        if (result.error) toast.error(result.error);
        else {
            toast.success('Tag removed');
            loadData();
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 58%)' }} />
                    <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>Loading CRM...</p>
                </div>
            </div>
        );
    }

    const guestsMap = new Map<string, any>();
    bookings.forEach(b => {
        // Use user_id as primary key if available to merge with profiles, fallback to name/phone
        const key = b.user_id || b.guest_phone || b.guest_email || b.guest_name;
        if (!key) return;

        if (!guestsMap.has(key)) {
            guestsMap.set(key, {
                guest_name: b.guest_name,
                guest_phone: b.guest_phone,
                guest_email: b.guest_email,
                user_id: b.user_id,
                totalVisits: 0,
                cancelled: 0,
                noShow: 0,
                firstVisit: b.reservation_time,
                lastVisit: b.reservation_time,
                history: [],
                tags: [],
                total_spend: 0
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

    // Merge profiles data (tags, spend)
    const allGuests = Array.from(guestsMap.values()).map(g => {
        if (g.user_id) {
            const profile = profiles.find(p => p.user_id === g.user_id);
            if (profile) {
                g.tags = profile.tags || [];
                g.total_spend = profile.total_spend || 0;
            }
        }
        return g;
    }).sort((a, b) => b.totalVisits - a.totalVisits);

    const uniqueGuests = search
        ? allGuests.filter(g => g.guest_name?.toLowerCase().includes(search.toLowerCase()) || g.guest_phone?.includes(search) || g.tags.some((t: string) => t.includes(search.toLowerCase())))
        : allGuests;

    const avatarGradient = (name: string) => {
        const h = (name?.charCodeAt(0) || 65) % 360;
        return `linear-gradient(135deg, hsl(${h} 60% 40%), hsl(${(h + 40) % 360} 70% 55%))`;
    };

    const vipCount = (g: any) => g.totalVisits - g.cancelled - g.noShow;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Guest CRM</h1>
                    <p className="text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>{uniqueGuests.length} directory entries</p>
                </div>
                <input
                    type="text"
                    placeholder="Search by name, phone, or tags..."
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
                    { label: 'VIPs (3+ Visits)', value: allGuests.filter(g => vipCount(g) >= 3 || g.tags.includes('vip')).length, color: 'hsl(38 80% 55%)' },
                    { label: 'No Shows', value: allGuests.reduce((sum, g) => sum + g.noShow, 0), color: 'hsl(160 60% 45%)' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="dash-card p-4">
                        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                        <div className="text-xs mt-1" style={{ color: 'hsl(220 15% 45%)' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="dash-card overflow-hidden pb-32">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid hsl(231 24% 14%)' }}>
                                {['Guest', 'Contact', 'Metrics', 'Status History', 'Last Visit', 'Actions'].map(col => (
                                    <th
                                        key={col}
                                        className={`px-5 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest ${col === 'Last Visit' || col === 'Actions' ? 'text-right' : ''}`}
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
                                const isVip = completed >= 5 || guest.tags.includes('vip');
                                const isRisk = guest.noShow >= 2 || guest.tags.includes('risk') || guest.tags.includes('high risk');

                                return (
                                    <tr
                                        key={idx}
                                        className="smooth-transition group"
                                        style={{ borderBottom: '1px solid hsl(231 24% 12%)' }}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-start justify-between">
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
                                                                <span title={t('dashboard_enhancements.vipGuest')}>
                                                                    <Star className="h-3.5 w-3.5" style={{ color: 'hsl(38 80% 55%)', fill: 'hsl(38 80% 55%)' }} />
                                                                </span>
                                                            )}
                                                            {isRisk && (
                                                                <span title={t('dashboard_enhancements.highRiskGuest')}>
                                                                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                                                </span>
                                                            )}
                                                            {guest.user_id && flaggedIds.has(guest.user_id) && (
                                                                <span title="Flagged Guest">
                                                                    <AlertOctagon className="h-3.5 w-3.5 text-red-500" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {guest.tags.map((tag: string) => (
                                                                <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider text-muted-foreground group-hover:border-white/20 transition-colors">
                                                                    {tag}
                                                                    <button onClick={() => handleRemoveTag(guest.user_id, tag)} className="hover:text-red-400"><X className="h-2 w-2" /></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="space-y-1">
                                                {guest.guest_phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Phone className="h-3 w-3" /> {guest.guest_phone}
                                                    </div>
                                                )}
                                                {guest.guest_email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" /> {guest.guest_email}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xl font-bold text-white">{guest.totalVisits}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Visits</span>
                                            </div>
                                            <div className="text-xs text-emerald-400/80 font-medium">
                                                ${parseFloat(guest.total_spend || 0).toLocaleString()} <span className="text-muted-foreground">LTV</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-col gap-1 mt-1">
                                                {completed > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {completed} Completed</div>
                                                )}
                                                {guest.cancelled > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> {guest.cancelled} Cancelled</div>
                                                )}
                                                {guest.noShow > 0 && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {guest.noShow} No Show</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                                            {new Date(guest.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>

                                        <td className="px-5 py-4 text-right relative">
                                            <div className="flex items-center justify-end gap-1">

                                                {/* Add Tag UI */}
                                                <div className="relative">
                                                    <button onClick={() => { setTaggingRow(taggingRow === guest.user_id ? null : guest.user_id); setActionRow(null); }} className="p-1.5 text-muted-foreground hover:bg-white/5 rounded-lg transition-colors" title="Add Tag">
                                                        <TagIcon className="w-4 h-4" />
                                                    </button>
                                                    {taggingRow === guest.user_id && guest.user_id && (
                                                        <div className="absolute right-0 top-8 z-20 w-48 p-2 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl flex items-center gap-2">
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                className="dash-input text-xs py-1 px-2 h-7"
                                                                placeholder="allergy, vip..."
                                                                value={newTag}
                                                                onChange={e => setNewTag(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleAddTag(guest.user_id)}
                                                            />
                                                            <button onClick={() => handleAddTag(guest.user_id)} className="h-7 w-7 flex-shrink-0 flex items-center justify-center bg-white/10 text-white rounded hover:bg-white/20"><Plus className="w-3 h-3" /></button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <button
                                                        onClick={() => { setActionRow(actionRow === guest.user_id ? null : guest.user_id); setTaggingRow(null); }}
                                                        title="Flag / unflag guest"
                                                        className={`p-1.5 rounded-lg transition-colors ${guest.user_id && flaggedIds.has(guest.user_id)
                                                            ? 'text-red-400 bg-red-400/10'
                                                            : 'text-muted-foreground hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <Flag className="h-4 w-4" />
                                                    </button>
                                                    {actionRow === guest.user_id && guest.user_id && (
                                                        <div className="absolute right-0 top-8 z-10 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-2 w-44 space-y-1">
                                                            <p className="text-[10px] text-muted-foreground px-2 pb-1 uppercase tracking-wider font-semibold">Flag reason</p>
                                                            {['rude', 'serial_canceler', 'disruptive', 'other'].map(reason => (
                                                                <button
                                                                    key={reason}
                                                                    className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-red-500/20 text-white transition-colors capitalize"
                                                                    onClick={() => handleFlag(guest.user_id, guest.user_id, reason)}
                                                                >
                                                                    {reason.replace('_', ' ')}
                                                                </button>
                                                            ))}
                                                            {flaggedIds.has(guest.user_id) && (
                                                                <button
                                                                    className="w-full text-left mt-2 border-t border-white/10 px-3 py-1.5 text-xs rounded-b-lg hover:bg-white/5 transition-colors text-muted-foreground"
                                                                    onClick={() => handleFlag(guest.user_id, guest.user_id, '')}
                                                                >
                                                                    Remove flag
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {uniqueGuests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-sm text-muted-foreground">
                                        {search ? `No guests matching "${search}"` : 'No guests found.'}
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
