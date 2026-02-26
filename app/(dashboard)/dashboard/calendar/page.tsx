'use client';

import { useState, useEffect } from 'react';
import { getOwnerBookings, updateOwnerBookingStatus, getOwnerRestaurant, getOwnerTables } from '@/app/actions/owner';
import { toast } from 'sonner';
import { CalendarDays, Check, X, Clock, Loader2, Filter, ChevronLeft, ChevronRight, User, LayoutGrid } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns';
import { FloorPlanViewer } from '@/components/floor-plan/floor-plan-viewer';
import { TablePosition } from '@/lib/stores/floor-plan-store';

type TabType = 'calendar' | 'live' | 'list';

const statusConfig: Record<string, { badgeClass: string; color: string; dot: string; label: string }> = {
    pending: { badgeClass: 'badge-pending', color: 'hsl(38 80% 65%)', dot: 'hsl(38 80% 55%)', label: 'Pending' },
    confirmed: { badgeClass: 'badge-confirmed', color: 'hsl(200 70% 65%)', dot: 'hsl(200 70% 50%)', label: 'Confirmed' },
    seated: { badgeClass: 'badge-seated', color: 'hsl(160 60% 60%)', dot: 'hsl(160 60% 45%)', label: 'Seated' },
    completed: { badgeClass: 'badge-completed', color: 'hsl(220 15% 55%)', dot: 'hsl(220 15% 40%)', label: 'Completed' },
    cancelled: { badgeClass: 'badge-cancelled', color: 'hsl(347 78% 65%)', dot: 'hsl(347 78% 50%)', label: 'Cancelled' },
    no_show: { badgeClass: 'badge-no-show', color: 'hsl(262 60% 70%)', dot: 'hsl(262 60% 50%)', label: 'No Show' },
};

