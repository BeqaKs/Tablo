'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    getOwnerBookings, updateOwnerBookingStatus, getOwnerRestaurant,
    getOwnerTables, createWalkInBooking, updateBookingNotes
} from '@/app/actions/owner';
import { getRestaurantWaitlist, promoteFromWaitlist, leaveWaitlist } from '@/app/actions/waitlist';
import { useTranslations } from '@/components/translations-provider';
import { toast } from 'sonner';
import {
    CalendarDays, ChevronLeft, ChevronRight, Users, Clock,
    Phone, MessageSquare, Check, X, Plus, Loader2,
    ChevronDown, CircleDot, AlertCircle, Edit3, Save,
    UserPlus, LayoutGrid, List, RefreshCw, Coffee, ListChecks
} from 'lucide-react';
import {
    format, addDays, subDays, isSameDay, isToday,
    startOfWeek, endOfWeek, eachDayOfInterval,
    parseISO, getHours, getMinutes, differenceInMinutes,
    startOfDay, addMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Constants ─────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64; // px per hour in timeline
const START_HOUR = 10;  // 10:00
const END_HOUR = 24;    // midnight
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const getStatusCfg = (t: any): Record<string, { label: string; bg: string; border: string; text: string; dot: string }> => ({
    pending: { label: t.calendar?.status?.pending || 'Pending', bg: 'hsl(38 80% 55% / 0.18)', border: 'hsl(38 80% 55% / 0.5)', text: 'hsl(38 80% 75%)', dot: 'hsl(38 80% 60%)' },
    confirmed: { label: t.calendar?.status?.confirmed || 'Confirmed', bg: 'hsl(200 70% 50% / 0.18)', border: 'hsl(200 70% 50% / 0.5)', text: 'hsl(200 70% 75%)', dot: 'hsl(200 70% 55%)' },
    seated: { label: t.calendar?.status?.seated || 'Seated', bg: 'hsl(160 60% 45% / 0.20)', border: 'hsl(160 60% 45% / 0.5)', text: 'hsl(160 60% 75%)', dot: 'hsl(160 60% 50%)' },
    completed: { label: t.calendar?.status?.completed || 'Done', bg: 'hsl(220 15% 28% / 0.6)', border: 'hsl(220 15% 35% / 0.5)', text: 'hsl(220 15% 55%)', dot: 'hsl(220 15% 45%)' },
    cancelled: { label: t.calendar?.status?.cancelled || 'Cancelled', bg: 'hsl(347 78% 50% / 0.15)', border: 'hsl(347 78% 50% / 0.4)', text: 'hsl(347 78% 70%)', dot: 'hsl(347 78% 55%)' },
    no_show: { label: t.calendar?.status?.noShow || 'No Show', bg: 'hsl(262 60% 50% / 0.18)', border: 'hsl(262 60% 50% / 0.4)', text: 'hsl(262 60% 70%)', dot: 'hsl(262 60% 55%)' },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function minutesSinceStart(dt: Date) {
    return (getHours(dt) - START_HOUR) * 60 + getMinutes(dt);
}

function topPx(startMin: number) { return (startMin / 60) * HOUR_HEIGHT; }
function heightPx(durationMin: number) { return Math.max((durationMin / 60) * HOUR_HEIGHT, 28); }

const sc = (t: any, status: string) => getStatusCfg(t)[status] || getStatusCfg(t).pending;
const now = () => new Date();

// ─── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslations();
    const cfg = getStatusCfg(t)[status] || getStatusCfg(t).pending;
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
            {cfg.label}
        </span>
    );
}

// ─── WalkInModal ────────────────────────────────────────────────────────────

function WalkInModal({
    tables, selectedDate, defaultTime, onClose, onSave
}: {
    tables: any[]; selectedDate: Date; defaultTime: string;
    onClose: () => void; onSave: () => void;
}) {
    const { t } = useTranslations();
    const [form, setForm] = useState({
        table_id: tables[0]?.id || '',
        guest_name: '',
        guest_count: 2,
        guest_phone: '',
        guest_notes: '',
        time: defaultTime,
        duration_hours: 2,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!form.guest_name.trim()) { toast.error(t.calendar?.guestNameRequired || 'Guest name required'); return; }
        if (!form.table_id) { toast.error(t.calendar?.selectATable || 'Select a table'); return; }
        setSaving(true);
        const [h, m] = form.time.split(':').map(Number);
        const dt = new Date(selectedDate);
        dt.setHours(h, m, 0, 0);
        const endDt = new Date(dt.getTime() + form.duration_hours * 3600000);
        const result = await createWalkInBooking({
            table_id: form.table_id,
            guest_name: form.guest_name,
            guest_count: form.guest_count,
            guest_phone: form.guest_phone || undefined,
            guest_notes: form.guest_notes || undefined,
            reservation_time: dt.toISOString(),
            end_time: endDt.toISOString(),
        });
        setSaving(true); // intentional to show saving state
        setSaving(false);
        if (result.error) toast.error(result.error);
        else { toast.success(t.calendar?.walkInAdded || 'Walk-in added!'); onSave(); onClose(); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.65)' }}>
            <div className="w-full sm:w-[440px] rounded-t-3xl sm:rounded-2xl p-6 space-y-5" style={{ background: 'hsl(231 32% 13%)', border: '1px solid hsl(231 24% 20%)' }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(160 60% 45% / 0.15)' }}>
                            <UserPlus className="h-4 w-4" style={{ color: 'hsl(160 60% 60%)' }} />
                        </div>
                        <h3 className="font-bold text-white">{t.calendar?.quickWalkIn}</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg btn-dash-ghost"><X className="h-4 w-4" /></button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                        <label className="dash-label">{t.calendar?.guestName} *</label>
                        <input className="dash-input w-full" placeholder={t.calendar?.guestName} value={form.guest_name}
                            onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} />
                    </div>
                    <div>
                        <label className="dash-label">{t.calendar?.table}</label>
                        <select className="dash-input w-full" value={form.table_id}
                            onChange={e => setForm(f => ({ ...f, table_id: e.target.value }))}>
                            {tables.map(table => (
                                <option key={table.id} value={table.id}>{t('dashboard.tableShort') || 'T'}{table.table_number} ({t.calendar?.guests} {table.capacity})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="dash-label">{t.calendar?.guests}</label>
                        <input type="number" min="1" max="20" className="dash-input w-full" value={form.guest_count}
                            onChange={e => setForm(f => ({ ...f, guest_count: +e.target.value }))} />
                    </div>
                    <div>
                        <label className="dash-label">{t.calendar?.startTime}</label>
                        <input type="time" className="dash-input w-full" value={form.time}
                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                    </div>
                    <div>
                        <label className="dash-label">{t.calendar?.duration}</label>
                        <select className="dash-input w-full" value={form.duration_hours}
                            onChange={e => setForm(f => ({ ...f, duration_hours: +e.target.value }))}>
                            {[0.5, 1, 1.5, 2, 2.5, 3, 4].map(h => (
                                <option key={h} value={h}>{h === 0.5 ? `30 ${t.calendar?.min}` : `${h}${t.calendar?.h}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="dash-label">{t.calendar?.phone}</label>
                        <input className="dash-input w-full" placeholder="+1..." value={form.guest_phone}
                            onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                        <label className="dash-label">{t.calendar?.notes}</label>
                        <input className="dash-input w-full" placeholder="..."
                            value={form.guest_notes} onChange={e => setForm(f => ({ ...f, guest_notes: e.target.value }))} />
                    </div>
                </div>

                <button onClick={handleSubmit} disabled={saving}
                    className="w-full py-3 rounded-xl font-semibold text-sm smooth-transition btn-dash-primary flex items-center justify-center gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {saving ? t.calendar?.saving : t.calendar?.confirmWalkIn}
                </button>
            </div>
        </div>
    );
}

// ─── BookingSlideOver ────────────────────────────────────────────────────────

function BookingSlideOver({
    booking, tables, onClose, onStatusChange, onRefresh
}: {
    booking: any; tables: any[]; onClose: () => void;
    onStatusChange: (id: string, status: string) => Promise<void>;
    onRefresh: () => void;
}) {
    const { t } = useTranslations();
    const [notes, setNotes] = useState(booking.guest_notes || '');
    const [editingNotes, setEditingNotes] = useState(false);
    const [savingNotes, setSavingNotes] = useState(false);
    const [changing, setChanging] = useState<string | null>(null);
    const date = parseISO(booking.reservation_time);
    const endDate = booking.end_time ? parseISO(booking.end_time) : null;
    const cfg = getStatusCfg(t)[booking.status] || getStatusCfg(t).pending;
    const table = tables.find(t => t.id === booking.table_id);

    const handleStatus = async (status: string) => {
        setChanging(status);
        await onStatusChange(booking.id, status);
        setChanging(null);
        onRefresh();
        onClose();
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        const { updateBookingNotes } = await import('@/app/actions/owner');
        await updateBookingNotes(booking.id, notes);
        setSavingNotes(false);
        setEditingNotes(false);
        toast.success(t.calendar?.saveSuccess || 'Notes saved');
    };

    const NEXT_ACTIONS: Record<string, { status: string; label: string; color: string }[]> = {
        pending: [
            { status: 'confirmed', label: t.calendar?.status?.confirmed || 'Confirm', color: 'hsl(200 70% 50%)' },
            { status: 'cancelled', label: t.calendar?.status?.cancelled || 'Cancel', color: 'hsl(347 78% 55%)' },
        ],
        confirmed: [
            { status: 'seated', label: t.calendar?.status?.seated || 'Seat Now', color: 'hsl(160 60% 45%)' },
            { status: 'no_show', label: t.calendar?.status?.noShow || 'No Show', color: 'hsl(262 60% 50%)' },
            { status: 'cancelled', label: t.calendar?.status?.cancelled || 'Cancel', color: 'hsl(347 78% 55%)' },
        ],
        seated: [
            { status: 'completed', label: t.calendar?.status?.completed || 'Mark Complete', color: 'hsl(220 15% 55%)' },
        ],
    };
    const actions = NEXT_ACTIONS[booking.status] || [];

    return (
        <div className="fixed inset-0 z-50 flex" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
            {/* Panel */}
            <div
                className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] flex flex-col shadow-2xl overflow-y-auto"
                style={{ background: 'hsl(231 32% 11%)', borderLeft: '1px solid hsl(231 24% 18%)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6" style={{ borderBottom: '1px solid hsl(231 24% 18%)' }}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">{booking.guest_name}</h2>
                            <p className="text-sm mt-0.5" style={{ color: 'hsl(220 15% 50%)' }}>
                                {format(date, 'EEE, MMM d')} · {format(date, 'h:mm a')}
                                {endDate && ` → ${format(endDate, 'h:mm a')}`}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg btn-dash-ghost shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <StatusBadge status={booking.status} />
                </div>

                {/* Details */}
                <div className="p-6 space-y-5 flex-1">
                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { icon: Users, label: t.calendar?.partySize, value: `${booking.guest_count} ${t.calendar?.guests}` },
                            { icon: LayoutGrid, label: t.calendar?.table, value: table ? `${t('dashboard.tableShort') || 'Table'} ${table.table_number} (cap. ${table.capacity})` : booking.tables?.table_number || 'N/A' },
                            { icon: Clock, label: t.calendar?.duration, value: endDate ? `${differenceInMinutes(endDate, date)}${t.calendar?.min}` : `2${t.calendar?.h} (est.)` },
                            { icon: Phone, label: t.calendar?.phone, value: booking.guest_phone || '—' },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="rounded-xl p-3" style={{ background: 'hsl(231 32% 14%)' }}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Icon className="h-3 w-3" style={{ color: 'hsl(220 15% 45%)' }} />
                                    <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'hsl(220 15% 45%)' }}>{label}</span>
                                </div>
                                <p className="text-sm font-semibold text-white truncate">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5" style={{ color: 'hsl(220 15% 45%)' }} />
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(220 15% 45%)' }}>{t.calendar?.notes}</span>
                            </div>
                            {!editingNotes && (
                                <button onClick={() => setEditingNotes(true)} className="flex items-center gap-1 text-xs btn-dash-ghost px-2 py-1 rounded">
                                    <Edit3 className="h-3 w-3" /> {t.calendar?.edit}
                                </button>
                            )}
                        </div>
                        {editingNotes ? (
                            <div className="space-y-2">
                                <textarea
                                    rows={3}
                                    className="dash-input w-full resize-none"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={`${t.calendar?.notes}...`}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSaveNotes} disabled={savingNotes}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold btn-dash-primary">
                                        {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                        {t.calendar?.save}
                                    </button>
                                    <button onClick={() => { setEditingNotes(false); setNotes(booking.guest_notes || ''); }}
                                        className="px-3 py-1.5 rounded-lg text-xs btn-dash-ghost">{t.calendar?.cancel}</button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl p-3 min-h-[56px] text-sm italic"
                                style={{ background: 'hsl(231 32% 14%)', color: notes ? 'hsl(220 15% 65%)' : 'hsl(220 15% 35%)' }}>
                                {notes || t.calendar?.noNotes}
                            </div>
                        )}
                    </div>

                    {/* Timeline indicators */}
                    <div className="rounded-xl p-4" style={{ background: 'hsl(231 32% 14%)', border: '1px solid hsl(231 24% 20%)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'hsl(220 15% 42%)' }}>{t.calendar?.bookingTimeline}</p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ background: getStatusCfg(t)[booking.status].dot }} />
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(231 24% 20%)' }}>
                                {(() => {
                                    const now = new Date();
                                    const start = date;
                                    const end = endDate || addMinutes(date, 120);
                                    const total = differenceInMinutes(end, start);
                                    const elapsed = Math.min(Math.max(differenceInMinutes(now, start), 0), total);
                                    const pct = total > 0 ? (elapsed / total) * 100 : 0;
                                    return (
                                        <div className="h-full rounded-full" style={{
                                            width: `${pct}%`,
                                            background: getStatusCfg(t)[booking.status].dot,
                                        }} />
                                    );
                                })()}
                            </div>
                            <div className="h-2 w-2 rounded-full" style={{ background: 'hsl(231 24% 30%)' }} />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px]" style={{ color: 'hsl(220 15% 40%)' }}>
                            <span>{format(date, 'h:mm a')}</span>
                            <span>{endDate ? format(endDate, 'h:mm a') : '+'}</span>
                        </div>
                    </div>
                </div>

                {/* Actions footer */}
                {actions.length > 0 && (
                    <div className="p-6 space-y-3" style={{ borderTop: '1px solid hsl(231 24% 18%)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'hsl(220 15% 42%)' }}>{t.calendar?.changeStatus}</p>
                        <div className="flex flex-col gap-2">
                            {actions.map(action => (
                                <button
                                    key={action.status}
                                    disabled={!!changing}
                                    onClick={() => handleStatus(action.status)}
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold smooth-transition flex items-center justify-center gap-2"
                                    style={{
                                        background: `${action.color}22`,
                                        color: action.color,
                                        border: `1px solid ${action.color}44`,
                                        opacity: changing && changing !== action.status ? 0.5 : 1,
                                    }}
                                >
                                    {changing === action.status
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : action.status === 'seated' ? <Check className="h-4 w-4" />
                                            : action.status === 'cancelled' ? <X className="h-4 w-4" />
                                                : action.status === 'no_show' ? <AlertCircle className="h-4 w-4" />
                                                    : <Check className="h-4 w-4" />
                                    }
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

function TimelineView({
    bookings, tables, selectedDate, onSelectBooking
}: {
    bookings: any[]; tables: any[]; selectedDate: Date;
    onSelectBooking: (b: any) => void;
}) {
    const { t } = useTranslations();
    const scrollRef = useRef<HTMLDivElement>(null);
    const nowRef = useRef<HTMLDivElement>(null);
    const currentMinute = (getHours(new Date()) - START_HOUR) * 60 + getMinutes(new Date());
    const isCurrentDay = isToday(selectedDate);

    // Auto scroll to 1h before current time on load
    useEffect(() => {
        if (isCurrentDay && scrollRef.current) {
            const scrollTo = Math.max(0, topPx(currentMinute) - HOUR_HEIGHT * 2);
            scrollRef.current.scrollTop = scrollTo;
        } else if (scrollRef.current) {
            // Scroll to first booking
            const dayBookings = bookings.filter(b => isSameDay(parseISO(b.reservation_time), selectedDate));
            if (dayBookings.length > 0) {
                const first = dayBookings.sort((a, b) => +new Date(a.reservation_time) - +new Date(b.reservation_time))[0];
                const startMin = minutesSinceStart(parseISO(first.reservation_time));
                scrollRef.current.scrollTop = Math.max(0, topPx(startMin) - HOUR_HEIGHT * 2);
            }
        }
    }, [selectedDate, isCurrentDay]);

    const dayBookings = bookings.filter(b => isSameDay(parseISO(b.reservation_time), selectedDate));

    // Group by table (visible on timeline), unassigned separately
    const tableIds = tables.map(t => t.id);
    const assignedBookings = dayBookings.filter(b => tableIds.includes(b.table_id));
    const unassignedBookings = dayBookings.filter(b => !tableIds.includes(b.table_id));

    const TIMELINE_LABEL_W = 52; // px

    return (
        <div className="flex flex-col h-full">
            {/* Column headers */}
            <div className="flex shrink-0 overflow-hidden" style={{ marginLeft: TIMELINE_LABEL_W }}>
                {tables.map(t => (
                    <div key={t.id} className="flex-1 min-w-[100px] text-center py-2 text-xs font-semibold"
                        style={{ color: 'hsl(220 20% 65%)', borderRight: '1px solid hsl(231 24% 15%)' }}>
                        {t('dashboard.tableShort') || 'T'}{t.table_number}
                        <span className="block text-[9px] font-normal" style={{ color: 'hsl(220 15% 38%)' }}>cap {t.capacity}</span>
                    </div>
                ))}
                {unassignedBookings.length > 0 && (
                    <div className="flex-1 min-w-[100px] text-center py-2 text-xs font-semibold"
                        style={{ color: 'hsl(38 80% 65%)' }}>
                        {t.calendar?.unassigned}
                    </div>
                )}
                {tables.length === 0 && (
                    <div className="flex-1 text-center py-2 text-xs" style={{ color: 'hsl(220 15% 40%)' }}>{t.calendar?.allBookings}</div>
                )}
            </div>

            {/* Scrollable area */}
            <div ref={scrollRef} className="flex-1 overflow-auto relative" style={{ borderTop: '1px solid hsl(231 24% 16%)' }}>
                <div className="flex" style={{ minHeight: `${HOURS.length * HOUR_HEIGHT}px`, position: 'relative' }}>
                    {/* Time labels */}
                    <div className="shrink-0 select-none" style={{ width: TIMELINE_LABEL_W }}>
                        {HOURS.map(h => (
                            <div key={h} style={{ height: HOUR_HEIGHT, position: 'relative' }}>
                                <span className="absolute -top-2 right-2 text-[10px] font-medium"
                                    style={{ color: 'hsl(220 15% 38%)' }}>
                                    {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Grid + columns */}
                    <div className="flex flex-1 relative">
                        {/* Horizontal hour lines */}
                        <div className="absolute inset-0 pointer-events-none">
                            {HOURS.map((h, i) => (
                                <div key={h} style={{
                                    position: 'absolute', top: i * HOUR_HEIGHT, left: 0, right: 0,
                                    borderTop: '1px solid hsl(231 24% 15%)',
                                }} />
                            ))}
                            {/* Half-hour lines */}
                            {HOURS.map((h, i) => (
                                <div key={`half-${h}`} style={{
                                    position: 'absolute', top: i * HOUR_HEIGHT + HOUR_HEIGHT / 2, left: 0, right: 0,
                                    borderTop: '1px dashed hsl(231 24% 11%)',
                                }} />
                            ))}
                        </div>

                        {/* Now line */}
                        {isCurrentDay && currentMinute >= 0 && currentMinute <= (END_HOUR - START_HOUR) * 60 && (
                            <div
                                ref={nowRef}
                                className="absolute left-0 right-0 z-20 pointer-events-none"
                                style={{ top: topPx(currentMinute) }}
                            >
                                <div className="flex items-center gap-1">
                                    <div className="rounded-full h-2.5 w-2.5 shrink-0" style={{ background: 'hsl(347 78% 58%)' }} />
                                    <div className="flex-1 h-px" style={{ background: 'hsl(347 78% 55%)' }} />
                                </div>
                            </div>
                        )}

                        {/* Table columns */}
                        {tables.length > 0 ? (
                            tables.map(table => {
                                const tableBookings = assignedBookings.filter(b => b.table_id === table.id);
                                return (
                                    <div key={table.id} className="flex-1 min-w-[100px] relative"
                                        style={{ borderRight: '1px solid hsl(231 24% 13%)', height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                                        {tableBookings.map(booking => {
                                            const startMin = minutesSinceStart(parseISO(booking.reservation_time));
                                            const endMin = booking.end_time
                                                ? minutesSinceStart(parseISO(booking.end_time))
                                                : startMin + 120;
                                            const durMin = endMin - startMin;
                                            const cfg = getStatusCfg(t)[booking.status];
                                            return (
                                                <button
                                                    key={booking.id}
                                                    onClick={() => onSelectBooking(booking)}
                                                    className="absolute inset-x-1 rounded-lg text-left p-2 smooth-transition overflow-hidden group"
                                                    style={{
                                                        top: topPx(startMin), height: heightPx(durMin),
                                                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                                                        borderLeft: `3px solid ${cfg.dot}`,
                                                    }}
                                                >
                                                    <p className="text-[11px] font-bold leading-tight truncate" style={{ color: cfg.text }}>
                                                        {booking.guest_name}
                                                    </p>
                                                    {durMin >= 40 && (
                                                        <p className="text-[10px] mt-0.5" style={{ color: cfg.text, opacity: 0.75 }}>
                                                            {booking.guest_count}p · {format(parseISO(booking.reservation_time), 'h:mm')}
                                                        </p>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })
                        ) : (
                            /* No tables configured — show all bookings in one column */
                            <div className="flex-1 relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                                {dayBookings.map(booking => {
                                    const startMin = minutesSinceStart(parseISO(booking.reservation_time));
                                    const endMin = booking.end_time
                                        ? minutesSinceStart(parseISO(booking.end_time))
                                        : startMin + 120;
                                    const cfg = getStatusCfg(t)[booking.status];
                                    return (
                                        <button
                                            key={booking.id}
                                            onClick={() => onSelectBooking(booking)}
                                            className="absolute inset-x-1 rounded-lg text-left p-2 smooth-transition"
                                            style={{
                                                top: topPx(startMin), height: heightPx(endMin - startMin),
                                                background: cfg.bg, border: `1px solid ${cfg.border}`,
                                                borderLeft: `3px solid ${cfg.dot}`,
                                            }}
                                        >
                                            <p className="text-[11px] font-bold truncate" style={{ color: cfg.text }}>{booking.guest_name}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Unassigned column */}
                        {unassignedBookings.length > 0 && (
                            <div className="flex-1 min-w-[100px] relative"
                                style={{ borderRight: '1px solid hsl(231 24% 13%)', height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                                {unassignedBookings.map(booking => {
                                    const startMin = minutesSinceStart(parseISO(booking.reservation_time));
                                    const cfg = getStatusCfg(t)[booking.status];
                                    return (
                                        <button
                                            key={booking.id}
                                            onClick={() => onSelectBooking(booking)}
                                            className="absolute inset-x-1 rounded-lg text-left p-2"
                                            style={{
                                                top: topPx(startMin), height: heightPx(120),
                                                background: cfg.bg, border: `1px solid ${cfg.border}`,
                                                borderLeft: `3px solid ${cfg.dot}`,
                                            }}
                                        >
                                            <p className="text-[11px] font-bold truncate" style={{ color: cfg.text }}>{booking.guest_name}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── WeekStrip ───────────────────────────────────────────────────────────────

function WeekStrip({
    selectedDate, bookings, onSelectDate, onPrevWeek, onNextWeek
}: {
    selectedDate: Date; bookings: any[]; onSelectDate: (d: Date) => void;
    onPrevWeek: () => void; onNextWeek: () => void;
}) {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
        <div className="flex items-center gap-2">
            <button onClick={onPrevWeek} className="p-2 rounded-lg btn-dash-ghost shrink-0">
                <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
                {days.map(day => {
                    const count = bookings.filter(b => isSameDay(parseISO(b.reservation_time), day)).length;
                    const active = bookings.filter(b =>
                        isSameDay(parseISO(b.reservation_time), day) &&
                        ['pending', 'confirmed', 'seated'].includes(b.status)
                    ).length;
                    const isSelected = isSameDay(day, selectedDate);
                    const today = isToday(day);
                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onSelectDate(day)}
                            className="flex-1 min-w-[44px] flex flex-col items-center py-2.5 px-1 rounded-xl smooth-transition"
                            style={{
                                background: isSelected ? 'hsl(347 78% 58% / 0.15)' : today ? 'hsl(231 32% 14%)' : 'transparent',
                                border: isSelected ? '1px solid hsl(347 78% 58% / 0.4)' : '1px solid transparent',
                            }}
                        >
                            <span className="text-[10px] font-semibold uppercase tracking-wider"
                                style={{ color: isSelected ? 'hsl(347 78% 70%)' : 'hsl(220 15% 40%)' }}>
                                {format(day, 'EEE')}
                            </span>
                            <span className="mt-1 text-lg font-bold leading-none"
                                style={{ color: isSelected ? 'white' : today ? 'hsl(220 20% 80%)' : 'hsl(220 15% 55%)' }}>
                                {format(day, 'd')}
                            </span>
                            {count > 0 && (
                                <div className="mt-1.5 flex gap-0.5 items-center">
                                    {active > 0 && (
                                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(160 60% 50%)' }} />
                                    )}
                                    {count - active > 0 && (
                                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'hsl(220 15% 40%)' }} />
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <button onClick={onNextWeek} className="p-2 rounded-lg btn-dash-ghost shrink-0">
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

// ─── ListView ───────────────────────────────────────────────────────────────

function ListView({
    bookings, tables, onSelectBooking
}: {
    bookings: any[]; tables: any[]; onSelectBooking: (b: any) => void;
}) {
    const { t } = useTranslations();
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = bookings.filter(b => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (search && !b.guest_name?.toLowerCase().includes(search.toLowerCase()) &&
            !b.guest_phone?.includes(search)) return false;
        return true;
    });

    const grouped: Record<string, any[]> = {};
    filtered.forEach(b => {
        const key = format(parseISO(b.reservation_time), 'EEE, MMM d, yyyy');
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(b);
    });
    Object.values(grouped).forEach(arr =>
        arr.sort((a, b) => +new Date(a.reservation_time) - +new Date(b.reservation_time))
    );

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <input
                    className="dash-input flex-1 min-w-[160px] text-sm"
                    placeholder={t.calendar?.searchPlaceholder}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'hsl(231 32% 10%)' }}>
                    {['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'].map(s => {
                        const active = statusFilter === s;
                        const cfg = getStatusCfg(t)[s] as any;
                        const label = s === 'all' ? (t.calendar?.all || 'All') : (t.calendar?.status?.[s === 'no_show' ? 'noShow' : s] || s.replace('_', ' '));
                        return (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className="px-3 py-1.5 rounded-md text-[11px] font-semibold smooth-transition capitalize"
                                style={active
                                    ? { background: cfg ? cfg.bg : 'hsl(347 78% 58% / 0.15)', color: cfg ? cfg.text : 'hsl(347 78% 70%)' }
                                    : { color: 'hsl(220 15% 45%)' }
                                }>
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Grouped list */}
            {Object.keys(grouped).length === 0 && (
                <div className="text-center py-16 text-sm rounded-xl"
                    style={{ background: 'hsl(231 32% 10%)', color: 'hsl(220 15% 40%)', border: '1px dashed hsl(231 24% 18%)' }}>
                    {t.calendar?.noResults}
                </div>
            )}
            {Object.entries(grouped).map(([dateLabel, dayBooks]) => (
                <div key={dateLabel}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: 'hsl(220 15% 40%)' }}>{dateLabel}</p>
                    <div className="space-y-1.5">
                        {dayBooks.map(booking => {
                            const cfg = getStatusCfg(t)[booking.status];
                            const table = tables.find(t => t.id === booking.table_id);
                            return (
                                <button key={booking.id} onClick={() => onSelectBooking(booking)}
                                    className="w-full text-left rounded-xl px-4 py-3 smooth-transition flex items-center gap-4"
                                    style={{ background: 'hsl(231 32% 10%)', border: `1px solid hsl(231 24% 16%)`, borderLeft: `3px solid ${cfg.dot}` }}>
                                    <div className="shrink-0 w-14 text-center">
                                        <p className="font-bold text-white text-sm">{format(parseISO(booking.reservation_time), 'h:mm')}</p>
                                        <p className="text-[10px]" style={{ color: 'hsl(220 15% 40%)' }}>{format(parseISO(booking.reservation_time), 'a')}</p>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-semibold text-white text-sm truncate">{booking.guest_name}</p>
                                            <StatusBadge status={booking.status} />
                                        </div>
                                        <div className="flex gap-4 text-xs" style={{ color: 'hsl(220 15% 45%)' }}>
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{booking.guest_count}</span>
                                            <span>{table ? `${t('dashboard.tableShort') || 'T'}${table.table_number}` : booking.tables?.table_number || t.calendar?.noTable || 'No table'}</span>
                                            {booking.guest_phone && <span>{booking.guest_phone}</span>}
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: 'hsl(220 15% 38%)' }} />
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── StatsBar ────────────────────────────────────────────────────────────────

function StatsBar({ bookings, selectedDate }: { bookings: any[]; selectedDate: Date }) {
    const { t } = useTranslations();
    const day = bookings.filter(b => isSameDay(parseISO(b.reservation_time), selectedDate));
    const active = day.filter(b => ['pending', 'confirmed', 'seated'].includes(b.status));
    const covers = active.reduce((s, b) => s + b.guest_count, 0);
    const seated = day.filter(b => b.status === 'seated').length;
    const pending = day.filter(b => b.status === 'pending').length;
    const cancelled = day.filter(b => b.status === 'cancelled').length;

    const stats = [
        { label: t.calendar?.stats?.bookings, value: day.length, sub: `${active.length} ${t.calendar?.stats?.active}`, dot: 'hsl(200 70% 55%)' },
        { label: t.calendar?.stats?.totalCovers, value: covers, sub: t.calendar?.stats?.expectedGuests, dot: 'hsl(262 60% 60%)' },
        { label: t.calendar?.stats?.seated, value: seated, sub: t.calendar?.stats?.currentlyIn, dot: 'hsl(160 60% 50%)' },
        { label: t.calendar?.stats?.pending, value: pending, sub: t.calendar?.stats?.needConfirm, dot: 'hsl(38 80% 60%)' },
        { label: t.calendar?.stats?.cancelled, value: cancelled, sub: t.calendar?.stats?.today, dot: 'hsl(347 78% 58%)' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stats.map(s => (
                <div key={s.label} className="rounded-xl p-4" style={{ background: 'hsl(231 32% 10%)', border: '1px solid hsl(231 24% 16%)' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'hsl(220 15% 40%)' }}>{s.label}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'hsl(220 15% 42%)' }}>{s.sub}</p>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

type ViewMode = 'timeline' | 'list';

export default function OwnerCalendarPage() {
    const { t } = useTranslations();
    const [bookings, setBookings] = useState<any[]>([]);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [tables, setTables] = useState<any[]>([]);
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [showWaitlist, setShowWaitlist] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    const [weekOffset, setWeekOffset] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>('timeline');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showWalkIn, setShowWalkIn] = useState(false);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        const [bRes, rRes, tRes] = await Promise.all([
            getOwnerBookings(), getOwnerRestaurant(), getOwnerTables()
        ]);
        if (bRes.data) setBookings(bRes.data);
        if (rRes.data) {
            setRestaurant(rRes.data);
            const wRes = await getRestaurantWaitlist(rRes.data.id);
            if (wRes?.data) setWaitlist(wRes.data);
        }
        if (tRes.data) setTables(tRes.data);
        if (!silent) setLoading(false); else setRefreshing(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Auto-refresh every 60s
    useEffect(() => {
        const interval = setInterval(() => loadData(true), 60000);
        return () => clearInterval(interval);
    }, [loadData]);

    const handleStatusChange = async (id: string, status: string) => {
        const { error } = await updateOwnerBookingStatus(id, status);
        if (error) toast.error(error);
        else toast.success(`Booking marked as ${status}`);
        await loadData(true);
    };

    const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 58%)' }} />
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center p-12 mt-20" style={{ color: 'hsl(220 15% 45%)' }}>No restaurant assigned.</div>;
    }

    const nowTime = format(new Date(), 'h:mm a');

    return (
        <div className="flex flex-col gap-4 h-[calc(100vh-80px)]">
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        {format(selectedDate, 'EEEE, MMMM d')}
                    </h1>
                    <p className="text-sm mt-0.5 flex items-center gap-2" style={{ color: 'hsl(220 15% 44%)' }}>
                        <Clock className="h-3.5 w-3.5" />
                        {nowTime} · {restaurant.name}
                        {refreshing && <RefreshCw className="h-3 w-3 animate-spin" />}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {/* Today */}
                    <button onClick={() => setSelectedDate(startOfDay(new Date()))}
                        className="px-3 py-2 rounded-lg text-sm font-semibold btn-dash-ghost hidden sm:block">
                        {t.calendar?.today}
                    </button>
                    {/* View toggle */}
                    <div className="flex bg-[hsl(231_32%_10%)] p-1 rounded-lg">
                        <button onClick={() => setViewMode('timeline')}
                            className={cn('px-4 py-1.5 rounded-md text-xs font-semibold smooth-transition flex items-center gap-2',
                                viewMode === 'timeline' ? 'bg-hsl(231_24%_18%) text-white' : 'text-hsl(220_15%_45%)')}
                            style={viewMode === 'timeline' ? { background: 'hsl(231 24% 18%)', color: 'white' } : {}}>
                            <LayoutGrid className="h-3.5 w-3.5" />
                            {t.calendar?.timeline}
                        </button>
                        <button onClick={() => setViewMode('list')}
                            className={cn('px-4 py-1.5 rounded-md text-xs font-semibold smooth-transition flex items-center gap-2',
                                viewMode === 'list' ? 'bg-hsl(231_24%_18%) text-white' : 'text-hsl(220_15%_45%)')}
                            style={viewMode === 'list' ? { background: 'hsl(231 24% 18%)', color: 'white' } : {}}>
                            <List className="h-3.5 w-3.5" />
                            {t.calendar?.list}
                        </button>
                    </div>
                    {/* Walk-in */}
                    <button
                        onClick={() => setShowWalkIn(true)}
                        className="bg-hsl(160_60%_45%) hover:bg-hsl(160_60%_40%) text-white px-4 py-2 rounded-lg text-sm font-semibold smooth-transition flex items-center gap-2"
                        style={{ background: 'hsl(160 60% 45%)' }}
                    >
                        <UserPlus className="h-4 w-4" />
                        {t.calendar?.quickWalkIn}
                    </button>
                    {/* Waitlist Toggle */}
                    <button onClick={() => setShowWaitlist(true)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold smooth-transition ${showWaitlist ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>
                        <ListChecks className="h-4 w-4" />
                        {t.calendar?.waitlist} {waitlist.length > 0 && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">{waitlist.length}</span>}
                    </button>
                </div>
            </div>

            {/* ── Week strip ── */}
            <div className="shrink-0 dash-card p-3">
                <WeekStrip
                    selectedDate={selectedDate}
                    bookings={bookings}
                    onSelectDate={d => setSelectedDate(d)}
                    onPrevWeek={() => setWeekOffset(w => w - 1)}
                    onNextWeek={() => setWeekOffset(w => w + 1)}
                />
            </div>

            {/* ── Stats bar ── */}
            <div className="shrink-0">
                <StatsBar bookings={bookings} selectedDate={selectedDate} />
            </div>

            {/* ── Main content ── */}
            <div className="flex-1 min-h-0 dash-card overflow-hidden">
                {viewMode === 'timeline' ? (
                    <TimelineView
                        bookings={bookings}
                        tables={tables}
                        selectedDate={selectedDate}
                        onSelectBooking={setSelectedBooking}
                    />
                ) : (
                    <div className="h-full overflow-auto p-5">
                        <ListView
                            bookings={bookings}
                            tables={tables}
                            onSelectBooking={setSelectedBooking}
                        />
                    </div>
                )}
            </div>

            {/* ── Status legend ── */}
            <div className="shrink-0 flex flex-wrap gap-3 items-center pb-2">
                {['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'].map(key => {
                    const cfg = getStatusCfg(t)[key];
                    if (!cfg) return null;
                    return (
                        <span key={key} className="flex items-center gap-1.5 text-xs" style={{ color: 'hsl(220 15% 48%)' }}>
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                            {cfg.label}
                        </span>
                    );
                })}
            </div>

            {/* ── Booking slide-over ── */}
            {selectedBooking && (
                <BookingSlideOver
                    booking={selectedBooking}
                    tables={tables}
                    onClose={() => setSelectedBooking(null)}
                    onStatusChange={handleStatusChange}
                    onRefresh={() => loadData(true)}
                />
            )}

            {/* ── Walk-in modal ── */}
            {showWalkIn && (
                <WalkInModal
                    tables={tables}
                    selectedDate={selectedDate}
                    defaultTime={nowTime.split(' ')[0]}
                    onClose={() => setShowWalkIn(false)}
                    onSave={() => loadData(true)}
                />
            )}

            {/* ── Waitlist Slide-over ── */}
            {showWaitlist && (
                <div className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-white border-l shadow-2xl flex flex-col" style={{ borderColor: 'hsl(231 24% 14%)' }}>
                    <div className="p-5 border-b flex items-start justify-between bg-zinc-50">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Waitlist</h2>
                            <p className="text-xs text-muted-foreground mt-1">
                                {format(selectedDate, 'MMM d, yyyy')} • {waitlist.length} waiting
                            </p>
                        </div>
                        <button onClick={() => setShowWaitlist(false)} className="p-2 -mr-2 text-muted-foreground hover:bg-black/5 rounded-full smooth-transition">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-5 space-y-4">
                        {waitlist.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground text-sm">
                                <Clock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                No entries on the waitlist.
                            </div>
                        ) : (
                            waitlist.map((entry) => (
                                <div key={entry.id} className="dash-card p-4 text-sm relative group overflow-hidden">
                                    {entry.status === 'offered' && (
                                        <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500" />
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-base">{entry.guest_name || 'Guest'}</div>
                                            <div className="text-muted-foreground flex gap-3 text-xs">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {entry.party_size}</span>
                                                <span className="flex items-center gap-1">⏱️ {format(new Date(entry.requested_time), 'h:mm a')}</span>
                                            </div>
                                            {entry.guest_phone && (
                                                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3" /> {entry.guest_phone}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${entry.status === 'offered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                                {entry.status}
                                            </span>
                                            {entry.status === 'waiting' && entry.quoted_wait_time != null && (
                                                <div className="mt-2 text-[11px] font-medium text-amber-700/80">
                                                    ~{entry.quoted_wait_time}m wait
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex gap-2">
                                        {entry.status === 'waiting' && (
                                            <button
                                                onClick={async () => {
                                                    const res = await promoteFromWaitlist(restaurant.id, entry.requested_time);
                                                    if (res.error) toast.error(res.error);
                                                    else { toast.success('Guest promoted via SMS!'); loadData(true); }
                                                }}
                                                className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold smooth-transition"
                                            >
                                                Promote
                                            </button>
                                        )}
                                        <button
                                            onClick={async () => {
                                                const res = await leaveWaitlist(entry.id);
                                                if (res.error) toast.error(res.error);
                                                else { toast.success('Removed from waitlist'); loadData(true); }
                                            }}
                                            className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold smooth-transition"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
