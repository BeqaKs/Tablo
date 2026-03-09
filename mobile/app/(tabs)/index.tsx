import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ScrollView,
    Dimensions,
    Image,
    Alert,
    Platform,
    Share,
    Modal,
    Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, Bell, Heart, Star, ChevronRight, ChevronDown, Filter, Map as MapIcon, X, Flame, Sparkles, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/services/supabase';
import { cacheService } from '../../src/services/cache';
import { Restaurant } from '../../src/types/database';
import { Tables } from '../../src/types/database';
import { Colors as AppColors, Shadows } from '../../src/constants/Colors';
// const Colors = AppColors.light; // Removing hardcoded colors
import { t } from '../../src/localization/i18n';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Skeleton } from '../../src/components/Skeleton';
import { BlurView } from 'expo-blur';
import { MapWrapper } from '../../src/components/MapWrapper';
import { useLanguage } from '../../src/context/LanguageContext';
import { AIConcierge } from '../../src/components/AIConcierge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;
const TICKER_WIDTH = width * 2.5; // Wide enough for smooth infinite scroll

const CUISINE_ICONS = [
    { key: 'georgian', emoji: '🇬🇪' },
    { key: 'italian', emoji: '🍝' },
    { key: 'japanese', emoji: '🍣' },
    { key: 'steakhouse', emoji: '🥩' },
    { key: 'seafood', emoji: '🐟' },
    { key: 'vegan', emoji: '🥗' },
    { key: 'asian', emoji: '🍜' },
    { key: 'fineDining', emoji: '🍷' },
    { key: 'french', emoji: '🥐' },
    { key: 'mediterranean', emoji: '🫒' },
];

import { useTheme } from '../../src/context/ThemeContext';