export default function OwnerCalendarPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('calendar');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [restaurantTables, setRestaurantTables] = useState<TablePosition[]>([]);
    const [floorPlanBg, setFloorPlanBg] = useState<string | null>(null);
    const [viewTime, setViewTime] = useState<string>('19:00');

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [bookingsRes, restaurantRes, tablesRes] = await Promise.all([
            getOwnerBookings(), getOwnerRestaurant(), getOwnerTables()
        ]);
        if (bookingsRes.data) setBookings(bookingsRes.data);
        if (restaurantRes.data) {
            setRestaurant(restaurantRes.data);
            if (restaurantRes.data.floor_plan_json?.backgroundImage)
                setFloorPlanBg(restaurantRes.data.floor_plan_json.backgroundImage);
        }
        if (tablesRes.data) setRestaurantTables(tablesRes.data);
        setLoading(false);
    }

    async function handleStatusChange(bookingId: string, status: string) {
        const { error } = await updateOwnerBookingStatus(bookingId, status);
        if (error) toast.error(error);
        else { toast.success(`Status updated to ${status}`); loadData(); }
    }

    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

    const getActiveBookingsForTime = () => {
        const dayBookings = bookings.filter(b =>
            isSameDay(new Date(b.reservation_time), selectedDate) &&
            b.status !== 'cancelled' && b.status !== 'no_show'
        );
        const [hours, minutes] = viewTime.split(':').map(Number);
        const viewDateTime = new Date(selectedDate);
        viewDateTime.setHours(hours, minutes, 0, 0);
        return dayBookings.filter(b => {
            const start = new Date(b.reservation_time);
            const end = new Date(b.end_time || new Date(start.getTime() + 2 * 60 * 60 * 1000));
            return viewDateTime >= start && viewDateTime < end;
        });
    };

    const activeBookings = getActiveBookingsForTime();

    const BookingCard = ({ booking }: { booking: any }) => {
        const sc = statusConfig[booking.status] || statusConfig.pending;
        const date = new Date(booking.reservation_time);
        return (
            <div
                className="rounded-xl p-4 smooth-transition"
                style={{
                    background: 'hsl(231 32% 10%)',
                    border: `1px solid hsl(231 24% 16%)`,
                    borderLeft: `3px solid ${sc.dot}`,
                }}
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-white">{booking.guest_name}</h3>
                            <span className={`${sc.badgeClass} px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                                {sc.label}
                            </span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                                { label: 'Time', value: format(date, 'MMM d, h:mm a') },
                                { label: 'Guests', value: `${booking.guest_count} people` },
                                { label: 'Table', value: booking.tables?.table_number || 'N/A' },
                                { label: 'Phone', value: booking.guest_phone || 'N/A' },
                            ].map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: 'hsl(220 15% 38%)' }}>{label}</p>
                                    <p className="text-sm font-medium text-white">{value}</p>
                                </div>
                            ))}
                        </div>
                        {booking.guest_notes && (
                            <div
                                className="mt-3 rounded-lg px-3 py-2 text-sm italic"
                                style={{ background: 'hsl(231 24% 14%)', color: 'hsl(220 15% 55%)', borderLeft: '2px solid hsl(231 24% 22%)' }}
                            >
                                "{booking.guest_notes}"
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        {booking.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => handleStatusChange(booking.id, 'confirmed')}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold smooth-transition"
                                    style={{ background: 'hsl(160 60% 45% / 0.15)', color: 'hsl(160 60% 60%)', border: '1px solid hsl(160 60% 45% / 0.25)' }}
                                >
                                    <Check className="h-3 w-3" /> Confirm
                                </button>
                                <button
                                    onClick={() => handleStatusChange(booking.id, 'cancelled')}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold smooth-transition"
                                    style={{ background: 'hsl(347 78% 58% / 0.10)', color: 'hsl(347 78% 65%)', border: '1px solid hsl(347 78% 58% / 0.20)' }}
                                >
                                    <X className="h-3 w-3" /> Cancel
                                </button>
                            </>
                        )}
                        {booking.status === 'confirmed' && (
                            <button
                                onClick={() => handleStatusChange(booking.id, 'seated')}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold smooth-transition btn-dash-primary"
                            >
                                <Check className="h-3 w-3" /> Seat
                            </button>
                        )}
                        {booking.status === 'seated' && (
                            <button
                                onClick={() => handleStatusChange(booking.id, 'completed')}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold smooth-transition"
                                style={{ background: 'hsl(262 60% 56% / 0.14)', color: 'hsl(262 60% 70%)', border: '1px solid hsl(262 60% 56% / 0.25)' }}
                            >
                                <Check className="h-3 w-3" /> Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 58%)' }} />
                    <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>Loading bookings...</p>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center p-8 mt-20" style={{ color: 'hsl(220 15% 45%)' }}>No restaurant assigned.</div>;
    }

    const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        { id: 'live', label: 'Live Floor', icon: LayoutGrid },
        { id: 'list', label: 'List', icon: Filter },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Calendar & Bookings</h1>
                <p className="text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>
                    {bookings.length} total bookings for {restaurant.name}
                </p>
            </div>

            {/* Tab Bar */}
            <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: 'hsl(231 32% 10%)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium smooth-transition"
                        style={activeTab === tab.id
                            ? { background: 'hsl(347 78% 58% / 0.15)', color: 'hsl(347 78% 70%)' }
                            : { color: 'hsl(220 15% 45%)' }
                        }
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CALENDAR TAB */}
            {activeTab === 'calendar' && (
                <div className="flex flex-col lg:flex-row gap-5">
                    {/* Calendar Grid */}
                    <div className="dash-card lg:w-2/3 p-5">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
                            <div className="flex items-center gap-2">
                                {[
                                    { action: () => setCurrentMonth(subMonths(currentMonth, 1)), icon: ChevronLeft },
                                    { action: () => setCurrentMonth(new Date()), label: 'Today' },
                                    { action: () => setCurrentMonth(addMonths(currentMonth, 1)), icon: ChevronRight },
                                ].map((btn, i) => (
                                    <button
                                        key={i}
                                        onClick={btn.action}
                                        className="flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium smooth-transition btn-dash-ghost"
                                    >
                                        {(btn as any).icon ? < (btn as any).icon className="h-3.5 w-3.5" /> : (btn as any).label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide"
                                    style={{ color: 'hsl(220 15% 40%)' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                                <div key={`prefix-${i}`} className="h-20 rounded-lg" style={{ background: 'hsl(231 32% 8%)' }} />
                            ))}
                            {daysInMonth.map(day => {
                                const dayBookings = bookings.filter(b => isSameDay(new Date(b.reservation_time), day));
                                const isSelected = isSameDay(day, selectedDate);
                                const isTodayDate = isToday(day);
                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className="h-20 rounded-lg p-2 flex flex-col items-start smooth-transition text-left"
                                        style={{
                                            background: isSelected ? 'hsl(347 78% 58% / 0.12)' : 'hsl(231 32% 8%)',
                                            border: isSelected
                                                ? '1px solid hsl(347 78% 58% / 0.4)'
                                                : isTodayDate
                                                    ? '1px solid hsl(262 60% 56% / 0.4)'
                                                    : '1px solid hsl(231 24% 14%)',
                                        }}
                                    >
                                        <span
                                            className="text-xs font-semibold h-5 w-5 flex items-center justify-center rounded-full"
                                            style={{
                                                background: isTodayDate ? 'hsl(347 78% 52%)' : 'transparent',
                                                color: isTodayDate ? 'white' : isSelected ? 'hsl(347 78% 70%)' : 'hsl(220 20% 75%)',
                                            }}
                                        >
                                            {format(day, 'd')}
                                        </span>
                                        {dayBookings.length > 0 && (
                                            <div className="mt-auto w-full">
                                                <div className="flex gap-0.5 flex-wrap mb-1">
                                                    {dayBookings.slice(0, 3).map((b, i) => (
                                                        <span
                                                            key={i}
                                                            className="h-1.5 w-1.5 rounded-full"
                                                            style={{ background: statusConfig[b.status]?.dot || 'hsl(220 15% 40%)' }}
                                                        />
                                                    ))}
                                                </div>
                                                <p className="text-[10px]" style={{ color: 'hsl(220 15% 45%)' }}>
                                                    {dayBookings.length} bk{dayBookings.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Day Detail Panel */}
                    <div className="lg:w-1/3 space-y-3">
                        <div className="dash-card p-4">
                            <h3 className="font-semibold text-white">{format(selectedDate, 'EEEE, MMMM do')}</h3>
                            <p className="text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>
                                {bookings.filter(b => isSameDay(new Date(b.reservation_time), selectedDate)).length} bookings
                            </p>
                        </div>
                        <div className="space-y-2 max-h-[500px] overflow-auto pr-1 scrollbar-hide">
                            {(() => {
                                const dateBookings = bookings.filter(b => isSameDay(new Date(b.reservation_time), selectedDate));
                                return dateBookings.length === 0
                                    ? (
                                        <div className="text-center py-10 text-sm rounded-xl"
                                            style={{ background: 'hsl(231 32% 10%)', color: 'hsl(220 15% 40%)', border: '1px dashed hsl(231 24% 20%)' }}>
                                            No bookings for this date.
                                        </div>
                                    )
                                    : dateBookings.map(b => <BookingCard key={b.id} booking={b} />);
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE FLOOR PLAN TAB */}
            {activeTab === 'live' && (
                <div className="space-y-5">
                    <div className="dash-card p-4 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg" style={{ background: 'hsl(347 78% 58% / 0.12)' }}>
                                <CalendarDays className="h-4 w-4" style={{ color: 'hsl(347 78% 65%)' }} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'hsl(220 15% 40%)' }}>Date</label>
                                <input
                                    type="date"
                                    className="text-sm font-medium bg-transparent border-none p-0 text-white focus:ring-0"
                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                    onChange={e => setSelectedDate(new Date(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="h-8 w-px" style={{ background: 'hsl(231 24% 18%)' }} />
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 rounded-lg" style={{ background: 'hsl(262 60% 56% / 0.12)' }}>
                                <Clock className="h-4 w-4" style={{ color: 'hsl(262 60% 65%)' }} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: 'hsl(220 15% 40%)' }}>
                                    Time: <span className="text-white font-semibold">{viewTime}</span>
                                </label>
                                <input
                                    type="range" min="0" max="23.5" step="0.5"
                                    className="w-full accent-[hsl(347,78%,58%)]"
                                    value={Number(viewTime.split(':')[0]) + (viewTime.endsWith('30') ? 0.5 : 0)}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        const h = Math.floor(val);
                                        const m = (val % 1) === 0.5 ? '30' : '00';
                                        setViewTime(`${h.toString().padStart(2, '0')}:${m}`);
                                    }}
                                />
                                <div className="flex justify-between text-[10px] mt-1" style={{ color: 'hsl(220 15% 38%)' }}>
                                    {['00:00', '06:00', '12:00', '18:00', '24:00'].map(t => <span key={t}>{t}</span>)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2">
                            <div className="dash-card p-1">
                                <FloorPlanViewer
                                    tables={restaurantTables}
                                    backgroundImage={floorPlanBg}
                                    getTableStatus={table => activeBookings.some(b => b.table_id === table.id) ? 'booked' : 'available'}
                                    getBookingInfo={table => {
                                        const booking = activeBookings.find(b => b.table_id === table.id);
                                        if (!booking) return undefined;
                                        return { guestName: booking.guest_name || 'Guest', time: format(new Date(booking.reservation_time), 'HH:mm'), partySize: booking.guest_count, notes: booking.guest_notes };
                                    }}
                                />
                            </div>
                            <div className="flex gap-4 justify-center mt-3 text-xs" style={{ color: 'hsl(220 15% 50%)' }}>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded" style={{ background: 'hsl(160 60% 45% / 0.3)', border: '1px solid hsl(160 60% 45%)' }} />
                                    Available
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="h-2.5 w-2.5 rounded" style={{ background: 'hsl(347 78% 50% / 0.3)', border: '1px solid hsl(347 78% 50%)' }} />
                                    Booked at {viewTime}
                                </span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                                <User className="h-4 w-4" style={{ color: 'hsl(347 78% 60%)' }} />
                                Active Guests ({activeBookings.length})
                            </h3>
                            <div className="space-y-2 max-h-[450px] overflow-auto scrollbar-hide">
                                {activeBookings.length === 0
                                    ? <p className="text-sm italic" style={{ color: 'hsl(220 15% 40%)' }}>No active bookings at this time.</p>
                                    : activeBookings.map(b => (
                                        <div key={b.id} className="rounded-lg p-3 text-sm" style={{ background: 'hsl(231 32% 10%)', borderLeft: '3px solid hsl(160 60% 45%)' }}>
                                            <div className="font-medium text-white">{b.guest_name}</div>
                                            <div className="flex justify-between mt-1" style={{ color: 'hsl(220 15% 48%)' }}>
                                                <span>Table {b.tables?.table_number}</span>
                                                <span>{b.guest_count} ppl</span>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIST TAB */}
            {activeTab === 'list' && (
                <div className="space-y-5">
                    {/* Status filter chips */}
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'].map(status => {
                            const count = status === 'all' ? bookings.length : bookings.filter(b => b.status === status).length;
                            const sc = statusConfig[status];
                            const isActive = statusFilter === status;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium smooth-transition"
                                    style={isActive
                                        ? { background: sc ? `${sc.dot}22` : 'hsl(347 78% 58% / 0.14)', color: sc?.color || 'hsl(347 78% 65%)', border: `1px solid ${sc?.dot || 'hsl(347 78% 40%)'}44` }
                                        : { background: 'hsl(231 32% 10%)', color: 'hsl(220 15% 50%)', border: '1px solid hsl(231 24% 16%)' }
                                    }
                                >
                                    {sc && <span className="h-1.5 w-1.5 rounded-full" style={{ background: sc.dot }} />}
                                    <span className="capitalize">{status === 'all' ? 'All' : status.replace('_', ' ')}</span>
                                    <span
                                        className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                        style={{ background: 'hsl(231 24% 16%)', color: 'hsl(220 20% 65%)' }}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="space-y-3">
                        {(() => {
                            const filtered = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);
                            return filtered.length === 0
                                ? <div className="text-center py-16 text-sm rounded-xl"
                                    style={{ background: 'hsl(231 32% 10%)', color: 'hsl(220 15% 40%)', border: '1px dashed hsl(231 24% 20%)' }}>
                                    No bookings found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
                                </div>
                                : filtered.map(b => <BookingCard key={b.id} booking={b} />);
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
