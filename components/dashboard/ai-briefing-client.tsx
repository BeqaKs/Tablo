'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, X } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslations } from '@/components/translations-provider';
import { useLocale } from '@/lib/locale-context';
import { toast } from 'sonner';

interface AIBriefingClientProps {
    bookings: any[];
    selectedDate?: Date;
}

function BriefingModal({ content, onClose, onRegenerate, loading }: { content: string; onClose: () => void; onRegenerate: () => void; loading: boolean }) {
    const { t } = useTranslations();
    const { locale } = useLocale();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl border animate-in slide-in-from-bottom-4 duration-500" style={{ background: 'hsl(231 32% 10%)', borderColor: 'hsl(231 24% 20%)' }}>
                <div className="p-6 bg-gradient-to-br from-white/5 to-transparent border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ background: 'hsl(38 80% 55% / 0.15)' }}>
                            <Sparkles className="h-5 w-5" style={{ color: 'hsl(38 80% 60%)' }} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg tracking-tight">{t('dashboard_enhancements.dailySummary')}</h3>
                            <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                                {format(new Date(), 'EEEE, MMMM d')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white transition-all active:scale-95">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-5">
                            <div className="relative">
                                <Loader2 className="h-10 w-10 animate-spin text-orange-400/80" />
                                <div className="absolute inset-0 blur-xl bg-orange-400/20 animate-pulse" />
                            </div>
                            <p className="text-sm font-medium text-white/50 animate-pulse">{t('dashboard_enhancements.generating')}</p>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-orange-300/90 text-white/90 selection:bg-orange-400/30">
                            <div 
                                className="text-base leading-relaxed space-y-4"
                                style={{ color: 'rgba(255, 255, 255, 0.95)' }}
                                dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} 
                            />
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between gap-4">
                    <button 
                        onClick={onRegenerate} 
                        disabled={loading} 
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        {t('calendar.refresh')}
                    </button>
                    <button 
                        onClick={onClose} 
                        className="px-8 py-2.5 rounded-xl text-sm font-black text-black bg-orange-400 hover:bg-orange-300 transition-all shadow-lg shadow-orange-500/20 active:scale-95"
                    >
                        {t('calendar.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AIBriefingClient({ bookings, selectedDate = new Date() }: AIBriefingClientProps) {
    const { t } = useTranslations();
    const { locale } = useLocale();
    const [briefing, setBriefing] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const generateBriefing = async () => {
        setLoading(true);
        try {
            const dayBookings = bookings.filter(b => isSameDay(parseISO(b.reservation_time), selectedDate));
            const active = dayBookings.filter(b => ['pending', 'confirmed', 'seated'].includes(b.status));
            const covers = active.reduce((s, b) => s + (Number(b.guest_count) || 0), 0);

            // Calculate metrics
            const guestsByVisitUrl = new Map<string, number>();
            const guestsByNoShows = new Map<string, number>();
            const hoursCount = new Map<number, number>();

            bookings.forEach(b => {
                const hour = new Date(b.reservation_time).getHours();
                if (isSameDay(parseISO(b.reservation_time), selectedDate)) {
                    hoursCount.set(hour, (hoursCount.get(hour) || 0) + 1);
                } else if (b.status === 'completed') {
                    guestsByVisitUrl.set(b.guest_name, (guestsByVisitUrl.get(b.guest_name) || 0) + 1);
                } else if (b.status === 'no_show') {
                    guestsByNoShows.set(b.guest_name, (guestsByNoShows.get(b.guest_name) || 0) + 1);
                }
            });

            const vips = dayBookings.filter(b => (guestsByVisitUrl.get(b.guest_name) || 0) >= 5).length;
            const highRisk = dayBookings.filter(b => (guestsByNoShows.get(b.guest_name) || 0) >= 2).length;
            const firstTimers = dayBookings.filter(b => (guestsByVisitUrl.get(b.guest_name) || 0) === 0).length;

            let peakHourStr = 'N/A';
            let maxBookings = 0;
            hoursCount.forEach((count, h) => {
                if (count > maxBookings) {
                    maxBookings = count;
                    peakHourStr = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
                }
            });

            const response = await fetch('/api/ai-briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    bookings: dayBookings,
                    locale: locale,
                    metrics: {
                        expectedGuests: covers,
                        vips,
                        firstTimers,
                        highRisk,
                        peakHour: peakHourStr
                    }
                })
            });

            const data = await response.json();
            if (data.briefing) {
                setBriefing(data.briefing);
            } else if (data.error) {
                toast.error(data.error);
            }
        } catch (error) {
            console.error('Briefing failure:', error);
            toast.error('Briefing temporarily unavailable');
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate briefing on first load if not done today
    useEffect(() => {
        const autoRun = async () => {
            if (bookings.length > 0 && !briefing && !loading) {
                const lastBriefingDate = localStorage.getItem('tablo_last_briefing_dashboard');
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                
                if (lastBriefingDate !== todayStr) {
                    setShowModal(true);
                    await generateBriefing();
                    localStorage.setItem('tablo_last_briefing_dashboard', todayStr);
                }
            }
        };
        autoRun();
    }, [bookings.length]);

    return (
        <>
            <button
                onClick={() => { setShowModal(true); if (!briefing) generateBriefing(); }}
                disabled={loading}
                className="flex w-full sm:w-auto justify-center sm:justify-start items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold smooth-transition shadow-sm border animate-in slide-in-from-right-2"
                style={{ 
                    background: 'hsl(38 80% 55% / 0.12)', 
                    color: 'hsl(38 80% 65%)', 
                    borderColor: 'hsl(38 80% 55% / 0.2)' 
                }}
            >
                <Sparkles className={cn("h-4 w-4", loading && "animate-pulse")} />
                {t('dashboard_enhancements.aiBriefing')}
            </button>

            {showModal && (
                <BriefingModal 
                    content={briefing || ''} 
                    loading={loading} 
                    onClose={() => setShowModal(false)} 
                    onRegenerate={generateBriefing}
                />
            )}
        </>
    );
}
