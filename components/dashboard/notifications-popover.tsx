'use client';

import { useState, useEffect } from 'react';
import { Bell, CalendarCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocale } from '@/lib/locale-context';

export function NotificationsPopover({ restaurantId }: { restaurantId?: string }) {
    const { t } = useLocale();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!restaurantId) return;

        const supabase = createClient();

        async function fetchRecent() {
            const { data } = await supabase
                .from('reservations')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setNotifications(data);
        }

        fetchRecent();

        const channel = supabase
            .channel(`notifs_${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reservations',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    setNotifications((prev) => [payload.new, ...prev].slice(0, 10));
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [restaurantId]);

    function handleOpenChange(open: boolean) {
        if (open) {
            setUnreadCount(0);
        }
    }

    return (
        <Popover onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <button
                    className="relative flex h-8 w-8 items-center justify-center rounded-lg smooth-transition"
                    style={{ background: 'hsl(231 24% 12%)', color: 'hsl(220 15% 50%)' }}
                >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 border-[#2A2D3C] bg-[#1A1C23] text-white">
                <div className="flex items-center justify-between border-b border-[#2A2D3C] px-4 py-3">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                </div>
                <div className="flex max-h-[400px] flex-col overflow-y-auto p-2">
                    {notifications.length === 0 ? (
                        <p className="p-4 text-center text-xs text-muted-foreground">No recent notifications</p>
                    ) : (
                        notifications.map((notif) => {
                            const timeObj = new Date(notif.reservation_time);
                            const timeString = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            return (
                                <div key={notif.id} className="flex items-start gap-3 rounded-lg p-3 hover:bg-[#2A2D3C]/50 smooth-transition">
                                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                        <CalendarCheck className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium leading-none">
                                            {t('dashboard.newReservationAlert', { name: notif.guest_name || 'Guest' })}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {timeString} • {notif.guest_count} {t('dashboard.guestsShort', { count: notif.guest_count })}
                                            {notif.occasion && ` • ✨ ${notif.occasion}`}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
