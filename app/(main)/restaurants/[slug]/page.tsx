'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    MapPin, Star, Clock, Users, Phone, Mail, Globe,
    ChevronLeft, Calendar, Check, X
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

export default function RestaurantProfilePage({ params }: { params: { slug: string } }) {
    const { t } = useLocale();
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [partySize, setPartySize] = useState<number>(2);
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [step, setStep] = useState<'datetime' | 'table' | 'confirm'>('datetime');

    const resT = (key: string) => t(`restaurant.${key}`);

    // Mock data - will be replaced with Supabase data
    const restaurant = {
        name: 'Shavi Lomi',
        slug: 'shavi-lomi',
        cuisine: 'Georgian Fine Dining',
        description: 'Modern Georgian cuisine in an intimate setting with carefully curated wine selection. Our chef combines traditional recipes with contemporary techniques.',
        priceRange: '$$$',
        rating: 4.8,
        reviewCount: 324,
        location: 'Vera, Tbilisi',
        address: '123 Rustaveli Avenue, Tbilisi 0108',
        phone: '+995 555 123 456',
        email: 'reservations@shavilomi.ge',
        website: 'www.shavilomi.ge',
        openingHours: {
            monday: '12:00 - 23:00',
            tuesday: '12:00 - 23:00',
            wednesday: '12:00 - 23:00',
            thursday: '12:00 - 23:00',
            friday: '12:00 - 00:00',
            saturday: '12:00 - 00:00',
            sunday: 'Closed',
        },
        images: ['/placeholder-restaurant.jpg'],
        features: ['Wine Pairing', 'Private Dining', 'Outdoor Seating', 'Vegetarian Options'],
    };

    const availableTimes = [
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
    ];

    const mockTables = [
        { id: 'T1', number: 'T1', capacity: 2, zone: 'Window', available: true },
        { id: 'T2', number: 'T2', capacity: 2, zone: 'Window', available: true },
        { id: 'T3', number: 'T3', capacity: 4, zone: 'Main Hall', available: true },
        { id: 'T4', number: 'T4', capacity: 4, zone: 'Main Hall', available: false },
        { id: 'T5', number: 'T5', capacity: 6, zone: 'Private', available: true },
        { id: 'T6', number: 'T6', capacity: 8, zone: 'Private', available: true },
    ];

    const filteredTables = mockTables.filter(t => t.capacity >= partySize && t.available);

    const handleBooking = () => {
        // TODO: Create reservation in Supabase
        alert(`Booking confirmed!\nRestaurant: ${restaurant.name}\nDate: ${selectedDate}\nTime: ${selectedTime}\nParty: ${partySize}\nTable: ${selectedTable}`);
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
                                {restaurant.features.map((feature) => (
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
                        <Card className="premium-card p-6 h-fit sticky top-4">
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
                                        <label className="block text-sm font-medium mb-2">
                                            {resT('availableTables')} ({filteredTables.length})
                                        </label>
                                        <div className="space-y-2 max-h-[400px] overflow-auto">
                                            {filteredTables.map((table) => (
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
                                                            <p className="font-semibold">{t('bookings.table')} {table.number}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {table.zone} • {t('common.upTo')} {table.capacity} {resT('guests')}
                                                            </p>
                                                        </div>
                                                        {selectedTable === table.id && (
                                                            <Check className="h-5 w-5 text-primary" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
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
                                                placeholder={t('auth.fullName')}
                                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{resT('phone')}</label>
                                            <input
                                                type="tel"
                                                placeholder="+995 555 123 456"
                                                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">{resT('specialRequests')} ({t('common.optional')})</label>
                                            <textarea
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
                                        <Button onClick={handleBooking} className="flex-1" size="lg">
                                            {resT('confirmBooking')}
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
                        {Object.entries(restaurant.openingHours).map(([day, hours]) => (
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
