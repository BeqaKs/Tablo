'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { RestaurantMap } from '@/components/restaurants/restaurant-map';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Search, MapPin, Star, Filter, Map, List, Loader2,
    Navigation, X, ChevronRight, Clock, UtensilsCrossed
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { getRestaurants } from '@/app/actions/bookings';
import { getRestaurantsNearby } from '@/app/actions/geo';
import { Restaurant } from '@/types/database';

const defaultImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
];

const CUISINE_CHIPS = (t: (k: string) => string) => [
    { label: t('home.cuisineFilters.italian'), q: 'italian', emoji: '🍝' },
    { label: t('home.cuisineFilters.georgian'), q: 'georgian', emoji: '🍷' },
    { label: t('home.cuisineFilters.steakhouse'), q: 'steak', emoji: '🥩' },
    { label: t('home.cuisineFilters.japanese'), q: 'japanese', emoji: '🍱' },
    { label: t('home.cuisineFilters.mediterranean'), q: 'mediterranean', emoji: '🫒' },
    { label: t('home.cuisineFilters.fineDining'), q: 'fine dining', emoji: '✨' },
    { label: t('home.cuisineFilters.vegan'), q: 'vegan', emoji: '🌿' },
] as const;

export default function RestaurantsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <RestaurantsContent />
        </Suspense>
    );
}

