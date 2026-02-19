'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RestaurantMap } from '@/components/restaurants/restaurant-map';
import Link from 'next/link';
import { Search, MapPin, Star, Clock, Users, Filter, Map, List, Loader2 } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';
import { getRestaurants } from '@/app/actions/bookings';
import { Restaurant } from '@/types/database';

const defaultImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
];

export default function RestaurantsPage() {
    const { t } = useLocale();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const result = await getRestaurants();
                console.log('[RestaurantsPage] getRestaurants result:', result);
                if (result.data) setRestaurants(result.data);
                if (result.error) setError(result.error);
            } catch (err: any) {
                console.error('[RestaurantsPage] Failed:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <h1 className="text-4xl font-bold mb-4">{t('restaurants.title')}</h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        {loading ? '...' : restaurants.length} {t('restaurants.description')}
                    </p>

                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={t('restaurants.searchPlaceholder')}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div className="flex gap-2">
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
                    </div>

                    {/* Quick Filters */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                        <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium">
                            {t('restaurants.all')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition">
                            {t('restaurants.cuisineGeorgian')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition">
                            {t('restaurants.cuisineEuropean')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition">
                            {t('restaurants.fineDining')}
                        </button>
                        <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium smooth-transition">
                            {t('restaurants.availableToday')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-3 text-muted-foreground">Loading restaurants...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-destructive mb-2">Failed to load restaurants</p>
                        <p className="text-sm text-muted-foreground">{error}</p>
                    </div>
                ) : restaurants.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl font-semibold mb-2">No restaurants found</p>
                        <p className="text-sm text-muted-foreground">Check back soon for new listings!</p>
                    </div>
                ) : viewMode === 'list' ? (
                    /* List View */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant, index) => {
                            const imgUrl = restaurant.images?.[0] || defaultImages[index % defaultImages.length];
                            return (
                                <Link
                                    key={restaurant.id}
                                    href={`/restaurants/${restaurant.slug}`}
                                    className="group"
                                >
                                    <Card className="premium-card overflow-hidden hover:shadow-luxury-lg smooth-transition h-full">
                                        {/* Image */}
                                        <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                            <img
                                                src={imgUrl}
                                                alt={restaurant.name}
                                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 smooth-transition"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                            {/* Badges */}
                                            <div className="absolute top-4 left-4 right-4 flex justify-between">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full">
                                                    {restaurant.price_range || '$$$'}
                                                </span>
                                                {restaurant.is_open && (
                                                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                                        {t('restaurants.availableToday')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rating */}
                                            <div className="absolute bottom-4 left-4">
                                                <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-white font-semibold text-sm">{restaurant.rating || 4.8}</span>
                                                    <span className="text-white/80 text-xs">({restaurant.review_count || 324})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary smooth-transition">
                                                {restaurant.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-1">{restaurant.cuisine_type}</p>
                                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                                {restaurant.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-4 border-t">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    {restaurant.city}
                                                </div>
                                                <Button size="sm" className="bg-primary hover:bg-primary/90">
                                                    {t('restaurants.bookNow')}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    /* Map View */
                    <div className="grid lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-300px)]">
                        {/* Restaurant List Sidebar */}
                        <div className="space-y-4 overflow-auto">
                            {restaurants.map((restaurant) => (
                                <Card
                                    key={restaurant.id}
                                    className={`p-4 cursor-pointer smooth-transition ${selectedRestaurantId === restaurant.id
                                        ? 'border-2 border-primary shadow-lg'
                                        : 'hover:shadow-md'
                                        }`}
                                    onClick={() => setSelectedRestaurantId(restaurant.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg">{restaurant.name}</h3>
                                        {restaurant.is_open && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                {t('restaurants.available')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{restaurant.cuisine_type}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-semibold">{restaurant.rating || 4.8}</span>
                                            <span className="text-xs text-muted-foreground">({restaurant.review_count || 124})</span>
                                        </div>
                                        <span className="text-sm font-medium">{restaurant.price_range}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {restaurant.city}
                                    </div>
                                    <Link href={`/restaurants/${restaurant.slug}`}>
                                        <Button size="sm" className="w-full mt-3">
                                            {t('restaurants.viewDetails')}
                                        </Button>
                                    </Link>
                                </Card>
                            ))}
                        </div>

                        {/* Map */}
                        <div className="rounded-lg overflow-hidden">
                            <RestaurantMap
                                restaurants={restaurants}
                                selectedRestaurantId={selectedRestaurantId}
                                onRestaurantClick={(restaurant) => setSelectedRestaurantId(restaurant.id)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
