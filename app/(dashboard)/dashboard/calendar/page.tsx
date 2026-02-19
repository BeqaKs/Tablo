'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getOwnerBookings, updateOwnerBookingStatus, getOwnerRestaurant, getOwnerTables } from '@/app/actions/owner';
import { toast } from 'sonner';
import { CalendarDays, Check, X, Clock, Loader2, Filter, ChevronLeft, ChevronRight, User, LayoutGrid } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, isToday } from 'date-fns';
import { FloorPlanViewer } from '@/components/floor-plan/floor-plan-viewer';
import { TablePosition } from '@/lib/stores/floor-plan-store';

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
    seated: { bg: 'bg-green-100', text: 'text-green-700' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-700' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
    no_show: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

export default function OwnerCalendarPage() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Live Floor Plan State
    const [restaurantTables, setRestaurantTables] = useState<TablePosition[]>([]);
    const [floorPlanBg, setFloorPlanBg] = useState<string | null>(null);
    const [viewTime, setViewTime] = useState<string>("19:00");

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [bookingsRes, restaurantRes, tablesRes] = await Promise.all([
            getOwnerBookings(),
            getOwnerRestaurant(),
            getOwnerTables()
        ]);

        if (bookingsRes.error) toast.error(bookingsRes.error);
        if (bookingsRes.data) setBookings(bookingsRes.data);

        if (restaurantRes.error) toast.error(restaurantRes.error);
        if (restaurantRes.data) {
            setRestaurant(restaurantRes.data);
            if (restaurantRes.data.floor_plan_json?.backgroundImage) {
                setFloorPlanBg(restaurantRes.data.floor_plan_json.backgroundImage);
            }
        }

        if (tablesRes.error) toast.error(tablesRes.error);
        if (tablesRes.data) setRestaurantTables(tablesRes.data);

        setLoading(false);
    }

    async function handleStatusChange(bookingId: string, status: string) {
        const { error } = await updateOwnerBookingStatus(bookingId, status);
        if (error) toast.error(error);
        else { toast.success(`Status updated to ${status}`); loadData(); }
    }

    // Filter Logic
    const filteredByStatus = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

    // Calendar Helper Functions
    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    // Live Floor Plan Logic
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

    // Booking Card Component (Reusable)
    const BookingCard = ({ booking }: { booking: any }) => {
        const colors = statusColors[booking.status] || statusColors.pending;
        const date = new Date(booking.reservation_time);
        return (
            <Card className="p-5 hover:shadow-md transition-all duration-200 border-l-4" style={{ borderLeftColor: booking.status === 'confirmed' ? '#3b82f6' : 'transparent' }}>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg">
                                {booking.guest_name}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                                {booking.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground text-xs">Time</p>
                                    <p className="font-medium">{format(date, 'MMM d, h:mm a')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground text-xs">Guests</p>
                                    <p className="font-medium">{booking.guest_count} people</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Table</p>
                                <p className="font-medium">{booking.tables?.table_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs">Phone</p>
                                <p className="font-medium">{booking.guest_phone || 'N/A'}</p>
                            </div>
                        </div>
                        {booking.guest_notes && (
                            <div className="mt-3 bg-gray-50 p-2 rounded text-sm italic text-gray-600 border-l-2 border-gray-300">
                                "{booking.guest_notes}"
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                        {booking.status === 'pending' && (
                            <>
                                <Button size="sm" className="w-full gap-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(booking.id, 'confirmed')}>
                                    <Check className="h-3 w-3" /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" className="w-full gap-1 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleStatusChange(booking.id, 'cancelled')}>
                                    <X className="h-3 w-3" /> Cancel
                                </Button>
                            </>
                        )}
                        {booking.status === 'confirmed' && (
                            <Button size="sm" className="w-full gap-1" onClick={() => handleStatusChange(booking.id, 'seated')}>
                                <Check className="h-3 w-3" /> Seat
                            </Button>
                        )}
                        {booking.status === 'seated' && (
                            <Button size="sm" className="w-full gap-1" onClick={() => handleStatusChange(booking.id, 'completed')}>
                                <Check className="h-3 w-3" /> Complete
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center p-8 text-muted-foreground mt-20">You need to be assigned to a restaurant to manage bookings.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calendar & Bookings</h1>
                    <p className="text-muted-foreground">{bookings.length} total bookings for {restaurant.name}</p>
                </div>
            </div>

            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="mb-8 w-full md:w-auto grid grid-cols-3">
                    <TabsTrigger value="calendar" className="flex items-center gap-2"><CalendarDays className="w-4 h-4" />Calendar</TabsTrigger>
                    <TabsTrigger value="live" className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" />Live Floor Plan</TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2"><Filter className="w-4 h-4" />List</TabsTrigger>
                </TabsList>

                {/* CALENDAR VIEW */}
                <TabsContent value="calendar" className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Calendar Grid */}
                        <div className="lg:w-2/3 bg-white p-6 rounded-xl border shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date())}>
                                        Today
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-medium text-muted-foreground">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                    <div key={day} className="py-2">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: getDay(startOfMonth(currentMonth)) }).map((_, i) => (
                                    <div key={`prefix-${i}`} className="h-24 bg-gray-50/50" />
                                ))}

                                {daysInMonth.map(day => {
                                    const dayBookings = bookings.filter(b => isSameDay(new Date(b.reservation_time), day));
                                    const isSelected = isSameDay(day, selectedDate);
                                    const isTodayDate = isToday(day);

                                    return (
                                        <button
                                            key={day.toISOString()}
                                            onClick={() => setSelectedDate(day)}
                                            className={`h-24 border rounded-lg p-2 flex flex-col items-start justify-between smooth-transition hover:border-primary/50 relative ${isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-100 bg-white'
                                                } ${isTodayDate ? 'bg-blue-50/50' : ''}`}
                                        >
                                            <span className={`text-sm font-medium ${isTodayDate ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                                                {format(day, 'd')}
                                            </span>

                                            {dayBookings.length > 0 && (
                                                <div className="w-full flex flex-col gap-1">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {dayBookings.slice(0, 3).map((b, i) => (
                                                            <div key={i} className={`w-2 h-2 rounded-full ${statusColors[b.status]?.bg.replace('bg-', 'bg-').replace('100', '500') || 'bg-gray-400'}`} />
                                                        ))}
                                                        {dayBookings.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayBookings.length - 3}</span>}
                                                    </div>
                                                    <p className="text-xs font-medium text-muted-foreground w-full text-left truncate">
                                                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Selected Date Details */}
                        <div className="lg:w-1/3 space-y-4">
                            <Card className="p-4 bg-muted/30">
                                <h3 className="font-semibold text-lg mb-1">{format(selectedDate, 'EEEE, MMMM do')}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {(() => {
                                        const count = bookings.filter(b => isSameDay(new Date(b.reservation_time), selectedDate)).length;
                                        return `${count} bookings scheduled`;
                                    })()}
                                </p>
                            </Card>

                            <div className="space-y-3 max-h-[600px] overflow-auto pr-1">
                                {(() => {
                                    const dateBookings = bookings.filter(b => isSameDay(new Date(b.reservation_time), selectedDate));

                                    if (dateBookings.length === 0) {
                                        return (
                                            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50">
                                                No bookings for this date.
                                            </div>
                                        );
                                    }
                                    return dateBookings.map(booking => <BookingCard key={booking.id} booking={booking} />);
                                })()}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* LIVE FLOOR PLAN VIEW */}
                <TabsContent value="live" className="space-y-6">
                    <div className="bg-white p-4 border rounded-xl flex items-center gap-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <CalendarDays className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground">Date</label>
                                <input
                                    type="date"
                                    className="font-medium bg-transparent border-none p-0 focus:ring-0"
                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="h-10 w-px bg-gray-200" />
                        <div className="flex items-center gap-3 flex-1">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-muted-foreground">Time: {viewTime}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="23.5"
                                    step="0.5"
                                    className="w-full accent-primary"
                                    value={Number(viewTime.split(':')[0]) + (viewTime.endsWith('30') ? 0.5 : 0)}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        const h = Math.floor(val);
                                        const m = (val % 1) === 0.5 ? '30' : '00';
                                        setViewTime(`${h.toString().padStart(2, '0')}:${m}`);
                                    }}
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                    <span>00:00</span>
                                    <span>06:00</span>
                                    <span>12:00</span>
                                    <span>18:00</span>
                                    <span>24:00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white border rounded-xl shadow-sm p-1">
                                <FloorPlanViewer
                                    tables={restaurantTables}
                                    backgroundImage={floorPlanBg}
                                    getTableStatus={(table) => {
                                        const isActive = activeBookings.some(b => b.table_id === table.id);
                                        return isActive ? 'booked' : 'available';
                                    }}
                                    getBookingInfo={(table) => {
                                        const booking = activeBookings.find(b => b.table_id === table.id);
                                        if (!booking) return undefined;
                                        return {
                                            guestName: booking.guest_name || 'Guest',
                                            time: format(new Date(booking.reservation_time), 'HH:mm'),
                                            partySize: booking.guest_count,
                                            notes: booking.guest_notes
                                        };
                                    }}
                                />
                            </div>
                            <div className="flex gap-4 justify-center text-sm">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-600 rounded"></span> Available</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-500 rounded"></span> Booked (at {viewTime})</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg items-center flex gap-2">
                                <User className="w-4 h-4" /> Active Guests ({activeBookings.length})
                            </h3>
                            <div className="space-y-2 max-h-[600px] overflow-auto">
                                {activeBookings.length === 0 ? (
                                    <p className="text-muted-foreground text-sm italic">No active bookings at this time.</p>
                                ) : (
                                    activeBookings.map(booking => (
                                        <Card key={booking.id} className="p-3 text-sm border-l-4 border-l-red-500">
                                            <div className="font-medium">{booking.guest_name}</div>
                                            <div className="text-muted-foreground flex justify-between mt-1">
                                                <span>Table {booking.tables?.table_number}</span>
                                                <span>{booking.guest_count} ppl</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(booking.reservation_time), 'HH:mm')} - {format(new Date(booking.end_time || 0), 'HH:mm')}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* LIST VIEW */}
                <TabsContent value="list" className="space-y-6">
                    {/* Status Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {['all', 'pending', 'confirmed', 'seated', 'completed', 'cancelled'].map(status => {
                            const count = status === 'all' ? bookings.length : bookings.filter(b => b.status === status).length;
                            const colors = statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`p-3 rounded-xl text-center smooth-transition border ${statusFilter === status
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-transparent hover:bg-gray-50'
                                        }`}
                                >
                                    <p className="text-xl font-bold">{count}</p>
                                    <p className="text-xs capitalize text-muted-foreground">{status === 'all' ? 'All' : status.replace('_', ' ')}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Bookings List */}
                    <div className="space-y-4">
                        {(() => {
                            const filtered = statusFilter === 'all' ? bookings : bookings.filter(b => b.status === statusFilter);

                            if (filtered.length === 0) {
                                return (
                                    <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
                                        No bookings found{statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
                                    </div>
                                );
                            }
                            return filtered.map(booking => <BookingCard key={booking.id} booking={booking} />);
                        })()}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
