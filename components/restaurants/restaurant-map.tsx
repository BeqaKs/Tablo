'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface Restaurant {
    id: number;
    name: string;
    slug: string;
    location: string;
    lat: number;
    lng: number;
    rating: number;
    priceRange: string;
    cuisine: string;
}

interface RestaurantMapProps {
    restaurants: Restaurant[];
    onRestaurantClick?: (restaurant: Restaurant) => void;
    selectedRestaurantId?: number | null;
}

export function RestaurantMap({ restaurants, onRestaurantClick, selectedRestaurantId }: RestaurantMapProps) {
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    // Tbilisi center coordinates
    const centerLat = 41.7151;
    const centerLng = 44.8271;

    // Simple map bounds (will be replaced with actual map library)
    const mapWidth = 800;
    const mapHeight = 600;

    // Convert lat/lng to pixel coordinates (simplified projection)
    const latLngToPixel = (lat: number, lng: number) => {
        const latRange = 0.05; // ~5km range
        const lngRange = 0.08;

        const x = ((lng - (centerLng - lngRange / 2)) / lngRange) * mapWidth;
        const y = ((centerLat + latRange / 2 - lat) / latRange) * mapHeight;

        return { x, y };
    };

    return (
        <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            {/* Map Background - Placeholder for actual map */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-200">
                {/* Grid pattern to simulate map */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, #000 1px, transparent 1px),
              linear-gradient(to bottom, #000 1px, transparent 1px)
            `,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    Tbilisi Center
                </div>
            </div>

            {/* Restaurant Markers */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {restaurants.map((restaurant) => {
                    const { x, y } = latLngToPixel(restaurant.lat, restaurant.lng);
                    const isSelected = selectedRestaurantId === restaurant.id;
                    const isHovered = hoveredId === restaurant.id;

                    return (
                        <g key={restaurant.id} className="pointer-events-auto cursor-pointer">
                            {/* Marker Circle */}
                            <circle
                                cx={x}
                                cy={y}
                                r={isSelected || isHovered ? 12 : 8}
                                className={`smooth-transition ${isSelected
                                        ? 'fill-primary stroke-white'
                                        : isHovered
                                            ? 'fill-tablo-red-600 stroke-white'
                                            : 'fill-tablo-red-500 stroke-white'
                                    }`}
                                strokeWidth={2}
                                onClick={() => onRestaurantClick?.(restaurant)}
                                onMouseEnter={() => setHoveredId(restaurant.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            />

                            {/* Marker Icon */}
                            <g
                                transform={`translate(${x - 4}, ${y - 4})`}
                                className="pointer-events-none"
                            >
                                <path
                                    d="M4 0C1.8 0 0 1.8 0 4c0 1.5.8 2.8 2 3.5V12l2-1.5 2 1.5V7.5c1.2-.7 2-2 2-3.5 0-2.2-1.8-4-4-4z"
                                    className="fill-white"
                                    transform="scale(0.5)"
                                />
                            </g>

                            {/* Tooltip on hover */}
                            {(isHovered || isSelected) && (
                                <g>
                                    <rect
                                        x={x - 60}
                                        y={y - 50}
                                        width={120}
                                        height={40}
                                        rx={6}
                                        className="fill-white stroke-gray-300"
                                        strokeWidth={1}
                                        filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                                    />
                                    <text
                                        x={x}
                                        y={y - 35}
                                        textAnchor="middle"
                                        className="text-xs font-semibold fill-foreground"
                                    >
                                        {restaurant.name}
                                    </text>
                                    <text
                                        x={x}
                                        y={y - 22}
                                        textAnchor="middle"
                                        className="text-xs fill-muted-foreground"
                                    >
                                        {restaurant.cuisine}
                                    </text>
                                    <text
                                        x={x}
                                        y={y - 10}
                                        textAnchor="middle"
                                        className="text-xs fill-primary font-medium"
                                    >
                                        ★ {restaurant.rating} • {restaurant.priceRange}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Map Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 smooth-transition">
                    <span className="text-lg font-bold">+</span>
                </button>
                <button className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 smooth-transition">
                    <span className="text-lg font-bold">−</span>
                </button>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-xs font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                    <div className="w-3 h-3 rounded-full bg-tablo-red-500"></div>
                    <span className="text-xs font-medium">Available</span>
                </div>
            </div>
        </div>
    );
}