function RestaurantsContent() {
    const { t } = useLocale();
    const searchParams = useSearchParams();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [activeCuisine, setActiveCuisine] = useState<string | null>(null);

    // Geolocation state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [radiusMiles] = useState<number>(50);

    // Filter restaurants based on search query + cuisine chip
    const filteredRestaurants = useMemo(() => {
        let list = restaurants;
        if (activeCuisine) {
            const q = activeCuisine.toLowerCase();
            list = list.filter(r =>
                (r.cuisine_type && r.cuisine_type.toLowerCase().includes(q)) ||
                (r.description && r.description.toLowerCase().includes(q))
            );
        }
        if (!searchQuery.trim()) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(r =>
            r.name.toLowerCase().includes(q) ||
            (r.cuisine_type && r.cuisine_type.toLowerCase().includes(q)) ||
            (r.city && r.city.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q))
        );
    }, [restaurants, searchQuery, activeCuisine]);

    const loadRestaurants = useCallback(async (coords?: { lat: number; lng: number }) => {
        setLoading(true);
        setError(null);
        try {
            if (coords) {
                const result = await getRestaurantsNearby(coords.lat, coords.lng, radiusMiles);
                if (result.data) setRestaurants(result.data as Restaurant[]);
                if (result.error) setError(result.error);
            } else {
                const result = await getRestaurants();
                if (result.data) setRestaurants(result.data);
                if (result.error) setError(result.error);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [radiusMiles]);

    useEffect(() => {
        loadRestaurants(userLocation || undefined);
    }, [loadRestaurants, userLocation]);

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported');
            return;
        }
        setLocationLoading(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationLoading(false);
            },
            () => {
                setLocationError('Unable to get your location. Please allow location access.');
                setLocationLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const clearLocation = () => {
        setUserLocation(null);
        setLocationError(null);
    };

    const cuisineChips = CUISINE_CHIPS(t);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-background">

            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-card/95 backdrop-blur border-b border-border/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-0">

                    {/* Title row */}
                    <div className="flex items-end justify-between pt-6 pb-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('restaurants.title')}</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                {loading
                                    ? <span className="inline-block w-6 h-3 bg-gray-200 rounded animate-pulse" />
                                    : <>{filteredRestaurants.length} {t('restaurants.description')}</>
                                }
                            </p>
                        </div>

                        {/* View toggle - desktop */}
                        <div className="hidden sm:flex rounded-xl border border-border overflow-hidden shadow-sm">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium smooth-transition ${viewMode === 'list'
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-card hover:bg-gray-50 text-gray-600 dark:text-muted-foreground'
                                    }`}
                            >
                                <List className="h-3.5 w-3.5" />
                                <span>{t('restaurants.viewList')}</span>
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-3 py-2 flex items-center gap-1.5 text-sm font-medium smooth-transition border-l border-border ${viewMode === 'map'
                                    ? 'bg-primary text-white'
                                    : 'bg-white dark:bg-card hover:bg-gray-50 text-gray-600 dark:text-muted-foreground'
                                    }`}
                            >
                                <Map className="h-3.5 w-3.5" />
                                <span>{t('restaurants.viewMap')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Search row */}
                    <div className="flex items-center gap-2 pb-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('restaurants.searchPlaceholder')}
                                className="w-full pl-9 pr-9 py-2.5 bg-gray-100 dark:bg-muted border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground smooth-transition"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-white dark:bg-card hover:bg-gray-50 text-sm font-medium text-gray-700 dark:text-foreground shadow-sm smooth-transition shrink-0">
                            <Filter className="h-3.5 w-3.5 text-gray-400" />
                            <span className="hidden sm:inline">{t('restaurants.filters')}</span>
                        </button>

                        {/* Location badge (when active) */}
                        {userLocation && (
                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-sm font-medium shrink-0">
                                <Navigation className="h-3.5 w-3.5" />
                                <span>{t('restaurants.nearYou')}</span>
                                <button onClick={clearLocation} className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 smooth-transition">
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        )}

                        {/* View toggle – mobile only */}
                        <div className="sm:hidden flex rounded-xl border border-border overflow-hidden shadow-sm shrink-0">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-2.5 py-2.5 flex items-center smooth-transition ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
                            >
                                <List className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-2.5 py-2.5 flex items-center border-l border-border smooth-transition ${viewMode === 'map' ? 'bg-primary text-white' : 'bg-white text-gray-500'}`}
                            >
                                <Map className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cuisine chips */}
                    <div className="flex gap-2 pb-3 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setActiveCuisine(null)}
                            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border smooth-transition ${activeCuisine === null
                                ? 'bg-gray-900 dark:bg-primary text-white border-gray-900 dark:border-primary'
                                : 'bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border-border hover:border-gray-400'
                                }`}
                        >
                            {t('restaurants.all')}
                        </button>
                        {cuisineChips.map((chip) => (
                            <button
                                key={chip.q}
                                onClick={() => setActiveCuisine(chip.q === activeCuisine ? null : chip.q)}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border smooth-transition ${activeCuisine === chip.q
                                    ? 'bg-gray-900 dark:bg-primary text-white border-gray-900 dark:border-primary'
                                    : 'bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border-border hover:border-gray-400 hover:text-gray-900'
                                    }`}
                            >
                                <span>{chip.emoji}</span>
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content area ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Location error */}
                {locationError && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                        <Navigation className="h-4 w-4 shrink-0" />
                        {locationError}
                        <button onClick={() => setLocationError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
                    </div>
                )}

                {/* Location badge – mobile */}
                {userLocation && (
                    <div className="sm:hidden mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium">
                        <Navigation className="h-3 w-3" />
                        <span>{t('restaurants.nearYou')}</span>
                        <button onClick={clearLocation} className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5">
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </div>
                )}

                {error ? (
                    <div className="p-10 text-center bg-white dark:bg-card rounded-3xl border border-border shadow-sm">
                        <p className="text-destructive mb-4">{error}</p>
                        <button
                            onClick={() => loadRestaurants()}
                            className="px-5 py-2 rounded-xl border border-border text-sm font-medium hover:bg-gray-50 smooth-transition"
                        >
                            Try Again
                        </button>
                    </div>

                ) : loading ? (
                    /* Skeleton */
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse flex flex-col gap-2">
                                <div className="aspect-[4/3] w-full rounded-2xl bg-gray-200 dark:bg-muted" />
                                <div className="h-3.5 bg-gray-200 dark:bg-muted rounded w-3/4" />
                                <div className="h-3 bg-gray-200 dark:bg-muted rounded w-1/2" />
                            </div>
                        ))}
                    </div>

                ) : filteredRestaurants.length === 0 ? (
                    /* Empty state */
                    <div className="text-center py-24 bg-white dark:bg-card rounded-3xl border border-border shadow-sm">
                        <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                        <h2 className="text-xl font-bold mb-2">No restaurants found</h2>
                        <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
                            Try a different search, cuisine, or clear your location filter.
                        </p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCuisine(null); if (userLocation) clearLocation(); }}
                            className="px-6 py-2 rounded-full border border-border text-sm font-medium hover:bg-gray-50 smooth-transition"
                        >
                            Clear all filters
                        </button>
                    </div>

                ) : viewMode === 'list' ? (
                    /* ── Restaurant grid ── */
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {filteredRestaurants.map((restaurant) => {
                            const img = restaurant.images?.[0] || restaurant.gallery_images?.[0] || defaultImages[restaurant.name.length % defaultImages.length];
                            return (
                                <Link
                                    href={`/restaurants/${restaurant.slug}`}
                                    key={restaurant.id}
                                    className="group flex flex-col gap-2 focus:outline-none"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-muted">
                                        <img
                                            src={img}
                                            alt={restaurant.name}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                        />
                                        {/* Bottom gradient for readability */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                                        {/* Cuisine chip — top left */}
                                        <div className="absolute top-2.5 left-2.5 z-10">
                                            <span className="bg-white/90 dark:bg-black/70 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide text-gray-800 dark:text-gray-100 shadow-sm">
                                                {restaurant.cuisine_type || 'Restaurant'}
                                            </span>
                                        </div>

                                        {/* Rating — top right */}
                                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            {restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}
                                        </div>

                                        {/* Quick book button — appears on hover */}
                                        <div className="absolute inset-x-3 bottom-3 z-10 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                                            <div className="bg-white dark:bg-card rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-lg">
                                                <div className="flex gap-1.5">
                                                    {['18:00', '19:30', '20:00'].map(t => (
                                                        <span key={t} className="px-2 py-1 text-[10px] font-bold text-primary bg-primary/8 border border-primary/15 rounded-lg">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <div className="flex items-start justify-between gap-1">
                                            <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                                {restaurant.name}
                                            </h3>
                                            <span className="text-xs font-medium text-muted-foreground shrink-0">
                                                {'$'.repeat(Number(restaurant.price_range) || 2)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                                            {restaurant.city}
                                            {restaurant.distance_miles !== undefined && (
                                                <span className="text-primary font-medium shrink-0">
                                                    · {restaurant.distance_miles.toFixed(1)} mi
                                                </span>
                                            )}
                                            {restaurant.vibe_tags?.[0] && (
                                                <span className="truncate text-muted-foreground/70">
                                                    · {restaurant.vibe_tags[0]}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                ) : (
                    /* ── Map view ── */
                    <div className="h-[calc(100vh-260px)] min-h-[400px] rounded-2xl overflow-hidden shadow-md border border-border">
                        <RestaurantMap
                            restaurants={filteredRestaurants}
                            selectedId={selectedRestaurantId}
                            onSelect={setSelectedRestaurantId}
                            userLocation={userLocation}
                            onUseMyLocation={handleUseMyLocation}
                            locationLoading={locationLoading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
