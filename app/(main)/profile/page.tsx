'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProfile } from '@/app/actions/profile';
import { ProfileForm } from '@/components/customer/profile-form';
import { useLocale } from '@/lib/locale-context';
import { User } from '@supabase/supabase-js';
import { Loader2, LogOut, Star, Utensils, Calendar, Heart, Trophy, Clock, Globe2, Sparkles, Users } from 'lucide-react';
import { signout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ────────────────────────────────────────────────────────────────────────────
// Dining DNA Logic
// ────────────────────────────────────────────────────────────────────────────
function deriveDNA(bookings: any[]) {
    if (!bookings || bookings.length === 0) return null;

    const total = bookings.length;
    const cuisines: Record<string, number> = {};
    let weekendCount = 0;
    let specialOccasions = 0;
    let lunchCount = 0;
    let dinnerCount = 0;
    let largeParty = 0;
    const restaurantSet = new Set<string>();

    for (const b of bookings) {
        if (b.status === 'cancelled' || b.status === 'no_show') continue;
        const cuisine = b.restaurants?.cuisine_type?.toLowerCase() || 'georgian';
        cuisines[cuisine] = (cuisines[cuisine] || 0) + 1;
        const date = new Date(b.reservation_time);
        const day = date.getDay();
        if (day === 0 || day === 6) weekendCount++;
        if (b.occasion && ['Birthday', 'Anniversary', 'Date Night'].includes(b.occasion)) specialOccasions++;
        const hour = date.getHours();
        if (hour < 16) lunchCount++; else dinnerCount++;
        if (b.guest_count >= 4) largeParty++;
        if (b.restaurant_id) restaurantSet.add(b.restaurant_id);
    }

    const topCuisine = Object.entries(cuisines).sort((a, b) => b[1] - a[1])[0]?.[0] || 'georgian';

    const archetypes: { emoji: string; title: string; desc: string; gradient: string }[] = [];

    if (specialOccasions >= 2) archetypes.push({ emoji: '🎉', title: 'Special Occasion Planner', desc: 'You know how to make moments memorable', gradient: 'from-purple-500 to-pink-500' });
    else if (weekendCount / total > 0.6) archetypes.push({ emoji: '🍾', title: 'Weekend Indulger', desc: 'You save the best nights for weekends', gradient: 'from-amber-500 to-orange-500' });
    else if (topCuisine.includes('georgian')) archetypes.push({ emoji: '🍷', title: 'Georgian Food Enthusiast', desc: 'Deeply passionate about Georgian cuisine', gradient: 'from-red-600 to-rose-500' });
    else if (lunchCount > dinnerCount) archetypes.push({ emoji: '☀️', title: 'Power Luncher', desc: 'You make every midday meal count', gradient: 'from-yellow-400 to-amber-500' });
    else if (largeParty / total > 0.4) archetypes.push({ emoji: '🎊', title: 'Social Butterfly', desc: 'Your table is always the life of the party', gradient: 'from-emerald-500 to-teal-500' });
    else archetypes.push({ emoji: '🌟', title: 'Fine Dining Explorer', desc: 'Always seeking new culinary adventures', gradient: 'from-blue-500 to-indigo-500' });

    return { ...archetypes[0], total, topCuisine, uniqueRestaurants: restaurantSet.size, weekendCount };
}

// ────────────────────────────────────────────────────────────────────────────
// Badge Logic
// ────────────────────────────────────────────────────────────────────────────
function getBadges(bookings: any[]) {
    if (!bookings || bookings.length === 0) return [];
    const completed = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'no_show');
    const total = completed.length;
    const restaurantSet = new Set(completed.map(b => b.restaurant_id));
    const cuisineSet = new Set(completed.map(b => b.restaurants?.cuisine_type).filter(Boolean));
    const occasions = completed.filter(b => b.occasion && b.occasion !== '');
    const weekends = completed.filter(b => { const d = new Date(b.reservation_time); return d.getDay() === 0 || d.getDay() === 6; });

    const badges = [
        { id: 'first', emoji: '🍽️', label: 'First Booking', earned: total >= 1 },
        { id: 'five', emoji: '⭐', label: '5 Bookings', earned: total >= 5 },
        { id: 'ten', emoji: '🏆', label: '10 Bookings', earned: total >= 10 },
        { id: 'occasion', emoji: '🎂', label: 'Special Occasion', earned: occasions.length >= 1 },
        { id: 'explorer', emoji: '🗺️', label: 'Restaurant Explorer', earned: restaurantSet.size >= 3 },
        { id: 'foodie', emoji: '👨‍🍳', label: 'Cuisine Adventurer', earned: cuisineSet.size >= 3 },
        { id: 'weekend', emoji: '📅', label: 'Weekend Warrior', earned: weekends.length >= 3 },
        { id: 'loyal', emoji: '💎', label: 'Loyal Regular', earned: total >= 15 },
    ];

    return badges;
}

