'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useTranslations } from 'next-intl';
import {
    Loader2, Calendar, Users, TrendingUp, BarChart3,
    Clock, CheckCircle, PieChart, Users2, Building2, EyeOff,
    Download
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { getAnalytics } from '@/app/actions/analytics';
import { exportReservations, exportGuestList } from '@/app/actions/export';
import { cn } from '@/lib/utils';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
    return (
        <div className="dash-card p-5 flex flex-col gap-3" style={{ borderLeft: `3px solid ${color}` }}>
            <div className="flex items-start justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(220 15% 45%)' }}>
                    {label}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${color}22` }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
                {sub && <div className="mt-1 text-xs" style={{ color: 'hsl(220 15% 45%)' }}>{sub}</div>}
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const t = useTranslations('analytics');
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    
    // Default to last 30 days
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [preset, setPreset] = useState('30D');
    
    // Export state
    const [exporting, setExporting] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const { data: result, error } = await getAnalytics(dateFrom, dateTo);
            if (error) {
                toast.error(error);
            } else {
                setData(result);
            }
            setLoading(false);
        }
        load();
    }, [dateFrom, dateTo]);

    const handlePreset = (days: number, id: string) => {
        setPreset(id);
        setDateTo(format(new Date(), 'yyyy-MM-dd'));
        setDateFrom(format(subDays(new Date(), days - 1), 'yyyy-MM-dd'));
    };

    const handleMonth = () => {
        setPreset('MTD');
        setDateTo(format(new Date(), 'yyyy-MM-dd'));
        setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    };

    const handleYear = () => {
        setPreset('YTD');
        setDateTo(format(new Date(), 'yyyy-MM-dd'));
        setDateFrom(format(startOfYear(new Date()), 'yyyy-MM-dd'));
    };

    async function handleExportReservations() {
        setExporting('reservations');
        const { data: csvData, error } = await exportReservations(dateFrom + 'T00:00:00', dateTo + 'T23:59:59');
        if (error) {
            toast.error(error);
        } else if (csvData) {
            downloadCSV(csvData, `reservations_${dateFrom}_to_${dateTo}.csv`);
            toast.success(t('success.exported'));
        }
        setExporting(null);
    }

    async function handleExportGuests() {
        setExporting('guests');
        const { data: csvData, error } = await exportGuestList();
        if (error) {
            toast.error(error);
        } else if (csvData) {
            downloadCSV(csvData, `guest_list_${format(new Date(), 'yyyy-MM-dd')}.csv`);
            toast.success(t('success.exported'));
        }
        setExporting(null);
    }

    function downloadCSV(csv: string, filename: string) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    if (!data && loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 60%)' }} />
            </div>
        );
    }

    const { kpis, dailyTrends, hourlyDistribution, weekdayAverages } = data || {};
    
    // Chart helpers
    const maxCovers = dailyTrends ? Math.max(...dailyTrends.map((d: any) => d.covers), 1) : 1;
    const maxHourly = hourlyDistribution ? Math.max(...hourlyDistribution.map((d: any) => d.count), 1) : 1;
    const maxWeekday = weekdayAverages ? Math.max(...weekdayAverages.map((d: any) => d.avgCovers), 1) : 1;

    // Weekday labels based on locale
    const weekdayNames = [
        t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'), 
        t('days.thu'), t('days.fri'), t('days.sat')
    ];

    // Source breakdown chart 
    const totalKnown = (kpis?.preBooked || 0) + (kpis?.walkIns || 0);
    const preBookedPct = totalKnown > 0 ? ((kpis?.preBooked / totalKnown) * 100).toFixed(1) : 0;
    const walkInPct = totalKnown > 0 ? ((kpis?.walkIns / totalKnown) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6 pb-12">
            {/* Header & Date Picker */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <PieChart className="h-6 w-6" style={{ color: 'hsl(347 78% 60%)' }} />
                        {t('title')}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>
                        {t('subtitle')}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                    <button 
                        onClick={handleExportReservations} 
                        disabled={exporting !== null}
                        className="btn-dash-primary flex items-center gap-2 h-9 px-3 text-sm shrink-0"
                    >
                        {exporting === 'reservations' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {t('exportReservations')}
                    </button>
                    <button 
                        onClick={handleExportGuests} 
                        disabled={exporting !== null}
                        className="btn-dash-ghost flex items-center gap-2 h-9 px-3 text-sm shrink-0"
                        style={{ border: '1px solid hsl(231 24% 20%)' }}
                    >
                        {exporting === 'guests' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {t('exportGuests')}
                    </button>
                </div>

                <div className="flex-wrap items-center gap-2 bg-hsl(231_24%_12%) p-1 rounded-lg border border-hsl(231_24%_18%)" style={{ background: 'hsl(231 24% 12%)', borderColor: 'hsl(231 24% 18%)' }}>
                    <button onClick={() => handlePreset(7, '7D')} className={cn("px-3 py-1.5 text-xs font-medium rounded-md smooth-transition", preset === '7D' ? 'bg-hsl(231_24%_25%) text-white' : 'text-hsl(220_15%_55%) hover:text-white')} style={preset === '7D' ? { background: 'hsl(231 24% 20%)' } : {}}>{t('last7Days')}</button>
                    <button onClick={() => handlePreset(30, '30D')} className={cn("px-3 py-1.5 text-xs font-medium rounded-md smooth-transition", preset === '30D' ? 'bg-hsl(231_24%_25%) text-white' : 'text-hsl(220_15%_55%) hover:text-white')} style={preset === '30D' ? { background: 'hsl(231 24% 20%)' } : {}}>{t('last30Days')}</button>
                    <button onClick={handleMonth} className={cn("px-3 py-1.5 text-xs font-medium rounded-md smooth-transition", preset === 'MTD' ? 'bg-hsl(231_24%_25%) text-white' : 'text-hsl(220_15%_55%) hover:text-white')} style={preset === 'MTD' ? { background: 'hsl(231 24% 20%)' } : {}}>{t('thisMonth')}</button>
                    <button onClick={handleYear} className={cn("px-3 py-1.5 text-xs font-medium rounded-md smooth-transition", preset === 'YTD' ? 'bg-hsl(231_24%_25%) text-white' : 'text-hsl(220_15%_55%) hover:text-white')} style={preset === 'YTD' ? { background: 'hsl(231 24% 20%)' } : {}}>{t('yearToDate')}</button>
                    <div className="h-4 w-px bg-hsl(231_24%_20%) mx-1" style={{ background: 'hsl(231 24% 25%)' }}></div>
                    <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPreset('custom'); }} className="bg-transparent border-none text-xs text-white p-1 ml-1 cursor-pointer focus:ring-0" />
                    <span className="text-xs" style={{ color: 'hsl(220 15% 45%)' }}>-</span>
                    <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPreset('custom'); }} className="bg-transparent border-none text-xs text-white p-1 cursor-pointer focus:ring-0" />
                </div>
            </div>
 
            {loading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 pointer-events-none">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 60%)' }} />
                </div>
            )}
 
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label={t('totalReservations')} value={kpis?.totalBookings || 0} icon={Calendar} color="hsl(347 78% 58%)" />
                <StatCard label={t('totalCovers')} value={kpis?.totalCovers || 0} sub={t('avgPartySize', { size: kpis?.avgPartySize || '0' })} icon={Users} color="hsl(262 60% 56%)" />
                <StatCard label={t('walkIns')} value={kpis?.walkIns || 0} sub={`${walkInPct}% ${t('ofTotal')}`} icon={Building2} color="hsl(38 80% 55%)" />
                <StatCard label={t('noShows')} value={kpis?.noShows || 0} sub={`${kpis?.totalBookings > 0 ? ((kpis.noShows / kpis.totalBookings) * 100).toFixed(1) : 0}% ${t('rate')}`} icon={EyeOff} color="hsl(0 72% 55%)" />
            </div>
 
            {/* Charts Row 1 */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Daily Trend */}
                <div className="dash-card p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" style={{ color: 'hsl(160 60% 50%)' }} />
                        {t('dailyCoversTrend')}
                    </h3>
                    
                    <div className="flex items-end h-[200px] gap-1 px-2">
                        {dailyTrends?.map((day: any, i: number) => {
                            const pct = maxCovers > 0 ? (day.covers / maxCovers) * 100 : 0;
                            // Only show every Nth date label to avoid crowding
                            const showLabel = dailyTrends.length <= 14 || i % Math.ceil(dailyTrends.length / 10) === 0;
                            const d = new Date(day.date + 'T12:00:00');
                            
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center justify-end relative group h-full">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none font-bold shadow-lg">
                                        {format(d, 'MMM d')}: {day.covers} {t('totalCovers').toLowerCase()}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white"></div>
                                    </div>
                                    
                                    {/* Bar */}
                                    <div 
                                        className="w-full mx-0.5 rounded-t-sm smooth-transition hover:opacity-80 cursor-pointer" 
                                        style={{ 
                                            height: `${Math.max(pct, 2)}%`, 
                                            background: 'linear-gradient(180deg, hsl(347 78% 58%), hsl(318 70% 45%))' 
                                        }} 
                                    />
                                    
                                    {/* Label */}
                                    <div className="h-6 mt-2 text-[10px] whitespace-nowrap overflow-visible relative w-full" style={{ color: 'hsl(220 15% 45%)' }}>
                                        {showLabel && <span className="absolute left-1/2 -translate-x-1/2">{format(d, 'MMM d')}</span>}
                                    </div>
                                </div>
                            );
                        })}
                        {(!dailyTrends || dailyTrends.length === 0) && (
                            <div className="w-full text-center pb-8 text-sm" style={{ color: 'hsl(220 15% 45%)' }}>{t('noData')}</div>
                        )}
                    </div>
                </div>
 
                {/* Source Mix */}
                <div className="dash-card p-6 flex flex-col">
                    <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                        <Users2 className="h-4 w-4" style={{ color: 'hsl(200 70% 50%)' }} />
                        {t('guestSourceMix')}
                    </h3>
                    
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-[16px] border-t-hsl(38_80%_55%) border-r-hsl(38_80%_55%) border-b-hsl(262_60%_56%) border-l-hsl(262_60%_56%)"
                             style={{
                                 borderColor: 'rgba(255,255,255,0.1)', // fallback base
                                 // Simple CSS pie chart approximation for 2 values
                                 background: `conic-gradient(
                                     hsl(262 60% 56%) 0% ${preBookedPct}%, 
                                     hsl(38 80% 55%) ${preBookedPct}% 100%
                                 )`,
                                 borderRadius: '50%'
                             }}>
                        </div>
                        
                        <div className="w-full mt-8 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-white">
                                    <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(262 60% 56%)' }}></div>
                                    {t('onlinePreBooked')}
                                </div>
                                <div className="font-bold text-white">{kpis?.preBooked || 0} <span className="text-xs font-normal" style={{ color: 'hsl(220 15% 45%)' }}>({preBookedPct}%)</span></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-white">
                                    <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(38 80% 55%)' }}></div>
                                    {t('walkIn')}
                                </div>
                                <div className="font-bold text-white">{kpis?.walkIns || 0} <span className="text-xs font-normal" style={{ color: 'hsl(220 15% 45%)' }}>({walkInPct}%)</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
 
            {/* Charts Row 2 */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Popular Days */}
                <div className="dash-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                        <Calendar className="h-4 w-4" style={{ color: 'hsl(347 78% 58%)' }} />
                        {t('popularDays')}
                    </h3>
                    
                    <div className="space-y-4">
                        {weekdayAverages?.map((day: any) => {
                            const pct = maxWeekday > 0 ? (day.avgCovers / maxWeekday) * 100 : 0;
                            return (
                                <div key={day.dayIndex} className="flex items-center gap-4">
                                    <div className="w-10 shrink-0 text-xs font-medium text-right" style={{ color: 'hsl(220 15% 55%)' }}>
                                        {weekdayNames[day.dayIndex]}
                                    </div>
                                    <div className="flex-1 h-5 rounded-sm overflow-hidden flex" style={{ background: 'hsl(231 24% 14%)' }}>
                                        <div 
                                            className="h-full smooth-transition" 
                                            style={{ 
                                                width: `${pct}%`, 
                                                background: 'hsl(347 78% 58% / 0.8)',
                                                borderRight: '2px solid hsl(347 78% 65%)'
                                            }} 
                                        />
                                    </div>
                                    <div className="w-12 shrink-0 text-xs font-bold text-white text-left">
                                        {day.avgCovers} <span className="font-normal" style={{ color: 'hsl(220 15% 40%)' }}>{t('avg')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
 
                {/* Busiest Hours */}
                <div className="dash-card p-6">
                    <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
                        <Clock className="h-4 w-4" style={{ color: 'hsl(200 70% 50%)' }} />
                        {t('busiestHours')}
                    </h3>
                    
                    <div className="flex items-end h-[240px] gap-1 px-2">
                        {hourlyDistribution?.map((h: any) => {
                            const pct = maxHourly > 0 ? (h.count / maxHourly) * 100 : 0;
                            
                            return (
                                <div key={h.hour} className="flex-1 flex flex-col items-center justify-end relative group h-full">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none font-bold shadow-lg">
                                        {h.hour}: {h.count} {t('totalReservations').toLowerCase()}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white"></div>
                                    </div>
                                    
                                    {/* Bar */}
                                    <div 
                                        className="w-full max-w-[20px] mx-0.5 rounded-sm smooth-transition hover:opacity-80 cursor-pointer" 
                                        style={{ 
                                            height: `${Math.max(pct, 2)}%`, 
                                            background: 'hsl(200 70% 50%)' 
                                        }} 
                                    />
                                    
                                    {/* Label */}
                                    <div className="h-8 mt-2 text-[10px] text-center" style={{ color: 'hsl(220 15% 45%)', transform: 'rotate(-45deg)', transformOrigin: 'top center' }}>
                                        {h.hour}
                                    </div>
                                </div>
                            );
                        })}
                        {(!hourlyDistribution || hourlyDistribution.length === 0) && (
                            <div className="w-full text-center pb-8 text-sm" style={{ color: 'hsl(220 15% 45%)' }}>{t('noData')}</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}

