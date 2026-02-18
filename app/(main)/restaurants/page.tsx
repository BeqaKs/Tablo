'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RestaurantMap } from '@/components/restaurants/restaurant-map';
import Link from 'next/link';
import { Search, MapPin, Star, Clock, Users, Filter, Map, List } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

export default function RestaurantsPage() {
    const { t } = useLocale();
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

    // Mock data - will be replaced with Supabase data
    const restaurants = [
        {
            id: 1,
            name: 'Shavi Lomi',
            slug: 'shavi-lomi',
            cuisine: 'Georgian Fine Dining',
            description: 'Modern Georgian cuisine in an intimate setting',
            priceRange: '$$$',
            rating: 4.8,
            reviewCount: 324,
            location: 'Vera, Tbilisi',
            lat: 41.7180,
            lng: 44.7910,
            image: '/placeholder-restaurant.jpg',
            availableToday: true,
        },
        {
            id: 2,
            name: 'Barbarestan',
            slug: 'barbarestan',
            cuisine: 'Traditional Georgian',
            description: 'Historic recipes from 19th century cookbook',
            priceRange: '$$',
            rating: 4.9,
            reviewCount: 567,
            location: 'Old Tbilisi',
            lat: 41.6938,
            lng: 44.8070,
            image: '/placeholder-restaurant.jpg',
            availableToday: true,
        },
        {
            id: 3,
            name: 'Café Gabriadze',
            slug: 'cafe-gabriadze',
            cuisine: 'European & Georgian',
            description: 'Charming café with puppet theater views',
            priceRange: '$$',
            rating: 4.7,
            reviewCount: 412,
            location: 'Old Tbilisi',
            lat: 41.6925,
            lng: 44.8085,
            image: '/placeholder-restaurant.jpg',
            availableToday: false,
        },
        {
            id: 4,
            name: 'Culinarium Khasheria',
            slug: 'culinarium-khasheria',
            cuisine: 'Georgian',
            description: 'Traditional dishes in historic courtyard',
            priceRange: '$$',
            rating: 4.6,
            reviewCount: 289,
            location: 'Old Tbilisi',
            lat: 41.6910,
            lng: 44.8095,
            image: '/placeholder-restaurant.jpg',
            availableToday: true,
        },
        {
            id: 5,
            name: 'Azarphesha',
            slug: 'azarphesha',
            cuisine: 'Georgian Fine Dining',
            description: 'Upscale Georgian with wine pairings',
            priceRange: '$$$',
            rating: 4.8,
            reviewCount: 198,
            location: 'Sololaki',
            lat: 41.6950,
            lng: 44.8000,
            image: '/placeholder-restaurant.jpg',
            availableToday: true,
        },
        {
            id: 6,
            name: 'Sakhli #11',
            slug: 'sakhli-11',
            cuisine: 'Georgian',
            description: 'Home-style cooking in cozy atmosphere',
            priceRange: '$',
            rating: 4.5,
            reviewCount: 445,
            location: 'Vake',
            lat: 41.7100,
            lng: 44.7650,
            image: '/placeholder-restaurant.jpg',
            availableToday: true,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <h1 className="text-4xl font-bold mb-4">{t('restaurants.title')}</h1>
                    <p className="text-lg text-muted-foreground mb-6">
                        {restaurants.length} {t('restaurants.description')}
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
                {viewMode === 'list' ? (
                    /* List View */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {restaurants.map((restaurant) => (
                            <Link
                                key={restaurant.id}
                                href={`/restaurants/${restaurant.slug}`}
                                className="group"
                            >
                                <Card className="premium-card overflow-hidden hover:shadow-luxury-lg smooth-transition h-full">
                                    {/* Image */}
                                    <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Badges */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-foreground text-xs font-semibold rounded-full">
                                                {restaurant.priceRange}
                                            </span>
                                            {restaurant.availableToday && (
                                                <span className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
                                                    {t('restaurants.availableToday')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Rating */}
                                        <div className="absolute bottom-4 left-4">
                                            <div className="flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm rounded">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="text-white font-semibold text-sm">{restaurant.rating}</span>
                                                <span className="text-white/80 text-xs">({restaurant.reviewCount})</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary smooth-transition">
                                            {restaurant.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-1">{restaurant.cuisine}</p>
                                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                            {restaurant.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-4 w-4" />
                                                {restaurant.location}
                                            </div>
                                            <Button size="sm" className="bg-primary hover:bg-tablo-red-600">
                                                {t('restaurants.bookNow')}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
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
                                        {restaurant.availableToday && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                                {t('restaurants.available')}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">{restaurant.cuisine}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-semibold">{restaurant.rating}</span>
                                            <span className="text-xs text-muted-foreground">({restaurant.reviewCount})</span>
                                        </div>
                                        <span className="text-sm font-medium">{restaurant.priceRange}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {restaurant.location}
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
