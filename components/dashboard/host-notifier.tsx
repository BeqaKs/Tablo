'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { CalendarCheck, Users } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

export function HostNotifier({ restaurantId }: { restaurantId: string }) {
    const { t } = useLocale();

    useEffect(() => {
        if (!restaurantId) return;

        const supabase = createClient();

        // Subscribing to reservations

        const channel = supabase
            .channel(`reservations_notifier_${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    // New reservation received

                    const newRes = payload.new;

                    // Format time
                    const timeObj = new Date(newRes.reservation_time);
                    const timeString = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    toast.custom((t_id) => (
                        <div className="flex w-[350px] flex-col gap-2 rounded-xl border border-white/10 bg-[#1A1A1A] p-4 text-white shadow-2xl backdrop-blur-xl">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E11D48]/20 text-[#E11D48]">
                                    <CalendarCheck className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{t('dashboard.newReservationAlert', { name: newRes.guest_name || 'Guest' })}</span>
                                    <span className="text-xs text-white/60">
                                        {timeString} • {newRes.guest_count} {t('dashboard.guestsShort', { count: newRes.guest_count })}
                                        {newRes.occasion && ` • ✨ ${newRes.occasion}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ), {
                        duration: 8000,
                        position: 'top-right',
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId, t]);

    return null; // Invisible component
}
