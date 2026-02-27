'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RestaurantMap } from '@/components/restaurants/restaurant-map';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Star, Clock, Users, Filter, Map, List, Loader2, Navigation, X } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { getRestaurants } from '@/app/actions/bookings';
import { getRestaurantsNearby } from '@/app/actions/geo';
import { Restaurant } from '@/types/database';

const defaultImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
];

export default function RestaurantsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

    // Geolocation state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [radiusMiles, setRadiusMiles] = useState<number>(50);

    // Filter restaurants based on search query
    const filteredRestaurants = useMemo(() => {
        if (!searchQuery.trim()) return restaurants;
        const q = searchQuery.toLowerCase();
        return restaurants.filter(r =>
            r.name.toLowerCase().includes(q) ||
            (r.cuisine_type && r.cuisine_type.toLowerCase().includes(q)) ||
            (r.city && r.city.toLowerCase().includes(q)) ||
            (r.description && r.description.toLowerCase().includes(q))
        );
    }, [restaurants, searchQuery]);

    // Load restaurants — either nearby or all
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
            console.error('[RestaurantsPage] Failed:', err);
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
            setLocationError('Geolocation is not supported by your browser');
            return;
        }
        setLocationLoading(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setLocationLoading(false);
            },
            (err) => {
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

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <h1 className="text-4xl font-bold mb-4">{t('restaurants.title')}</h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        {loading ? '...' : filteredRestaurants.length} {t('restaurants.description')}
                    </p>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('restaurants.searchPlaceholder')}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {/* Use My Location */}
                            {!userLocation ? (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleUseMyLocation}
                                    disabled={locationLoading}
                                    className="gap-2"
                                >
                                    {locationLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Navigation className="h-4 w-4" />
                                    )}
                                    {locationLoading ? 'Locating...' : t('restaurants.useMyLocation') || 'Use My Location'}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-medium">
                                    <Navigation className="h-4 w-4" />
                                    <span>{t('restaurants.nearYou') || 'Near you'}</span>
                                    {/* Radius selector */}
                                    <select
                                        value={radiusMiles}
                                        onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
                                        className="bg-transparent border-none text-primary font-semibold cursor-pointer focus:outline-none text-sm"
                                    >
                                        <option value={5}>5 mi</option>
                                        <option value={10}>10 mi</option>
                                        <option value={25}>25 mi</option>
                                        <option value={50}>50 mi</option>
                                    </select>
                                    <button onClick={clearLocation} className="ml-1 hover:bg-primary/20 rounded-full p-0.5 smooth-transition">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            <Button variant="outline" size="lg">
                                <Filter className="h-4 w-4 mr-2" />
                                {t('restaurants.filters')}
                            </Button>

                            {/* View Toggle */}
                            <div className="flex border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-4 py-2 flex items-center gap-2 smooth-transition ${viewMode === 'list'
                                        ? 'bg-primary text-white'
                                        : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('restaurants.viewList')}</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-4 py-2 flex items-center gap-2 smooth-transition ${viewMode === 'map'
                                        ? 'bg-primary text-white'
                                        : 'bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <Map className="h-4 w-4" />
                                    <span className="hidden sm:inline">{t('restaurants.viewMap')}</span>
                                </button>
                            </div>
                        </div>

                        {/* Location error message */}
                        {locationError && (
                            <p className="text-sm text-destructive mt-2">{locationError}</p>
                        )}
                    </div>

                    {/* Quick Filters */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium whitespace-nowrap shrink-0 snap-start">
                            {t('restaurants.all')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition whitespace-nowrap shrink-0 snap-start">
                            {t('restaurants.cuisineGeorgian')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition whitespace-nowrap shrink-0 snap-start">
                            {t('restaurants.cuisineEuropean')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition whitespace-nowrap shrink-0 snap-start">
                            {t('restaurants.fineDining')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition whitespace-nowrap shrink-0 snap-start">
                            {t('restaurants.availableToday')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {error ? (
                    <Card className="p-8 text-center text-red-500">
                        <Loader2 className="h-8 w-8 mx-auto mb-4" />
                        <p>{error}</p>
                        <Button onClick={() => loadRestaurants()} className="mt-4" variant="outline">
                            Try Again
                        </Button>
                    </Card>
                ) : loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="animate-pulse flex flex-col gap-3">
                                <div className="aspect-square sm:aspect-[4/3] w-full rounded-2xl bg-gray-200" />
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filteredRestaurants.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="h-16 w-16 mx-auto mb-4 text-gray-300 flex items-center justify-center">
                            <Search className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No restaurants found</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            We couldn't find any restaurants matching your search. Try adjusting your filters or location.
                        </p>
                        <Button onClick={() => { setSearchQuery(''); userLocation && clearLocation() }} variant="outline" className="mt-6 rounded-full px-6">
                            Clear Filters
                        </Button>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRestaurants.map((restaurant) => (
                            <Link href={`/restaurants/${restaurant.slug}`} key={restaurant.id} className="group flex flex-col gap-3 focus:outline-none">
                                {/* Image Box */}
                                <div className="relative aspect-square sm:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100">
                                    <img
                                        src={restaurant.images?.[0] || restaurant.gallery_images?.[0] || defaultImages[restaurant.name.length % defaultImages.length]}
                                        alt={restaurant.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                    />
                                    {/* Overlay Gradient */}
                                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent z-10" />

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-20">
                                        <div className="bg-white/95 backdrop-blur-sm text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                                            {restaurant.cuisine_type || 'Various'}
                                        </div>
                                    </div>

                                    {/* Rating badge */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <div className="bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-primary text-primary" />
                                            {restaurant.rating ? restaurant.rating.toFixed(1) : 'New'}
                                        </div>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold text-base text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-1">{restaurant.name}</h3>
                                        <span className="text-sm font-medium text-gray-600 shrink-0 ml-2">{'$'.repeat(Number(restaurant.price_range) || 2)}</span>
                                    </div>

                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 line-clamp-1">
                                        <span>{restaurant.city}</span>
                                        {restaurant.distance_miles !== undefined && (
                                            <>
                                                <span className="text-[10px]">•</span>
                                                <span className="flex items-center gap-0.5 font-medium text-primary"><MapPin className="h-3 w-3" /> {restaurant.distance_miles.toFixed(1)} mi</span>
                                            </>
                                        )}
                                        {restaurant.vibe_tags && restaurant.vibe_tags.length > 0 && (
                                            <>
                                                <span className="text-[10px]">•</span>
                                                <span>{restaurant.vibe_tags[0]}</span>
                                            </>
                                        )}
                                    </p>

                                    {/* Availability Badges (Simulated upcoming spots for UX) */}
                                    <div className="flex items-center gap-2 mt-2 pt-2 scrollbar-hide overflow-x-auto">
                                        <span className="shrink-0 px-3 py-1.5 bg-primary/5 text-primary text-xs font-semibold rounded-lg border border-primary/10 transition-colors">
                                            18:00
                                        </span>
                                        <span className="shrink-0 px-3 py-1.5 bg-primary/5 text-primary text-xs font-semibold rounded-lg border border-primary/10 transition-colors">
                                            19:30
                                        </span>
                                        <span className="shrink-0 px-3 py-1.5 bg-primary/5 text-primary text-xs font-semibold rounded-lg border border-primary/10 transition-colors">
                                            20:00
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="h-[600px] rounded-xl overflow-hidden shadow-sm border">
                        <RestaurantMap
                            restaurants={filteredRestaurants}
                            selectedId={selectedRestaurantId}
                            onSelect={setSelectedRestaurantId}
                            userLocation={userLocation}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
