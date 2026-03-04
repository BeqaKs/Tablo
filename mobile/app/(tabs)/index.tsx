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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Bell, Heart, Star, ChevronRight, ChevronDown, Filter, Map as MapIcon, X, Flame, Sparkles, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../src/services/supabase';
import { Restaurant } from '../../src/types/database';
import { Colors, Shadows } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Skeleton } from '../../src/components/Skeleton';
import { BlurView } from 'expo-blur';
import { MapWrapper } from '../../src/components/MapWrapper';
import { useLanguage } from '../../src/context/LanguageContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.65;

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

export default function DiscoverScreen() {
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

    const router = useRouter();
    const { user, profile } = useAuth();
    const { language, setLanguage } = useLanguage();
    const mapRef = useRef<any>(null);

    // Visual Animations
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const headerScale = useRef(new Animated.Value(0.95)).current;
    const welcomeOpacity = useRef(new Animated.Value(0)).current;

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

        fetchRestaurants();
    }, []);

    async function fetchRestaurants() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('is_open', true)
                .order('name');

            if (error) throw error;
            setRestaurants(data || []);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(r => {
            const matchesSearch = !searchQuery ||
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCuisine = !selectedCuisine ||
                r.cuisine_type.toLowerCase().includes(selectedCuisine.toLowerCase());
            return matchesSearch && matchesCuisine;
        });
    }, [restaurants, searchQuery, selectedCuisine]);

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
    };

    const getMatchPercentage = (restaurant: Restaurant) => {
        const rating = (restaurant as any).rating || 4.5;
        const base = Math.min(99, Math.max(75, Math.floor(Number(rating) * 20 + Math.random() * 10)));
        return base;
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('home.greetingMorning') || 'Good Morning';
        if (hour < 18) return t('home.greetingAfternoon') || 'Good Afternoon';
        return t('home.greetingEvening') || 'Good Evening';
    };

    const handleSurpriseMe = () => {
        if (filteredRestaurants.length === 0) return;
        // Fancy random pick
        const randomIndex = Math.floor(Math.random() * Math.min(filteredRestaurants.length, 20));
        const picked = filteredRestaurants[randomIndex];
        // Short delay for effect
        setTimeout(() => {
            handleRestaurantPress(picked);
        }, 300);
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

    // ── Render: Discovery Card ──────────────────────────────────────────
    const renderDiscoveryCard = (restaurant: Restaurant, index: number) => {
        const imageUrl = restaurant.gallery_images?.[0] || restaurant.images?.[0] ||
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop';
        const matchPct = getMatchPercentage(restaurant);
        const isWishlisted = wishlist.has(restaurant.id);
        const isTopRated = Number(restaurant.rating) >= 4.5;

        return (
            <TouchableOpacity
                key={restaurant.id}
                style={[styles.discoveryCard, { width: 220, height: 280 }]}
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

                    <Text style={styles.portraitName} numberOfLines={1}>{restaurant.name}</Text>

                    <View style={styles.portraitMeta}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.portraitRating}>{(restaurant as any).rating || '4.5'}</Text>
                        <View style={styles.portraitMetaDot} />
                        <Text style={styles.portraitAddress} numberOfLines={1}>
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

        // Mock times for quick book
        const mockTimes = ['19:00', '19:30', '20:00'];

        return (
            <TouchableOpacity
                key={`top-${restaurant.id}`}
                style={[styles.landscapeCard, { width: '100%', height: 130 }]}
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
                        <Text style={styles.landscapeName} numberOfLines={1}>{restaurant.name}</Text>
                        <View style={styles.landscapeRatingBadge}>
                            <Star size={10} color="#FFF" fill="#FFF" />
                            <Text style={styles.landscapeRatingBadgeText}>{(restaurant as any).rating || '4.5'}</Text>
                        </View>
                    </View>

                    <Text style={styles.landscapeCuisine} numberOfLines={1}>{restaurant.cuisine_type}</Text>

                    <View style={styles.landscapeMeta}>
                        <MapPin size={12} color={Colors.textMuted} />
                        <Text style={styles.landscapeAddress} numberOfLines={1}>
                            {restaurant.address || restaurant.city || 'Tbilisi'}
                        </Text>
                    </View>

                    {/* Quick Book Time Slots */}
                    <View style={styles.quickBookRow}>
                        {mockTimes.map(time => (
                            <TouchableOpacity
                                key={time}
                                style={styles.timeSlotBtn}
                                onPress={() => handleRestaurantPress(restaurant)}
                            >
                                <Text style={styles.timeSlotText}>{time}</Text>
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

        return (
            <TouchableOpacity
                key={`search-${restaurant.id}`}
                style={styles.searchCard}
                activeOpacity={0.9}
                onPress={() => handleRestaurantPress(restaurant)}
            >
                <View style={styles.searchCardImageWrap}>
                    <Image source={{ uri: imageUrl }} style={styles.searchCardImage} />
                </View>
                <View style={styles.searchCardInfo}>
                    <Text style={styles.searchCardName} numberOfLines={1}>{restaurant.name}</Text>
                    <Text style={styles.searchCardCuisine} numberOfLines={1}>
                        {restaurant.cuisine_type}
                    </Text>
                    <View style={styles.searchCardMetaRow}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.searchCardRating}>{(restaurant as any).rating || '4.5'}</Text>
                        <View style={styles.metaDot} />
                        <MapPin size={11} color={Colors.textMuted} />
                        <Text style={styles.searchCardDistance}>{distance} km</Text>
                    </View>
                    <Text style={styles.searchCardAddress} numberOfLines={1}>
                        {restaurant.address || restaurant.city || 'Tbilisi'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // ── Main Render ─────────────────────────────────────────────────────
    if (showSearch) {
        return (
            <>
                <SafeAreaView style={styles.searchSafeArea}>
                    <StatusBar barStyle="light-content" />

                    {/* Search Header */}
                    <View style={styles.searchHeader}>
                        <View style={styles.searchInputRow}>
                            <Search size={18} color="rgba(255,255,255,0.7)" />
                            <TextInput
                                placeholder={t('home.searchPlaceholderFull') || 'Search restaurants, cuisines...'}
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                style={styles.searchHeaderInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); }}>
                                <X size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.searchActions}>
                            <TouchableOpacity
                                style={styles.searchFilterBtn}
                                onPress={() => setShowFilters(true)}
                            >
                                <Filter size={16} color="#FFF" />
                                <Text style={styles.searchFilterText}>{t('home.filters.title') || 'Filters'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.searchMapBtn}
                                onPress={() => {
                                    setShowSearch(false);
                                    router.push('/(tabs)/explore');
                                }}
                            >
                                <MapIcon size={16} color="#FFF" />
                                <Text style={styles.searchFilterText}>{t('restaurants.viewMap') || 'Map'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.searchResults}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {filteredRestaurants.length > 0 ? (
                            filteredRestaurants.map(r => renderSearchCard(r))
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Search size={48} color={Colors.border} />
                                <Text style={styles.emptyText}>{t('home.noResults') || 'No restaurants found'}</Text>
                                <Text style={styles.emptySubtext}>{t('home.tryDifferent') || 'Try a different search term'}</Text>
                            </View>
                        )}

                        {/* Book Button at bottom */}
                        {filteredRestaurants.length > 0 && (
                            <TouchableOpacity
                                style={styles.bookSeatBtn}
                                onPress={() => {
                                    if (filteredRestaurants.length > 0) {
                                        handleRestaurantPress(filteredRestaurants[0]);
                                    }
                                }}
                            >
                                <Text style={styles.bookSeatBtnText}>{t('home.bookYourSeat') || 'BOOK YOUR SEAT'}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </>
        );
    }

    const renderPriceFilters = () => (
        <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('home.filters.priceRange') || 'Price Range'}</Text>
            <View style={styles.priceRow}>
                {[1, 2, 3, 4].map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.priceItem, priceRange.includes(p) && styles.priceItemSelected]}
                        onPress={() => {
                            setPriceRange(prev => prev.includes(p) ? prev.filter(v => v !== p) : [...prev, p]);
                        }}
                    >
                        <Text style={[styles.priceText, priceRange.includes(p) && styles.priceTextSelected]}>{'$'.repeat(p)}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderSortFilters = () => (
        <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('home.filters.sortBy') || 'Sort By'}</Text>
            <View style={styles.sortOptions}>
                {['rating', 'popularity', 'distance'].map(s => (
                    <TouchableOpacity
                        key={s}
                        style={[styles.sortOption, sortBy === s && styles.sortOptionSelected]}
                        onPress={() => setSortBy(s)}
                    >
                        <Text style={[styles.sortText, sortBy === s && styles.sortTextSelected]}>
                            {t(`home.filters.${s}`) || s}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <StatusBar barStyle="light-content" />

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

                {/* ── Empty State ────────────────────────────────────── */}
                {
                    !loading && filteredRestaurants.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Search size={48} color={Colors.border} />
                            <Text style={styles.emptyText}>{t('home.noResults') || 'No restaurants found'}</Text>
                            <Text style={styles.emptySubtext}>{t('home.tryAdjust') || 'Try adjusting your search'}</Text>
                        </View>
                    )
                }
                <View style={{ height: 120 }} />
            </Animated.ScrollView>

            {/* ── Surprise Me FAB ───────────────────────────────── */}
            <TouchableOpacity
                style={styles.fabSurprise}
                activeOpacity={0.85}
                onPress={handleSurpriseMe}
            >
                <LinearGradient
                    colors={['#8B1A10', '#D4483E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fabGradient}
                >
                    <Sparkles size={22} color="#FFF" />
                    <Text style={styles.fabText}>{t('home.surpriseMe') || 'Surprise Me'}</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Filter Modal */}
            <Modal visible={showFilters} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('home.filters.title') || 'Filters'}</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <X size={24} color={Colors.text} />
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
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <TouchableOpacity style={styles.locationItem}>
                                <MapPin size={20} color={Colors.primary} />
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
                                <X size={24} color={Colors.text} />
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
                                    <Bell size={36} color={Colors.border} />
                                    <Text style={styles.emptyText}>{t('home.notifications.empty') || 'No new notifications'}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#8B1A10',
    },
    scrollContent: {
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },

    // ── Gradient Header & Search ─────────────────────────
    gradientHeader: {
        paddingHorizontal: 20,
        paddingTop: 8,
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
        fontSize: 18,
        fontWeight: '800',
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
        backgroundColor: Colors.textMuted,
        marginHorizontal: 4,
    },
    floatingMapBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
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
        paddingVertical: 8,
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
        backgroundColor: `${Colors.primary}15`,
        borderColor: Colors.primary,
    },
    cuisineEmoji: {
        fontSize: 22,
    },
    cuisineLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textMuted,
        textAlign: 'center',
    },
    cuisineLabelSelected: {
        color: Colors.primary,
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
        color: Colors.text,
        letterSpacing: -0.3,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
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
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
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
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#F1F5F9', // Subtle border keeps it clean in vertical list
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
        color: Colors.text,
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
        color: Colors.textMuted,
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
        color: Colors.textMuted,
        fontWeight: '500',
        flex: 1,
    },
    quickBookRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    timeSlotBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    timeSlotText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text,
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
        color: Colors.text,
    },
    mapPreviewSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
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
        backgroundColor: '#FFF',
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
        borderBottomColor: Colors.border,
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
        color: Colors.text,
        marginBottom: 4,
    },
    searchCardCuisine: {
        fontSize: 12,
        color: Colors.textMuted,
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
        color: Colors.text,
    },
    searchCardDistance: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    searchCardAddress: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '500',
    },

    // ── Book Seat Button ─────────────────────────────────
    bookSeatBtn: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        ...Shadows.colored(Colors.primary),
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
        color: Colors.text,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textMuted,
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
        marginBottom: 30,
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
        color: Colors.text,
        fontWeight: '500',
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textMuted,
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
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
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
        color: Colors.text,
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
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceItemSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
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
        borderColor: Colors.border,
        justifyContent: 'center',
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    sortOptionSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    sortText: {
        fontSize: 16,
        color: Colors.text,
    },
    sortTextSelected: {
        color: '#FFF',
        fontWeight: '600',
    },
    applyBtn: {
        backgroundColor: Colors.primary,
        margin: 24,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },
    applyBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
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
        color: Colors.text,
        marginBottom: 4,
    },
    notificationBody: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    notificationTime: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    areaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    areaText: {
        fontSize: 16,
        color: Colors.text,
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
        color: Colors.textMuted,
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
        color: Colors.text,
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

    // ── Surprise Me FAB ──────────────────────────────────
    fabSurprise: {
        position: 'absolute',
        right: 20,
        bottom: 30, // Above tab bar conceptually, depending on SafeArea
        borderRadius: 30,
        ...Shadows.lg,
        elevation: 8,
        shadowColor: '#8B1A10',
    },
    fabGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    fabText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
