'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCustomerBookings } from '@/app/actions/bookings';
import { BookingCard } from '@/components/customer/booking-card';
import { EmptyState } from '@/components/customer/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/lib/locale-context';
import { User } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

export default function MyBookingsPage() {
    const { t } = useLocale();
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }
            setUser(user);

            const { bookings, error } = await getCustomerBookings(user.id);
            if (error) {
                setError(error);
            } else {
                setBookings(bookings || []);
            }
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-8 py-8">
                    <h1 className="text-4xl font-bold mb-2">{t('bookings.title')}</h1>
                    <p className="text-lg text-muted-foreground">
                        {t('bookings.subtitle')}
                    </p>
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
