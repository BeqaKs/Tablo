'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCustomerBookings } from '@/app/actions/bookings';
import { checkUserPenalty } from '@/app/actions/no-show';
import { BookingCard } from '@/components/customer/booking-card';
import { EmptyState } from '@/components/customer/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/lib/locale-context';
import { User } from '@supabase/supabase-js';
import { Loader2, AlertTriangle, ShieldOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function MyBookingsPage() {
    const { t } = useLocale();
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [penalty, setPenalty] = useState<{ isPenalized: boolean; penaltyUntil: string | null; noShowCount: number } | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }
            setUser(user);

            const [bookingsResult, penaltyResult] = await Promise.all([
                getCustomerBookings(user.id),
                checkUserPenalty(user.id),
            ]);

            if (bookingsResult.error) setError(bookingsResult.error);
            else setBookings(bookingsResult.bookings || []);

            setPenalty(penaltyResult);
            setIsLoading(false);
        }
        loadData();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{t('common.error')}</h2>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    const now = new Date();
    const activeBookings = bookings.filter(
        (b) => new Date(b.reservation_time) >= now && b.status !== 'cancelled' && b.status !== 'completed'
    );
    const pastBookings = bookings.filter(
        (b) => new Date(b.reservation_time) < now || b.status === 'cancelled' || b.status === 'completed'
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Penalty Banner */}
            {penalty?.isPenalized && (
                <div className="bg-red-600 text-white px-6 py-3 flex items-center gap-3 text-sm">
                    <ShieldOff className="h-4 w-4 shrink-0" />
                    <span>
                        <strong>Account temporarily restricted</strong> — You've had {penalty.noShowCount} no-shows.
                        Booking will be unlocked on{' '}
                        {penalty.penaltyUntil ? new Date(penalty.penaltyUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}.
                    </span>
                </div>
            )}
            {!penalty?.isPenalized && (penalty?.noShowCount ?? 0) >= 2 && (
                <div className="bg-amber-500 text-white px-6 py-3 flex items-center gap-3 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                        <strong>Warning:</strong> You have {penalty?.noShowCount} no-shows. One more will result in a 30-day booking restriction.
                    </span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{t('bookings.title')}</h1>
                        <p className="text-lg text-muted-foreground">
                            {t('bookings.subtitle')}
                        </p>
                    </div>
                    <Button asChild variant="outline" className="gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                        <Link href="/my-waitlist">
                            <Clock className="h-4 w-4" />
                            My Waitlist
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-8 py-8">
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="active">
                            {t('bookings.active')} ({activeBookings.length})
                        </TabsTrigger>
                        <TabsTrigger value="past">
                            {t('bookings.past')} ({pastBookings.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="space-y-4">
                        {activeBookings.length === 0 ? (
                            <EmptyState
                                title={t('bookings.empty.noActive')}
                                message={t('bookings.empty.noActiveDesc')}
                                ctaText={t('bookings.empty.cta')}
                                ctaLink="/restaurants"
                            />
                        ) : (
                            activeBookings.map((booking) => (
                                <BookingCard key={booking.id} booking={booking} />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="past" className="space-y-4">
                        {pastBookings.length === 0 ? (
                            <EmptyState
                                title={t('bookings.empty.noPast')}
                                message={t('bookings.empty.noPastDesc')}
                                ctaText={t('bookings.empty.ctaFirst')}
                                ctaLink="/restaurants"
                            />
                        ) : (
                            pastBookings.map((booking) => (
                                <BookingCard key={booking.id} booking={booking} isPast />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