export default function ProfilePage() {
    const { t } = useLocale();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { window.location.href = '/login'; return; }
            setUser(user);

            let { profile: p, error: e } = await getProfile(user.id);

            if (!p && !e) {
                await supabase.from('users').insert({
                    id: user.id, email: user.email || '',
                    full_name: user.user_metadata?.full_name || '', role: 'customer',
                });
                const result = await getProfile(user.id);
                p = result.profile; e = result.error;
            }

            if (e) setError(e); else setProfile(p);

            // Load booking history for DNA
            const { data: bks } = await supabase
                .from('reservations')
                .select('id, reservation_time, guest_count, occasion, status, restaurant_id, restaurants(name, cuisine_type)')
                .eq('user_id', user.id)
                .order('reservation_time', { ascending: false })
                .limit(50);
            if (bks) setBookings(bks);

            setIsLoading(false);
        }
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{t('common.error')}</h2>
                    <p className="text-muted-foreground">{error || 'Profile not found'}</p>
                </div>
            </div>
        );
    }

    const dna = deriveDNA(bookings);
    const badges = getBadges(bookings);
    const earnedBadges = badges.filter(b => b.earned);

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-1">{t('profile.title')}</h1>
                        <p className="text-muted-foreground">{t('profile.subtitle')}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="gap-2" asChild>
                            <Link href="/profile/friends">
                                <Users className="h-4 w-4" />
                                <span className="hidden sm:inline">Friends</span>
                            </Link>
                        </Button>
                        <form action={signout}>
                            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('navigation.signOut')}</span>
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">

                {/* ── Dining DNA Card ── */}
                {dna ? (
                    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${dna.gradient} p-6 text-white shadow-xl shadow-primary/20`}>
                        {/* Background texture */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                        <div className="relative flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="w-4 h-4 opacity-80" />
                                    <span className="text-[11px] font-semibold uppercase tracking-widest opacity-70">Your Dining DNA</span>
                                </div>
                                <p className="text-3xl mb-1">{dna.emoji}</p>
                                <h2 className="text-2xl font-extrabold tracking-tight">{dna.title}</h2>
                                <p className="text-sm opacity-80 mt-1">{dna.desc}</p>

                                <div className="flex flex-wrap items-center gap-3 mt-4">
                                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                                        <Utensils className="w-3 h-3" />
                                        {dna.total} dining experiences
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                                        <Globe2 className="w-3 h-3" />
                                        {dna.uniqueRestaurants} restaurants
                                    </div>
                                    {dna.weekendCount > 0 && (
                                        <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                                            <Calendar className="w-3 h-3" />
                                            {dna.weekendCount} weekend nights
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-4xl shadow-lg">
                                {dna.emoji}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-3xl border-2 border-dashed border-gray-200 p-8 text-center">
                        <p className="text-4xl mb-3">🍽️</p>
                        <h3 className="font-bold text-gray-700 mb-1">Your Dining DNA is forming…</h3>
                        <p className="text-sm text-gray-400">Make your first booking to unlock your personalized dining personality card.</p>
                    </div>
                )}

                {/* ── Achievement Badges ── */}
                <div className="bg-white rounded-2xl border p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-gray-900">Achievement Badges</h3>
                        {earnedBadges.length > 0 && (
                            <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                {earnedBadges.length} / {badges.length} earned
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {badges.map(badge => (
                            <div
                                key={badge.id}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${badge.earned
                                    ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm'
                                    : 'bg-gray-50 border-gray-100 text-gray-300 grayscale'
                                    }`}
                                title={badge.earned ? 'Earned!' : 'Not yet earned'}
                            >
                                <span className={badge.earned ? '' : 'opacity-40'}>{badge.emoji}</span>
                                <span>{badge.label}</span>
                                {badge.earned && <span className="text-amber-500 text-xs">✓</span>}
                            </div>
                        ))}
                    </div>
                    {earnedBadges.length === 0 && (
                        <p className="text-xs text-gray-400 mt-3 text-center">Start booking to earn your first badge!</p>
                    )}
                </div>

                {/* ── Profile Form ── */}
                <ProfileForm profile={profile} />
            </div>
        </div>
    );
}