export default function DiscoverScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = getStyles(colors, insets);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [showMiniMap, setShowMiniMap] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentLocation, setCurrentLocation] = useState('Tbilisi, Georgia');
    const [priceRange, setPriceRange] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState('rating');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showOpenNow, setShowOpenNow] = useState(false);
    const [quickFilter, setQuickFilter] = useState<'all' | 'top' | 'open'>('all');

    const router = useRouter();
    const { user, profile } = useAuth();
    const { language, setLanguage } = useLanguage();
    const mapRef = useRef<any>(null);

    // Visual Animations
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const welcomeOpacity = useRef(new Animated.Value(0)).current;
    const tickerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(headerScale, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(welcomeOpacity, {
                toValue: 1,
                duration: 1000,
                delay: 200,
                useNativeDriver: true,
            })
        ]).start();

        // Start ticker animation
        Animated.loop(
            Animated.timing(tickerAnim, {
                toValue: -TICKER_WIDTH / 2,
                duration: 25000,
                useNativeDriver: true,
            })
        ).start();

        // Load wishlist from cache
        cacheService.get<string[]>('wishlist').then(saved => {
            if (saved) setWishlist(new Set(saved));
        });

        fetchRestaurants();
    }, []);

    async function fetchRestaurants() {
        try {
            setLoading(true);
            const cached = await cacheService.get<Restaurant[]>('restaurants_index');
            if (cached && cached.length > 0) {
                setRestaurants(cached);
                setLoading(false); // Stop loading early if we have cache
            }

            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_open', true)
                .order('name');

            if (error) throw error;
            if (data) {
                setRestaurants(data);
                await cacheService.set('restaurants_index', data);
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    }

    const resetFilters = () => {
        setSelectedCuisine(null);
        setPriceRange([]);
        setSortBy('rating');
        setShowOpenNow(false);
        setQuickFilter('all');
    };

    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(r => {
            const matchesSearch = !searchQuery ||
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.cuisine_type || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCuisine = !selectedCuisine ||
                (r.cuisine_type || '').toLowerCase().includes(selectedCuisine.toLowerCase());
            const matchesTop = quickFilter !== 'top' || (Number((r as any).rating) >= 4.5);
            const matchesOpen = (quickFilter !== 'open' && !showOpenNow) || r.is_open === true;

            return matchesSearch && matchesCuisine && matchesTop && matchesOpen;
        });
    }, [restaurants, searchQuery, selectedCuisine, quickFilter, showOpenNow]);

    const dineDiscoveries = useMemo(() => filteredRestaurants.slice(0, 8), [filteredRestaurants]);
    const topRated = useMemo(() =>
        [...filteredRestaurants].sort((a, b) => (Number((b as any).rating) || 4.5) - (Number((a as any).rating) || 4.5)).slice(0, 6),
        [filteredRestaurants]
    );

    const restaurantCoords = useMemo(() => {
        const coords: Record<string, { lat: number; lng: number }> = {};
        restaurants.forEach((r, i) => {
            coords[r.id] = {
                lat: r.lat || (41.7151 + (Math.sin(i * 7) * 0.02)),
                lng: r.lng || (44.8271 + (Math.cos(i * 11) * 0.02)),
            };
        });
        return coords;
    }, [restaurants]);

    const toggleWishlist = useCallback((id: string) => {
        setWishlist(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            cacheService.set('wishlist', Array.from(next));
            return next;
        });
    }, []);

    const handleRestaurantPress = (restaurant: Restaurant) => {
        router.push({
            pathname: '/restaurant/[slug]',
            params: { slug: restaurant.slug }
        });
    };

    const handleCuisinePress = (key: string) => {
        setSelectedCuisine(prev => prev === key ? null : key);
    };

    const handleViewAll = () => {
        // Open the search view to browse all restaurants
        setShowSearch(true);
    };

    const handleNotificationPress = () => {
        setShowNotifications(true);
    };

    const handleLanguageChange = () => {
        setLanguage(language === 'en' ? 'ka' : 'en');
        // Trigger login if not authenticated as per user request
        if (!user) {
            router.push('/(auth)/login');
        }
    };

    const getMatchPercentage = (restaurant: Restaurant) => {
        const rating = (restaurant as any).rating || 4.5;
        // More stable logic: (Rating * 18) + a small deterministic offset based on ID
        const offset = (restaurant.id.charCodeAt(0) % 10);
        const base = Math.min(99, Math.max(80, Math.floor(Number(rating) * 18 + offset)));
        return base;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home.greetingMorning') || 'Good Morning';
        if (hour < 18) return t('home.greetingAfternoon') || 'Good Afternoon';
        return t('home.greetingEvening') || 'Good Evening';
    };

    // ── Predefined Collections (Mock Data for UI) ─────────────────────
    const HERO_COLLECTIONS = [
        {
            id: '1',
            title: 'Trending This Week',
            subtitle: 'Hottest spots in city',
            image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=800&auto=format&fit=crop',
        },
        {
            id: '2',
            title: 'Perfect for Date Night',
            subtitle: 'Romantic ambiance',
            image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop',
        },
        {
            id: '3',
            title: 'Hidden Gems',
            subtitle: 'Discover local secrets',
            image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?q=80&w=800&auto=format&fit=crop',
        }
    ];

    // Ticker messages built from real restaurant data
    const tickerMessages = useMemo(() => {
        if (restaurants.length === 0) return [];
        const msgs: string[] = [];
        restaurants.slice(0, 5).forEach(r => {
            const bookingCount = Math.floor(Math.random() * 15) + 3;
            msgs.push(`🍽️ ${bookingCount} people dining at ${r.name} tonight`);
        });
        restaurants.slice(0, 3).forEach(r => {
            msgs.push(`⭐ ${r.name} just got a 5-star review`);
        });
        return msgs;
    }, [restaurants]);

    // ── Render: Discovery Card ──────────────────────────────────────────
    const renderDiscoveryCard = (restaurant: Restaurant, index: number) => {
        const imageUrl = restaurant.gallery_images?.[0] || restaurant.images?.[0] ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop';
        const matchPct = getMatchPercentage(restaurant);
        const isWishlisted = wishlist.has(restaurant.id);
        const isTopRated = Number((restaurant as any).rating) >= 4.5;

        return (
            <TouchableOpacity
                key={restaurant.id}
                style={[styles.discoveryCard, { width: 220, height: 280, backgroundColor: colors.surface }]}
                activeOpacity={0.9}
                onPress={() => handleRestaurantPress(restaurant)}
            >
                <View style={[styles.discoveryCardImageContainer, { height: '100%', position: 'absolute', width: '100%' }]}>
                    <Image source={{ uri: imageUrl }} style={styles.discoveryCardImage} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.portraitGradient}
                    />

                    {/* Heart / Wishlist */}
                    <TouchableOpacity
                        style={[styles.wishlistBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
                        onPress={() => toggleWishlist(restaurant.id)}
                    >
                        <Heart
                            size={20}
                            color={isWishlisted ? '#E11D48' : '#FFF'}
                            fill={isWishlisted ? '#E11D48' : 'transparent'}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.portraitInfo}>
                    <View style={styles.portraitBadgeRow}>
                        <View style={styles.matchBadgeSmall}>
                            <Text style={styles.matchBadgeTextSmall}>
                                {matchPct}%
                            </Text>
                        </View>
                        {isTopRated && (
                            <View style={[styles.topRatedBadge, { position: 'relative', bottom: 0, right: 0 }]}>
                                <Flame size={10} color="#FFF" fill="#FFF" />
                                <Text style={styles.topRatedText}>Top</Text>
                            </View>
                        )}
                    </View>

                    <Text style={[styles.portraitName, { color: '#FFF' }]} numberOfLines={1}>{restaurant.name}</Text>

                    <View style={styles.portraitMeta}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={[styles.portraitRating, { color: 'rgba(255,255,255,0.9)' }]}>{(restaurant as any).rating || '4.5'}</Text>
                        <View style={styles.portraitMetaDot} />
                        <Text style={[styles.portraitAddress, { color: 'rgba(255,255,255,0.7)' }]} numberOfLines={1}>
                            {restaurant.address || restaurant.city || 'Tbilisi'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ── Render: Top Rated Card (Landscape Vertical Feed) ────────────────
    const renderTopRatedCard = (restaurant: Restaurant, index: number) => {
        const imageUrl = restaurant.gallery_images?.[0] || restaurant.images?.[0] ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop';
        const isWishlisted = wishlist.has(restaurant.id);

        // Mock times for quick book - in a real app these would come from availability API
        const mockTimes = ['19:00', '20:00', '21:00'];

        return (
            <TouchableOpacity
                key={`top-${restaurant.id}`}
                style={[styles.landscapeCard, { width: '100%', height: 148, backgroundColor: colors.surface }]}
                activeOpacity={0.9}
                onPress={() => handleRestaurantPress(restaurant)}
            >
                <View style={styles.landscapeImageContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.landscapeImage} />

                    <TouchableOpacity
                        style={styles.wishlistBtnSmall}
                        onPress={() => toggleWishlist(restaurant.id)}
                    >
                        <Heart
                            size={16}
                            color={isWishlisted ? '#E11D48' : '#FFF'}
                            fill={isWishlisted ? '#E11D48' : 'transparent'}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.landscapeInfo}>
                    <View style={styles.landscapeHeaderRow}>
                        <Text style={[styles.landscapeName, { color: colors.text }]} numberOfLines={1}>{restaurant.name}</Text>
                        <View style={styles.landscapeRatingBadge}>
                            <Star size={10} color="#FFF" fill="#FFF" />
                            <Text style={styles.landscapeRatingBadgeText}>{(restaurant as any).rating || '4.5'}</Text>
                        </View>
                    </View>

                    <Text style={[styles.landscapeCuisine, { color: colors.textSecondary }]} numberOfLines={1}>{restaurant.cuisine_type}</Text>

                    <View style={styles.landscapeMeta}>
                        <MapPin size={12} color={colors.textMuted} />
                        <Text style={[styles.landscapeAddress, { color: colors.textMuted }]} numberOfLines={1}>
                            {restaurant.address || restaurant.city || 'Tbilisi'}
                        </Text>
                    </View>

                    {/* Quick Book Time Slots */}
                    <View style={styles.quickBookRow}>
                        {mockTimes.map(time => (
                            <TouchableOpacity
                                key={time}
                                style={[styles.timeSlotBtn, { borderColor: colors.border }]}
                                onPress={() => handleRestaurantPress(restaurant)}
                            >
                                <Text style={[styles.timeSlotText, { color: colors.primary }]}>{time}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ── Render: Search Result Card ──────────────────────────────────────
    const renderSearchCard = (restaurant: Restaurant) => {
        const imageUrl = restaurant.gallery_images?.[0] || restaurant.images?.[0] ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop';
        const distance = (1 + Math.random() * 5).toFixed(1);
        const matchPct = getMatchPercentage(restaurant);
        const isWishlisted = wishlist.has(restaurant.id);

        return (
            <TouchableOpacity
                key={`search-${restaurant.id}`}
                style={[styles.searchCard, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
                activeOpacity={0.9}
                onPress={() => handleRestaurantPress(restaurant)}
            >
                <View style={styles.searchCardImageWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.searchCardImage} />
                    <View style={styles.searchCardMatchBadge}>
                        <Text style={styles.searchCardMatchText}>{matchPct}%</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.searchCardHeart}
                        onPress={() => toggleWishlist(restaurant.id)}
                    >
                        <Heart
                            size={14}
                            color={isWishlisted ? '#E11D48' : '#FFF'}
                            fill={isWishlisted ? '#E11D48' : 'rgba(0,0,0,0.3)'}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.searchCardInfo}>
                    <View style={styles.searchCardHeader}>
                        <Text style={[styles.searchCardName, { color: colors.text }]} numberOfLines={1}>{restaurant.name}</Text>
                        <View style={styles.searchCardRatingWrap}>
                            <Star size={12} color="#FBBF24" fill="#FBBF24" />
                            <Text style={[styles.searchCardRating, { color: colors.text }]}>{(restaurant as any).rating || '4.5'}</Text>
                        </View>
                    </View>

                    <Text style={[styles.searchCardCuisine, { color: colors.textSecondary }]} numberOfLines={1}>
                        {restaurant.cuisine_type} • {distance} km
                    </Text>

                    <View style={styles.searchCardMetaRow}>
                        <MapPin size={11} color={colors.textMuted} />
                        <Text style={[styles.searchCardAddress, { color: colors.textMuted }]} numberOfLines={1}>
                            {restaurant.address || restaurant.city || 'Tbilisi'}
                        </Text>
                    </View>

                    <View style={styles.searchCardTags}>
                        {restaurant.is_open && (
                            <View style={styles.openBadge}>
                                <Text style={styles.openBadgeText}>{t('restaurants.available') || 'Available'}</Text>
                            </View>
                        )}
                        <View style={styles.priceTag}>
                            <Text style={styles.priceTagText}>{restaurant.price_range || '₾₾'}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // ── Main Render ─────────────────────────────────────────────────────
    if (showSearch) {
        return (
            <View style={[styles.searchSafeArea, { backgroundColor: colors.background }]}>
                <StatusBar barStyle="light-content" />

                <LinearGradient
                    colors={['#8B1A10', '#B83024']}
                    style={[styles.searchHeader, { paddingTop: insets.top + 10 }]}
                >
                    <View>
                        <View style={styles.searchInputRow}>
                            <Search size={18} color="rgba(255,255,255,0.7)" />
                            <TextInput
                                placeholder={t('home.searchPlaceholderFull') || 'Search restaurants...'}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                style={styles.searchHeaderInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 8 }}>
                                    <X size={18} color="rgba(255,255,255,0.5)" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.closeSearchBtn}
                                onPress={() => { setShowSearch(false); setSearchQuery(''); }}
                            >
                                <Text style={styles.closeSearchText}>{t('common.close') || 'Close'}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.searchQuickFilters}
                        >
                            <TouchableOpacity
                                style={[styles.quickFilterChip, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                                onPress={() => setShowFilters(true)}
                            >
                                <Filter size={14} color="#FFF" />
                                <Text style={styles.quickFilterText}>{t('home.filters.title') || 'Filters'}</Text>
                            </TouchableOpacity>

                            <View style={styles.filterDivider} />

                            <TouchableOpacity
                                style={[styles.quickFilterChip, quickFilter === 'all' && styles.quickFilterChipActive]}
                                onPress={() => setQuickFilter('all')}
                            >
                                <Text style={[styles.quickFilterText, quickFilter === 'all' && styles.quickFilterTextActive]}>
                                    {t('restaurants.all') || 'All'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.quickFilterChip, quickFilter === 'top' && styles.quickFilterChipActive]}
                                onPress={() => setQuickFilter('top')}
                            >
                                <Flame size={14} color={quickFilter === 'top' ? '#FFF' : 'rgba(255,255,255,0.7)'} />
                                <Text style={[styles.quickFilterText, quickFilter === 'top' && styles.quickFilterTextActive]}>
                                    {t('home.filters.topRated') || 'Top Rated'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.quickFilterChip, quickFilter === 'open' && styles.quickFilterChipActive]}
                                onPress={() => setQuickFilter('open')}
                            >
                                <Clock size={14} color={quickFilter === 'open' ? '#FFF' : 'rgba(255,255,255,0.7)'} />
                                <Text style={[styles.quickFilterText, quickFilter === 'open' && styles.quickFilterTextActive]}>
                                    {t('home.filters.openNow') || 'Open Now'}
                                </Text>
                            </TouchableOpacity>

                            {CUISINE_ICONS.slice(0, 5).map(({ key, emoji }) => (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.quickFilterChip, selectedCuisine === key && styles.quickFilterChipActive]}
                                    onPress={() => setSelectedCuisine(prev => prev === key ? null : key)}
                                >
                                    <Text style={styles.quickFilterEmoji}>{emoji}</Text>
                                    <Text style={[styles.quickFilterText, selectedCuisine === key && styles.quickFilterTextActive]}>
                                        {t(`home.cuisineFilters.${key}`) || key}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </LinearGradient>

                <FlatList
                    data={filteredRestaurants}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => renderSearchCard(item)}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Search size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.text }]}>{t('home.noResults') || 'No restaurants found'}</Text>
                            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>{t('home.tryDifferent') || 'Try a different search term'}</Text>
                        </View>
                    }
                />

                {/* Search Mode Map Button */}
                <TouchableOpacity
                    style={[styles.searchMapFab, { backgroundColor: colors.primary }]}
                    onPress={() => {
                        setShowSearch(false);
                        router.push('/(tabs)/explore');
                    }}
                >
                    <MapIcon size={20} color="#FFF" />
                    <Text style={styles.searchMapFabText}>{t('restaurants.viewMap') || 'Map'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const renderPriceFilters = () => (
        <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('home.filters.priceRange') || 'Price Range'}</Text>
            <View style={styles.priceRow}>
                {[1, 2, 3, 4].map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.priceItem, { borderColor: colors.border }, priceRange.includes(p) && [styles.priceItemSelected, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]]}
                        onPress={() => {
                            setPriceRange(prev => prev.includes(p) ? prev.filter(v => v !== p) : [...prev, p]);
                        }}
                    >
                        <Text style={[styles.priceText, { color: colors.text }, priceRange.includes(p) && [styles.priceTextSelected, { color: colors.primary }]]}>{'₾'.repeat(p)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderSortFilters = () => (
        <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>{t('home.filters.sortBy') || 'Sort By'}</Text>
            <View style={styles.sortOptions}>
                {['rating', 'popularity', 'distance'].map(s => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.sortOption, { borderColor: colors.border }, sortBy === s && [styles.sortOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]]}
                        onPress={() => setSortBy(s)}
                    >
                        <Text style={[styles.sortText, { color: colors.text }, sortBy === s && styles.sortTextSelected]}>
                            {t(`home.filters.${s}`) || s}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
            >
                {/* ── Gradient Header ───────────────────────────────── */}
                <Animated.View style={{
                    transform: [
                        { scale: headerScale },
                        {
                            translateY: scrollY.interpolate({
                                inputRange: [-100, 0, 100],
                                outputRange: [50, 0, -20],
                                extrapolate: 'clamp',
                            })
                        }
                    ],
                    opacity: fadeAnim
                }}>
                    <LinearGradient
                        colors={['#8B1A10', '#B83024', '#D4483E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientHeader}
                    >
                        {/* Greeting Row */}
                        <View style={styles.greetingRow}>
                            <View style={styles.greetingLeft}>
                                <TouchableOpacity style={styles.avatarRing} onPress={() => setShowProfileModal(true)}>
                                    <View style={styles.avatarCircle}>
                                        <Text style={styles.avatarText}>
                                            {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'T'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <Animated.View style={{ opacity: welcomeOpacity }}>
                                    <Text style={styles.greetingText} numberOfLines={1} ellipsizeMode="tail">
                                        {profile?.full_name
                                            ? `${getGreeting()}, ${profile.full_name.split(' ')[0]} 👋`
                                            : `${getGreeting()} 👋`
                                        }
                                    </Text>
                                    <TouchableOpacity style={styles.locationRow} onPress={() => setShowLocationModal(true)}>
                                        <Text style={styles.locationText}>{currentLocation}</Text>
                                        <ChevronDown size={14} color="rgba(255,255,255,0.8)" />
                                    </TouchableOpacity>
                                </Animated.View>
                            </View>
                            <TouchableOpacity style={styles.notificationBtn} onPress={handleNotificationPress}>
                                <Bell size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar - More subtle now */}
                        <TouchableOpacity
                            style={styles.compactSearchBar}
                            activeOpacity={0.8}
                            onPress={() => setShowSearch(true)}
                        >
                            <Search size={16} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.compactSearchText}>{t('home.searchPlaceholder') || 'Find restaurants...'}</Text>
                        </TouchableOpacity>

                    </LinearGradient>
                </Animated.View>

                {/* ── Hero Collections Carousel ─────────────────────── */}
                <View style={styles.heroSection}>
                    <FlatList
                        data={HERO_COLLECTIONS}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.heroList}
                        snapToInterval={width * 0.85 + 16}
                        decelerationRate="fast"
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.heroCard}
                                activeOpacity={0.9}
                                onPress={() => setShowSearch(true)}
                            >
                                <Image source={{ uri: item.image }} style={styles.heroImage} />
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                                    style={styles.heroGradient}
                                >
                                    <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                                    <Text style={styles.heroTitle}>{item.title}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* ── Popular Right Now Ticker ──────────────────────── */}
                {tickerMessages.length > 0 && (
                    <View style={styles.tickerContainer}>
                        <Animated.View
                            style={[
                                styles.tickerTrack,
                                { transform: [{ translateX: tickerAnim }] }
                            ]}
                        >
                            {[...tickerMessages, ...tickerMessages].map((msg, i) => (
                                <View key={i} style={styles.tickerItem}>
                                    <Text style={styles.tickerText}>{msg}</Text>
                                    <View style={styles.tickerDot} />
                                </View>
                            ))}
                        </Animated.View>
                    </View>
                )}

                {/* ── Browse by Cuisine ─────────────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('home.browseByCuisine') || 'Browse by Cuisine'}</Text>
                    </View>
                    <View style={styles.cuisineGrid}>
                        {CUISINE_ICONS.map(({ key, emoji }) => {
                            const isSelected = selectedCuisine === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    style={[styles.cuisineItem, isSelected && styles.cuisineItemSelected]}
                                    onPress={() => handleCuisinePress(key)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.cuisineIconCircle, isSelected && styles.cuisineIconCircleSelected]}>
                                        <Text style={styles.cuisineEmoji}>{emoji}</Text>
                                    </View>
                                    <Text style={[styles.cuisineLabel, isSelected && styles.cuisineLabelSelected]} numberOfLines={1}>
                                        {t(`home.cuisineFilters.${key}`) || key}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* ── Dine Discoveries Section ───────────────────────── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('home.dineDiscoveries') || 'Dine Discoveries for You'}</Text>
                        <TouchableOpacity onPress={handleViewAll}>
                            <Text style={styles.viewAllText}>{t('common.viewAll') || 'View All'}</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={{ marginRight: 12, width: CARD_WIDTH }}>
                                    <Skeleton height={160} borderRadius={16} style={{ marginBottom: 10 }} />
                                    <Skeleton width="70%" height={16} style={{ marginBottom: 6 }} />
                                    <Skeleton width="50%" height={12} />
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <FlatList
                            data={dineDiscoveries}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalList}
                            snapToInterval={CARD_WIDTH + 12}
                            decelerationRate="fast"
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => renderDiscoveryCard(item, index)}
                        />
                    )}
                </View>

                {/* ── Banner Section (Contextual Vibe) ──────────────── */}
                <View style={styles.vibeBannerContainer}>
                    <LinearGradient
                        colors={['#1F2937', '#111827']}
                        style={styles.vibeBanner}
                    >
                        <View style={styles.vibeBannerContent}>
                            <View>
                                <Text style={styles.vibeBannerSup}>{t('home.vibeBannerSup') || 'Curated for you'}</Text>
                                <Text style={styles.vibeBannerTitle}>{t('home.vibeBannerTitle') || 'Cozy spots for\na chilly evening ☔️'}</Text>
                            </View>
                            <TouchableOpacity style={styles.vibeBannerBtn}>
                                <Text style={styles.vibeBannerBtnText}>{t('home.vibeBannerBtn') || 'Explore'}</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>


                {/* ── Featured Section (Vertical Feed) ────────────────── */}
                <View style={styles.featuredSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('home.topRatedNearbyTitle') || 'Top Rated Nearby'}</Text>
                        <TouchableOpacity onPress={handleViewAll}>
                            <Text style={styles.viewAllText}>{t('common.viewAll') || 'View All'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.verticalFeed}>
                        {topRated.map((item, index) => renderTopRatedCard(item, index))}
                    </View>
                </View>

                {/* ── Explore Map CTA ─────────────────────────────── */}
                <TouchableOpacity
                    style={styles.mapCtaContainer}
                    activeOpacity={0.9}
                    onPress={() => router.push('/(tabs)/explore')}
                >
                    <LinearGradient
                        colors={['#0F172A', '#1E293B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.mapCtaCard}
                    >
                        <View style={styles.mapCtaContent}>
                            <View style={styles.mapCtaIconBox}>
                                <MapIcon size={24} color="#FFF" />
                            </View>
                            <View style={styles.mapCtaTextBox}>
                                <Text style={styles.mapCtaTitle}>{t('home.exploreMapTitle') || 'Explore the Map'}</Text>
                                <Text style={styles.mapCtaSubtitle}>{t('home.exploreMapSubtitle') || 'Find restaurants near you on our interactive map'}</Text>
                            </View>
                            <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
                        </View>
                        {/* Decorative circles */}
                        <View style={styles.mapCtaCircle1} />
                        <View style={styles.mapCtaCircle2} />
                    </LinearGradient>
                </TouchableOpacity>

                {/* ── Empty State ────────────────────────────────────── */}
                {
                    !loading && filteredRestaurants.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Search size={48} color={colors.border} />
                            <Text style={styles.emptyText}>{t('home.noResults') || 'No restaurants found'}</Text>
                            <Text style={styles.emptySubtext}>{t('home.tryAdjust') || 'Try adjusting your search'}</Text>
                        </View>
                    )
                }
                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* AI Concierge rendering the Surprise Me FAB */}
            <AIConcierge />

            {/* Filter Modal */}
            <Modal visible={showFilters} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('home.filters.title') || 'Filters'}</Text>
                            <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                                <Text style={styles.resetBtnText}>{t('home.filters.reset') || 'Reset'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            {renderPriceFilters()}
                            {renderSortFilters()}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.applyBtn}
                            onPress={() => setShowFilters(false)}
                        >
                            <Text style={styles.applyBtnText}>{t('home.filters.apply') || 'Apply Filters'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Location Modal */}
            <Modal visible={showLocationModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('home.locationModal.title') || 'Select Location'}</Text>
                            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <TouchableOpacity style={styles.locationItem}>
                                <MapPin size={20} color={colors.primary} />
                                <Text style={styles.locationItemText}>{t('home.locationModal.current') || 'Current Location'}</Text>
                            </TouchableOpacity>
                            <Text style={styles.locationLabel}>{t('home.locationModal.popularAreas') || 'Popular Areas'}</Text>
                            {['tbilisi', 'vake', 'saburtalo', 'oldTbilisi', 'batumi'].map(loc => (
                                <TouchableOpacity key={loc} style={styles.locationItem} onPress={() => setShowLocationModal(false)}>
                                    <Text style={styles.locationItemText}>{t(`home.locationModal.${loc}`) || loc}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Notifications Modal */}
            <Modal visible={showNotifications} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('home.notifications.title') || 'Notifications'}</Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            {restaurants.length > 0 ? (
                                <>
                                    <View style={styles.notificationItem}>
                                        <View style={styles.notificationTextWrap}>
                                            <Text style={styles.notificationTitle}>
                                                {t('home.notifications.bookingReminder').replace('{{restaurant}}', restaurants[0]?.name || 'a restaurant')}
                                            </Text>
                                            <Text style={styles.notificationBody}>
                                                {t('home.notifications.bookingReminder')?.replace('{{restaurant}}', restaurants[0]?.name || 'a restaurant') || `Your booking at ${restaurants[0]?.name || 'a restaurant'} is coming up!`}
                                            </Text>
                                        </View>
                                        <Text style={styles.notificationTime}>2h ago</Text>
                                    </View>
                                    {restaurants.length > 1 && (
                                        <View style={styles.notificationItem}>
                                            <View style={styles.notificationTextWrap}>
                                                <Text style={styles.notificationTitle}>
                                                    {t('bookings.status.confirmed') || 'Booking Confirmed'} ✅
                                                </Text>
                                                <Text style={styles.notificationBody}>
                                                    {(t('home.notifications.newOffer') || 'New offer available at {{restaurant}}')
                                                        .replace('{{restaurant}}', restaurants[1]?.name || 'a restaurant')}
                                                </Text>
                                            </View>
                                            <Text style={styles.notificationTime}>1h ago</Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Bell size={36} color={colors.border} />
                                    <Text style={styles.emptyText}>{t('home.notifications.empty') || 'No new notifications'}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors: any, insets: any) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },

    // ── Gradient Header & Search ─────────────────────────
    gradientHeader: {
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: 24,
    },
    compactSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginTop: 4,
    },
    compactSearchText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '500',
    },
    greetingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    greetingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        marginRight: 8,
    },
    avatarRing: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    greetingText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        flexShrink: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '500',
    },
    locationSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    notificationBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Common UI Elements ───────────────────────────────
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: colors.textMuted,
        marginHorizontal: 4,
    },
    floatingMapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        gap: 6,
        position: 'absolute',
        right: 16,
        bottom: -20,
        ...Shadows.md,
    },
    floatingMapText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },

    // ── Cuisine Grid ─────────────────────────────────────
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 4,
    },
    cuisineItem: {
        width: (width - 32 - 16) / 5,
        alignItems: 'center',
        paddingVertical: 6,
    },
    cuisineItemSelected: {
        // highlight handled by icon circle
    },
    cuisineIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cuisineIconCircleSelected: {
        backgroundColor: `${colors.primary}15`,
        borderColor: colors.primary,
    },
    cuisineEmoji: {
        fontSize: 22,
    },
    cuisineLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
        textAlign: 'center',
        width: '100%',
    },
    cuisineLabelSelected: {
        color: colors.primary,
        fontWeight: '800',
    },

    // ── Hero Collections ─────────────────────────────────
    heroSection: {
        marginTop: 10,
        marginBottom: 20,
    },
    heroList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    heroCard: {
        width: width * 0.85,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        ...Shadows.md,
    },
    heroImage: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    heroGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroTitle: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '800',
    },

    // ── Ticker ───────────────────────────────────────────
    tickerContainer: {
        height: 36,
        backgroundColor: '#0F172A',
        overflow: 'hidden',
        justifyContent: 'center',
    },
    tickerTrack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    tickerText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    tickerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginLeft: 16,
    },

    // ── Sections ─────────────────────────────────────────
    section: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: -0.3,
        flex: 1,
        marginRight: 8,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    // ── Vibe Banner ──────────────────────────────────────
    vibeBannerContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
    },
    vibeBanner: {
        borderRadius: 20,
        padding: 20,
        ...Shadows.md,
    },
    vibeBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
    },
    vibeBannerSup: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    vibeBannerTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
        flex: 1,
    },
    vibeBannerBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    vibeBannerBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },

    // ── Feed Layouts ─────────────────────────────────────
    horizontalList: {
        paddingHorizontal: 20,
        gap: 16, // Better spacing for portrait cards
    },
    verticalFeed: {
        paddingHorizontal: 20,
        gap: 16,
    },

    // ── Discovery Cards (Portrait) ───────────────────────
    discoveryCard: {
        width: CARD_WIDTH,
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        ...Shadows.md,
    },
    discoveryCardImageContainer: {
        width: '100%',
        height: 160,
        position: 'relative',
    },
    discoveryCardImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    portraitGradient: {
        flex: 1,
        position: 'absolute',
        width: '100%',
        height: '100%',
        bottom: 0,
        borderRadius: 20,
    },
    portraitInfo: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: 16,
        paddingTop: 40, // space for gradient transition
    },
    portraitBadgeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    matchBadgeSmall: {
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    matchBadgeTextSmall: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    portraitName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    portraitMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    portraitRating: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFF',
    },
    portraitMetaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.6)',
        marginHorizontal: 4,
    },
    portraitAddress: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        flex: 1,
    },
    topRatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EF4444',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    topRatedText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    wishlistBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },

    // ── Top Rated Cards (Landscape Feed) ─────────────────
    landscapeCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.border, // Subtle border keeps it clean in vertical list
        ...Shadows.sm,
    },
    landscapeImageContainer: {
        width: 120,
        height: '100%',
        position: 'relative',
    },
    landscapeImage: {
        width: '100%',
        height: '100%',
    },
    wishlistBtnSmall: {
        position: 'absolute',
        top: 8,
        left: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    landscapeInfo: {
        flex: 1,
        padding: 12,
        paddingVertical: 14,
        justifyContent: 'space-between',
    },
    landscapeHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    landscapeName: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
        flex: 1,
        paddingRight: 8,
    },
    landscapeRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FBBF24',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 3,
    },
    landscapeRatingBadgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    landscapeCuisine: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
    },
    landscapeMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    landscapeAddress: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
        flex: 1,
    },
    quickBookRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 6,
    },
    timeSlotBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    timeSlotText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },

    // ── Map Discovery ────────────────────────────────────
    miniMapContainer: {
        marginHorizontal: 20,
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        ...Shadows.md,
    },
    mapPreview: {
        marginHorizontal: 20,
        borderRadius: 16,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    mapPreviewGradient: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    mapPreviewTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    mapPreviewSubtitle: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500',
    },

    // ── Search Mode ──────────────────────────────────────
    searchSafeArea: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
    searchHeader: {
        backgroundColor: '#1A1A2E',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    searchInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
        marginBottom: 12,
    },
    searchHeaderInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    searchActions: {
        flexDirection: 'row',
        gap: 10,
    },
    searchFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    searchMapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    searchFilterText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    searchResults: {
        flex: 1,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    fullMap: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },

    // ── Search Cards ─────────────────────────────────────
    searchCard: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchCardImageWrap: {
        width: 110,
        height: 110,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
    },
    searchCardImage: {
        width: '100%',
        height: '100%',
    },
    searchCardInfo: {
        flex: 1,
        paddingLeft: 14,
        justifyContent: 'center',
    },
    searchCardName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    searchCardCuisine: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
        marginBottom: 6,
    },
    searchCardMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    searchCardRating: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    searchCardDistance: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },
    searchCardAddress: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },
    searchCardMatchBadge: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    searchCardMatchText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
    searchCardHeart: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    searchCardRatingWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    searchCardTags: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    openBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    openBadgeText: {
        color: '#166534',
        fontSize: 10,
        fontWeight: '700',
    },
    priceTag: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    priceTagText: {
        color: colors.textSecondary,
        fontSize: 10,
        fontWeight: '700',
    },

    // ── Search Mode Layout ─────────────────────────────
    closeSearchBtn: {
        paddingLeft: 12,
        paddingVertical: 4,
    },
    closeSearchText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    searchQuickFilters: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 8,
    },
    quickFilterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    quickFilterChipActive: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    quickFilterText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        fontWeight: '600',
    },
    quickFilterTextActive: {
        color: '#8B1A10',
    },
    quickFilterEmoji: {
        fontSize: 14,
    },
    filterDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 4,
        alignSelf: 'center',
    },
    searchMapFab: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 30,
        ...Shadows.md,
    },
    searchMapFabText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 15,
    },

    // ── Book Seat Button ─────────────────────────────────
    bookSeatBtn: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        ...Shadows.colored(colors.primary),
    },
    bookSeatBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // ── Empty State ──────────────────────────────────────
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    bannerContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    mapBanner: {
        height: 180,
        borderRadius: 24,
        overflow: 'hidden',
        ...Shadows.md,
    },
    bannerBackground: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    bannerGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    bannerIconBox: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '800',
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '500',
    },
    discoverSection: {
        marginBottom: 30,
    },
    featuredSection: {
        marginBottom: 10,
    },

    // ── Map CTA Card ─────────────────────────────────────
    mapCtaContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    mapCtaCard: {
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
        ...Shadows.md,
    },
    mapCtaContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        zIndex: 1,
    },
    mapCtaIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapCtaTextBox: {
        flex: 1,
    },
    mapCtaTitle: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    mapCtaSubtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '500',
    },
    mapCtaCircle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    mapCtaCircle2: {
        position: 'absolute',
        bottom: -30,
        right: 40,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },

    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    locationItemText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMuted,
        marginTop: 20,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '50%',
        paddingBottom: 40,
    },
    locationModalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalBody: {
        padding: 24,
    },
    filterSection: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    priceRow: {
        flexDirection: 'row',
        gap: 8,
    },
    priceItem: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceItemSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    priceTextSelected: {
        color: '#FFF',
    },
    sortOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    sortOption: {
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    sortOptionSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    sortText: {
        fontSize: 16,
        color: colors.text,
    },
    sortTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    applyBtn: {
        backgroundColor: colors.primary,
        margin: 24,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    resetBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    resetBtnText: {
        color: '#8B1A10',
        fontSize: 14,
        fontWeight: '600',
    },
    notificationFeed: {
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginBottom: 12,
    },
    notificationTextWrap: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    notificationTime: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    areaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    areaText: {
        fontSize: 16,
        color: colors.text,
    },
    popularAreas: {
        paddingBottom: 20,
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: 8,
    },
    inputWrap: {
        height: 52,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    inputText: {
        fontSize: 16,
        color: colors.text,
    },
    languageSelectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F0F9FF',
        borderRadius: 12,
        marginTop: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    languageSelectText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#0369A1',
    },
});
