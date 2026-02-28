'use client';

import { useEffect, useState } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';

/**
 * DEMO TOOL: Press Shift+W anywhere on the page to trigger a realistic
 * push notification simulating "A table just opened up on the waitlist!"
 * This is purely for sales demos — not shown in production to end users.
 */
export function WaitlistNotifier() {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [restaurant, setRestaurant] = useState('Barbarestan');

    useEffect(() => {
        // Try to get the restaurant name from the current page title
        const title = document.title;
        if (title && title !== 'Tablo') {
            const name = title.split('|')[0].trim();
            if (name) setRestaurant(name);
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.shiftKey && e.key === 'W') {
                triggerNotification();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    function triggerNotification() {
        if (visible) return;
        setAnimating(true);
        setVisible(true);

        // Auto-dismiss after 6 seconds
        setTimeout(() => dismiss(), 6000);
    }

    function dismiss() {
        setAnimating(false);
        setTimeout(() => setVisible(false), 400);
    }

    if (!visible) return null;

    return (
        <div
            className={`fixed top-4 left-1/2 z-[999] -translate-x-1/2 w-full max-w-sm px-4 transition-all duration-400 ease-out ${animating
                    ? 'translate-y-0 opacity-100 scale-100'
                    : '-translate-y-4 opacity-0 scale-95'
                }`}
            style={{ transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease' }}
        >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {/* iOS-style notification header */}
                <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-white/5">
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-primary to-red-500 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest flex-1">Tablo</span>
                    <span className="text-[11px] text-white/30">now</span>
                    <button onClick={dismiss} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors ml-1">
                        <X className="w-3 h-3 text-white/40" />
                    </button>
                </div>

                {/* Notification Body */}
                <div className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1">
                        <p className="text-sm font-bold text-white leading-snug">
                            🔔 A table for 2 just opened up!
                        </p>
                        <p className="text-sm text-white/70 mt-0.5 leading-snug">
                            {restaurant} has availability tonight. Claim it before someone else does.
                        </p>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex border-t border-white/5">
                    <button
                        onClick={dismiss}
                        className="flex-1 py-3 text-xs font-semibold text-white/40 hover:bg-white/5 transition-colors"
                    >
                        Dismiss
                    </button>
                    <div className="w-px bg-white/5" />
                    <button
                        onClick={dismiss}
                        className="flex-1 py-3 text-xs font-bold text-primary hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                    >
                        Claim Table <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* Demo hint badge — fades away */}
            <div className="text-center mt-2">
                <span className="text-[10px] font-medium text-white/30 bg-black/30 backdrop-blur px-2 py-0.5 rounded-full">
                    Demo mode · Press Shift+W to trigger
                </span>
            </div>
        </div>
    );
}
