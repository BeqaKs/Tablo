'use client';

import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

export function DashboardHeader({ restaurantName }: { restaurantName: string }) {
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        function update() {
            const now = new Date();
            setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        }
        update();
        const id = setInterval(update, 30000);
        return () => clearInterval(id);
    }, []);

    return (
        <header
            className="sticky top-0 z-20 flex h-14 items-center justify-between px-6"
            style={{
                background: 'hsl(231 38% 6% / 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid hsl(231 24% 13%)',
            }}
        >
            {/* Left: Restaurant name + live badge */}
            <div className="flex items-center gap-3">
                <h1 className="text-sm font-semibold text-white">{restaurantName}</h1>
                <span
                    className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                        background: 'hsl(160 60% 45% / 0.14)',
                        color: 'hsl(160 60% 60%)',
                        border: '1px solid hsl(160 60% 45% / 0.25)',
                    }}
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-current pulse-dot" />
                    LIVE
                </span>
            </div>

            {/* Right: Date + bell */}
            <div className="flex items-center gap-4">
                {date && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
                        <span>{date}</span>
                        <span style={{ color: 'hsl(231 24% 22%)' }}>•</span>
                        <span className="font-semibold" style={{ color: 'hsl(220 20% 65%)' }}>{time}</span>
                    </div>
                )}
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg smooth-transition"
                    style={{ background: 'hsl(231 24% 12%)', color: 'hsl(220 15% 50%)' }}
                >
                    <Bell className="h-4 w-4" />
                </button>
            </div>
        </header>
    );
}
