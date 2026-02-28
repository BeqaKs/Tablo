'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Restaurant } from '@/types/database';
import { ChevronRight, Clock, Star, MapPin } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

interface TonightsHitlistProps {
    restaurants: Restaurant[];
}

export function TonightsHitlist({ restaurants }: TonightsHitlistProps) {
    const { t } = useLocale();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Only show up to 3 for urgency
    const hitlist = restaurants.slice(0, 3);

    if (hitlist.length === 0) return null;

    // Generate a pseudo-random available time for tonight for FOMO effect.
    // In a real app, this would query actual availability.
    const getUrgentTime = (id: string) => {
        const hash = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
        const hours = [19, 19, 20, 20, 21][hash % 5];
        const mins = [0, 15, 30, 45][hash % 4];
        return `${hours}:${mins === 0 ? '00' : mins}`;
    };

    return (
        <section className="py-12 bg-[#0A0C10] overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2 justify-center sm:justify-start">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        {t('hitlist.title')}
                    </h2>
                    <p className="text-gray-400 mt-1 text-sm sm:text-base text-center sm:text-left">{t('hitlist.subtitle')}</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto gap-4 sm:gap-6 px-6 pb-8 pt-2 hide-scrollbar snap-x snap-mandatory sm:justify-center"
                    style={{ scrollPaddingLeft: '1.5rem' }}
                >
                    {hitlist.map((restaurant) => {
                        const time = getUrgentTime(restaurant.id);
                        return (
                            <Link
                                href={`/restaurants/${restaurant.slug}?date=${new Date().toISOString().split('T')[0]}&time=${time}`}
                                key={restaurant.id}
                                className="snap-start flex-none w-[280px] sm:w-[320px] lg:w-[380px] group relative rounded-2xl overflow-hidden bg-[#1A1C23] border border-white/5 transition-transform hover:-translate-y-1 hover:shadow-2xl"
                            >
                                {/* Image Container */}
                                <div className="relative h-48 w-full overflow-hidden">
                                    <img
                                        src={restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop'}
                                        alt={restaurant.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1C23] via-transparent to-black/30" />

                                    {/* Urgent Badge */}
                                    <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                                        <Clock className="w-3.5 h-3.5 text-red-400" />
                                        {t('hitlist.tablesLeft', { count: 1, time })}
                                    </div>

                                    {/* Rating */}
                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                        {restaurant.rating?.toFixed(1) || '4.9'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                                        {restaurant.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-400 mb-4">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {restaurant.city}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        <span>{restaurant.cuisine_type}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        <span className="text-white font-medium">{restaurant.price_range}</span>
                                    </div>

                                    <button className="w-full bg-white/5 hover:bg-white/10 text-white font-medium text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors border border-white/5">
                                        {t('hitlist.bookNow')} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
