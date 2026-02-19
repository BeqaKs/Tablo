'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    MapPin, Star, Clock, Users, Phone, Mail, Globe,
    ChevronLeft, Calendar, Check, X
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { getRestaurantBySlug, createBooking } from '@/app/actions/bookings';
import { Restaurant, Table } from '@/types/database';
import { toast } from 'sonner';
import { FloorPlanViewer } from '@/components/floor-plan/floor-plan-viewer';
import { TablePosition } from '@/lib/stores/floor-plan-store';

export default function RestaurantProfilePage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const { t } = useLocale();
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [partySize, setPartySize] = useState<number>(2);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [step, setStep] = useState<'datetime' | 'table' | 'confirm'>('datetime');
    const [bookingLoading, setBookingLoading] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [guestNotes, setGuestNotes] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'floor-plan'>('list');

    const resT = (key: string) => t(`restaurant.${key}`);

    const availableTimes = [
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
    ];

    useEffect(() => {
        async function loadData() {
            const { data } = await getRestaurantBySlug(resolvedParams.slug);
            if (data) setRestaurant(data);
            setLoading(false);
        }
        loadData();
    }, [resolvedParams.slug]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!restaurant) return <div className="min-h-screen flex items-center justify-center">Restaurant not found.</div>;

    const filteredTables = (restaurant.tables || []).filter((t: any) => t.capacity >= partySize);

    const handleBooking = async () => {
        if (!selectedTable || !selectedDate || !selectedTime) return;

        setBookingLoading(true);
        const reservationTime = new Date(`${selectedDate}T${selectedTime}`).toISOString();

        const { success, error } = await createBooking({
            restaurant_id: restaurant.id,
            table_id: selectedTable,
            guest_count: partySize,
            reservation_time: reservationTime,
            guest_name: guestName,
            guest_phone: guestPhone,
            guest_notes: guestNotes,
        });

        setBookingLoading(false);
        if (success) {
            toast.success(t('bookings.success') || 'Reservation created successfully!');
            setStep('datetime');
        } else {
            toast.error(error || 'Failed to create reservation');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Back Button */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-8 py-4">
                    <Link href="/restaurants" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary smooth-transition">
                        <ChevronLeft className="h-4 w-4" />
                        {resT('back')}
                    </Link>
                </div>
            </div>

            {/* Restaurant Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <div className="grid md:grid-cols-[1fr_400px] gap-8">
                        {/* Restaurant Info */}
                        <div>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
                                    <p className="text-lg text-muted-foreground">{restaurant.cuisine}</p>
                                </div>
                                <Badge variant="outline" className="text-lg px-4 py-2">
                                    {restaurant.priceRange}
                                </Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex items-center gap-1">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{restaurant.rating}</span>
                                    <span className="text-muted-foreground">({restaurant.reviewCount} {resT('reviews')})</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {restaurant.location}
                                </div>
                            </div>

                            <p className="text-foreground mb-6">{restaurant.description}</p>

                            {/* Features */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {(restaurant.features || []).map((feature: string) => (
                                    <Badge key={feature} variant="secondary">
                                        {feature}
                                    </Badge>
                                ))}
                            </div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{restaurant.address}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{restaurant.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{restaurant.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                    <span>{restaurant.website}</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Widget */}
                        <Card className="premium-card p-6 h-fit sticky top-24">
                            <h2 className="text-2xl font-bold mb-6">{resT('makeReservation')}</h2>

                            {/* Step 1: Date, Time, Party Size */}
                            {step === 'datetime' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('date')}</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('partySize')}</label>
                                        <select
                                            value={partySize}
                                            onChange={(e) => setPartySize(parseInt(e.target.value))}
                                            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(size => (
                                                <option key={size} value={size}>{size} {size === 1 ? resT('guest') : resT('guests')}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">{resT('time')}</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableTimes.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`px-3 py-2 border rounded-lg text-sm font-medium smooth-transition ${selectedTime === time
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'hover:border-primary hover:bg-primary/5'
                                                        }`}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => setStep('table')}
                                        disabled={!selectedDate || !selectedTime}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {resT('chooseTable')}
                                    </Button>
                                </div>
                            )}

                            {/* Step 2: Table Selection */}
                            {step === 'table' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedDate} {t('common.at')} {selectedTime}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {partySize} {partySize === 1 ? resT('guest') : resT('guests')}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setStep('datetime')}>
                                            {resT('change')}
                                        </Button>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium">
                                                {resT('availableTables')} ({filteredTables.length})
                                            </label>
                                            {restaurant.floor_plan_json?.backgroundImage && (
                                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setViewMode('list')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        List
                                                    </button>
                                                    <button
                                                        onClick={() => setViewMode('floor-plan')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md smooth-transition ${viewMode === 'floor-plan' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                                    >
                                                        Floor Plan
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {viewMode === 'floor-plan' && restaurant.floor_plan_json ? (
                                            <div className="mb-4">
                                                <FloorPlanViewer
                                                    tables={restaurant.tables} // Show all tables contextually
                                                    backgroundImage={restaurant.floor_plan_json.backgroundImage}
                                                    selectedTableId={selectedTable}
                                                    onTableSelect={(id) => setSelectedTable(id)}
                                                    getTableStatus={(table) => {
                                                        // 1. Capacity check
                                                        if (table.capacity < partySize) return 'disabled';
                                                        // 2. Availability check (future: check against bookings)
                                                        // For now, assume all tables matching capacity are available
                                                        return 'available';
                                                    }}
                                                />
                                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                                    Click on a green table to select it. Gray tables are too small/unavailable.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-[400px] overflow-auto">
                                                {(filteredTables || []).map((table: any) => (
                                                    <button
                                                        key={table.id}
                                                        onClick={() => setSelectedTable(table.id)}
                                                        className={`w-full p-4 border-2 rounded-lg text-left smooth-transition ${selectedTable === table.id
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-gray-200 hover:border-primary/50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-semibold">{t('bookings.table')} {table.table_number}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {table.zone_name} • {t('common.upTo')} {table.capacity} {resT('guests')}
                                                                </p>
                                                            </div>
                                                            {selectedTable === table.id && (
                                                                <Check className="h-5 w-5 text-primary" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => setStep('confirm')}
                                        disabled={!selectedTable}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {resT('confirmContinue')}
                                    </Button>
                                </div>
                            )}

                            {/* Step 3: Confirmation */}
                            {step === 'confirm' && (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                        <h3 className="font-semibold">{resT('summary')}</h3>
                                        <div className="text-sm space-y-1">
                                            <p><span className="text-muted-foreground">{t('common.restaurant')}:</span> {restaurant.name}</p>
                                            <p><span className="text-muted-foreground">{resT('date')}:</span> {selectedDate}</p>
                                            <p><span className="text-muted-foreground">{resT('time')}:</span> {selectedTime}</p>
                                            <p><span className="text-muted-foreground">{resT('partySize')}:</span> {partySize} {partySize === 1 ? resT('guest') : resT('guests')}</p>
                                            <p><span className="text-muted-foreground">{t('bookings.table')}:</span> {selectedTable}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{resT('name')}</label>
                                            <input
                                                type="text"
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                placeholder={t('auth.fullName')}
                                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{resT('phone')}</label>
                                            <input
                                                type="tel"
                                                value={guestPhone}
                                                onChange={(e) => setGuestPhone(e.target.value)}
                                                placeholder="+995 555 123 456"
                                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{resT('specialRequests')} ({t('common.optional')})</label>
                                            <textarea
                                                value={guestNotes}
                                                onChange={(e) => setGuestNotes(e.target.value)}
                                                placeholder={t('bookings.specialRequests')}
                                                rows={3}
                                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" onClick={() => setStep('table')} className="flex-1">
                                            {t('common.back')}
                                        </Button>
                                        <Button
                                            onClick={handleBooking}
                                            className="flex-1"
                                            size="lg"
                                            disabled={bookingLoading || !guestName || !guestPhone}
                                        >
                                            {bookingLoading ? t('common.loading') : resT('confirmBooking')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>

            {/* Opening Hours */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <Clock className="h-6 w-6 text-primary" />
                        {resT('openingHours')}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-3">
                        {restaurant.opening_hours && Object.entries(restaurant.opening_hours).map(([day, hours]: [string, any]) => (
                            <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                                <span className="font-medium capitalize">{t(`restaurant.days.${day}`)}</span>
                                <span className={hours === 'Closed' ? 'text-red-600' : 'text-muted-foreground'}>
                                    {hours === 'Closed' ? t('common.closed') : hours}
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
