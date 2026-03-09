// components/layout/dashboard-header.tsx
'use client';

import { Bell, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationsPopover } from '@/components/dashboard/notifications-popover';

export function DashboardHeader({
    restaurantName,
    restaurantId,
    dict,
    onMenuClick
}: {
    restaurantName: string,
    restaurantId?: string,
    dict: any,
    onMenuClick?: () => void
}) {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        function update() {
            const now = new Date();
            setTime(now.toLocaleTimeString(dict.locale || 'ka-GE', { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString(dict.locale || 'ka-GE', { weekday: 'short', month: 'short', day: 'numeric' }));
        }
        update();
        const id = setInterval(update, 30000);
        return () => clearInterval(id);
    }, [dict.locale]);

    return (
        <header
            className="sticky top-0 z-20 flex h-14 items-center justify-between px-6 bg-white border-b border-gray-200"
        >
            {/* Left: Restaurant name + live badge */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white lg:hidden smooth-transition hover:bg-white/10"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-sm font-semibold text-gray-900">{restaurantName}</h1>
                <span
                    className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />
                    {dict.dashboard.live}
                </span>
            </div>

            {/* Right: Date + bell */}
            <div className="flex items-center gap-4">
                {date && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
                        <span>{date}</span>
                        <span className="text-gray-300">•</span>
                        <span className="font-semibold text-gray-700">{time}</span>
                    </div>
                )}
                {restaurantId ? (
                    <NotificationsPopover restaurantId={restaurantId} />
                ) : (
                    <button
                        className="flex h-8 w-8 items-center justify-center rounded-lg smooth-transition bg-gray-100 text-gray-500 hover:bg-gray-200"
                    >
                        <Bell className="h-4 w-4" />
                    </button>
                )}
            </div>
        </header>
    );
}
