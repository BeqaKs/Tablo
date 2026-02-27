'use client';

import { useEffect, useRef, useState } from 'react';
import { Restaurant as DBRestaurant } from '@/types/database';

interface RestaurantMapProps {
    restaurants: DBRestaurant[];
    onSelect?: (id: string | null) => void;
    selectedId?: string | null;
    userLocation?: { lat: number; lng: number } | null;
    onUseMyLocation?: () => void;
    locationLoading?: boolean;
}

export function RestaurantMap({ restaurants, onSelect, selectedId, userLocation, onUseMyLocation, locationLoading }: RestaurantMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [mapReady, setMapReady] = useState(false);

    // Tbilisi center
    const CENTER_LAT = 41.7151;
    const CENTER_LNG = 44.8271;

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Fix Leaflet default icon paths
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!, {
                center: [CENTER_LAT, CENTER_LNG],
                zoom: 13,
                zoomControl: false,
                attributionControl: true,
            });

            // Use OpenStreetMap tiles — most reliable
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Zoom controls — bottom right
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            // Force a resize after the map mounts to fix tile loading
            setTimeout(() => {
                map.invalidateSize();
            }, 300);

            mapInstanceRef.current = map;
            setMapReady(true);
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update markers when restaurants or selection changes
    useEffect(() => {
        if (!mapReady || !mapInstanceRef.current) return;

        const loadMarkers = async () => {
            const L = (await import('leaflet')).default;
            const map = mapInstanceRef.current;

            // Force re-render tiles
            map.invalidateSize();

            // Clear existing markers
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            const bounds: [number, number][] = [];

            restaurants.forEach((restaurant) => {
                let lat = (restaurant as any).lat;
                let lng = (restaurant as any).lng;

                if (!lat || !lng) {
                    // Deterministic fallback from restaurant ID
                    const hash = restaurant.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const r1 = (hash % 100) / 100;
                    const r2 = ((hash * 13) % 100) / 100;
                    lat = CENTER_LAT + (r1 - 0.5) * 0.04;
                    lng = CENTER_LNG + (r2 - 0.5) * 0.06;
                }

                if (lat && lng) {
                    bounds.push([lat, lng]);

                    const isSelected = selectedId === restaurant.id;
                    const size = isSelected ? 36 : 28;

                    const markerElement = document.createElement('div');
                    markerElement.className = `custom-marker ${selectedId === restaurant.id ? 'selected' : ''}`;
                    markerElement.innerHTML = `
                        <div style="
                            width: ${size}px;
                            height: ${size}px;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            background: ${isSelected ? '#9f1239' : '#e11d48'};
                            border: 3px solid white;
                            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            <div style="transform: rotate(45deg); color: white; font-weight: 600; font-size: ${isSelected ? '14px' : '12px'};">
                                ${'$'.repeat(restaurant.price_range && Number(restaurant.price_range) ? Number(restaurant.price_range) : 2)}
                            </div>
                        </div>
                    `;

                    const icon = L.divIcon({
                        className: 'custom-map-marker',
                        html: markerElement.outerHTML,
                        iconSize: [size, size],
                        iconAnchor: [size / 2, size],
                        popupAnchor: [0, -size],
                    });

                    const marker = L.marker([lat, lng], { icon }).addTo(map);

                    // Rich popup
                    const imgUrl = restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop';
                    marker.bindPopup(`
                        <div style="min-width: 220px; font-family: system-ui, sans-serif;">
                            <img src="${imgUrl}" alt="${restaurant.name}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -14px -20px 10px -20px; width: calc(100% + 40px);" />
                            <div style="padding: 0 2px;">
                                <h3 style="font-size: 15px; font-weight: 700; margin: 0 0 4px 0; color: #1a1a2e;">${restaurant.name}</h3>
                                <p style="font-size: 12px; color: #6b7280; margin: 0 0 6px 0;">${restaurant.cuisine_type || 'Restaurant'} · ${restaurant.city}</p>
                                <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 8px;">
                                    <span style="color: #e11d48; font-weight: 600;">★ ${restaurant.rating || '4.8'}</span>
                                    <span style="color: #9ca3af;">·</span>
                                    <span style="font-weight: 600;">${restaurant.price_range || '$$$'}</span>
                                </div>
                                <a href="/restaurants/${restaurant.slug}" style="
                                    display: block;
                                    text-align: center;
                                    background: #9f1239;
                                    color: white;
                                    padding: 8px 16px;
                                    border-radius: 8px;
                                    font-size: 13px;
                                    font-weight: 600;
                                    text-decoration: none;
                                    transition: opacity 0.2s;
                                ">Book Table →</a>
                            </div>
                        </div>
                    `, {
                        maxWidth: 260,
                        className: 'tablo-popup',
                    });

                    marker.on('click', () => {
                        if (onSelect) {
                            onSelect(restaurant.id);
                        }
                    });
                    if (isSelected) {
                        marker.openPopup();
                    }

                    markersRef.current.push(marker);
                }
            });

            // Add user location marker
            if (userLocation) {
                bounds.push([userLocation.lat, userLocation.lng]);

                const userMarkerElement = document.createElement('div');
                userMarkerElement.innerHTML = `
                    <div style="
                        width: 14px;
                        height: 14px;
                        background-color: #2563eb;
                        border: 2px solid white;
                        border-radius: 50%;
                        box-shadow: 0 0 4px rgba(0,0,0,0.4);
                    "></div>
                `;

                const userIcon = L.divIcon({
                    className: 'custom-map-marker',
                    html: userMarkerElement.outerHTML,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                });

                const userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: userIcon,
                    zIndexOffset: 1000
                }).addTo(map);

                userMarker.bindTooltip('Your Location', { direction: 'top', offset: [0, -12], className: 'font-semibold text-sm' });

                markersRef.current.push(userMarker);
            }

            // Fit map to markers
            if (bounds.length > 0) {
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
            }
        };

        loadMarkers();
    }, [restaurants, selectedId, mapReady, userLocation]);

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border" style={{ minHeight: '500px' }}>
            {/* Leaflet CSS — loaded without integrity hash to avoid CORS issues */}
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
            />
            <style>{`
                .tablo-popup .leaflet-popup-content-wrapper {
                    border-radius: 12px;
                    padding: 14px 20px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                    border: 1px solid #f3f4f6;
                }
                .tablo-popup .leaflet-popup-tip {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .custom-map-marker {
                    background: none !important;
                    border: none !important;
                }
                .leaflet-control-zoom a {
                    border-radius: 8px !important;
                    width: 36px !important;
                    height: 36px !important;
                    line-height: 36px !important;
                    font-size: 18px !important;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
                }
                .leaflet-control-zoom {
                    border: none !important;
                    border-radius: 10px !important;
                    overflow: hidden;
                }
                .leaflet-tile-pane {
                    z-index: 1 !important;
                }
            `}</style>

            <div ref={mapRef} className="w-full h-full" style={{ minHeight: '500px' }} />

            {/* Loading overlay */}
            {!mapReady && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading map...</p>
                    </div>
                </div>
            )}

            {/* Floating Locate Me button — bottom right, above zoom controls */}
            {onUseMyLocation && (
                <button
                    onClick={onUseMyLocation}
                    disabled={locationLoading}
                    title="Center on my location"
                    style={{ bottom: '120px', right: '10px' }}
                    className={`absolute z-[1000] w-9 h-9 flex items-center justify-center rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50 smooth-transition ${userLocation ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
                        } ${locationLoading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                >
                    {locationLoading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L12 4M12 20L12 22M4 12L2 12M22 12L20 12" />
                            <circle cx="12" cy="12" r="4" fill={userLocation ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
                            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
}
