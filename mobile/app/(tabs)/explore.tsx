import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    Platform,
    Dimensions,
    Animated,
    KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, Star, Filter, Heart, ChevronRight, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/services/supabase';
import { Restaurant } from '../../src/types/database';
import { Colors, Shadows } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { MapWrapper } from '../../src/components/MapWrapper';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_MARGIN = 16;

const CUISINES = [
    { id: 'georgian', label: 'Georgian', icon: '🥟' },
    { id: 'italian', label: 'Italian', icon: '🍕' },
    { id: 'japanese', label: 'Japanese', icon: '🍣' },
    { id: 'french', label: 'French', icon: '🥐' },
    { id: 'asian', label: 'Asian', icon: '🍜' },
    { id: 'veg', label: 'Vegetarian', icon: '🥗' },
];

export default function ExploreScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const mapRef = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [focusedRestaurantId, setFocusedRestaurantId] = useState<string | null>(null);

    // Entrance Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(50)).current;
    const slideDownAnim = useRef(new Animated.Value(-50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideUpAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.spring(slideDownAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();

        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .order('name');

            if (error) throw error;
            if (data) setRestaurants(data);
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate coords if missing for demo map
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

    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(r => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                r.name.toLowerCase().includes(searchLower) ||
                (r.cuisine_type && r.cuisine_type.toLowerCase().includes(searchLower)) ||
                (r.address && r.address.toLowerCase().includes(searchLower));

            const matchesCuisine = !selectedCuisine ||
                (r.cuisine_type && r.cuisine_type.toLowerCase().includes(selectedCuisine.toLowerCase()));

            return matchesSearch && matchesCuisine;
        });
    }, [restaurants, searchQuery, selectedCuisine]);

    const handleRestaurantPress = (restaurant: Restaurant) => {
        router.push({
            pathname: '/restaurant/[slug]',
            params: { slug: restaurant.slug }
        });
    };

    const handlePinPress = (restaurant: Restaurant, index: number) => {
        setFocusedRestaurantId(restaurant.id);
        flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    };

    const toggleWishlist = (id: string, e: any) => {
        e.stopPropagation();
        setWishlist(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderRestaurantCard = ({ item, index }: { item: Restaurant, index: number }) => (
        <TouchableOpacity
            style={[
                styles.card,
                focusedRestaurantId === item.id && styles.focusedCard
            ]}
            onPress={() => handleRestaurantPress(item)}
            activeOpacity={0.9}
        >
            <Image
                source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop' }}
                style={styles.cardImage}
            />
            <TouchableOpacity
                style={styles.cardWishlistBtn}
                onPress={(e) => toggleWishlist(item.id, e)}
            >
                <Heart
                    size={20}
                    color={wishlist.has(item.id) ? Colors.error : '#FFF'}
                    fill={wishlist.has(item.id) ? Colors.error : 'rgba(0,0,0,0.3)'}
                />
            </TouchableOpacity>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.cardRating}>
                        <Star size={14} color={Colors.warning} fill={Colors.warning} />
                        <Text style={styles.cardRatingText}>{(item as any).rating || 'New'}</Text>
                    </View>
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {item.cuisine_type} • {item.price_range || '$$'}
                </Text>

                <View style={styles.cardFooter}>
                    <View style={styles.cardLocation}>
                        <MapPin size={14} color={Colors.textMuted} />
                        <Text style={styles.cardLocationText} numberOfLines={1}>
                            {item.address}
                        </Text>
                    </View>
                    <View style={styles.bookButton}>
                        <Text style={styles.bookButtonText}>{t('home.hero.cta') || 'Book'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Full Screen Map */}
            <MapWrapper
                mapRef={mapRef}
                initialRegion={{
                    latitude: 41.7151,
                    longitude: 44.8271,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
                markers={filteredRestaurants.map((r, i) => {
                    const coord = restaurantCoords[r.id];
                    if (!coord) return null;
                    return {
                        id: r.id,
                        latitude: coord.lat,
                        longitude: coord.lng,
                        title: r.name,
                        description: r.cuisine_type,
                        onPress: () => handlePinPress(r, i),
                    };
                }).filter(Boolean) as any}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Top Overlay: Search & Filters */}
            <Animated.View
                style={[
                    styles.topOverlay,
                    {
                        paddingTop: Math.max(insets.top, 44),
                        opacity: fadeAnim,
                        transform: [{ translateY: slideDownAnim }]
                    }
                ]}
            >
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
                ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.95)' }]} />
                )}

                <View style={styles.searchContainer}>
                    <View style={styles.searchBar}>
                        <Search size={20} color={Colors.textMuted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('home.searchPlaceholderFull') || 'Search restaurants, cuisines...'}
                            placeholderTextColor={Colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                                <X size={18} color={Colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={CUISINES}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.cuisineList}
                    renderItem={({ item }) => {
                        const isSelected = selectedCuisine === item.id;
                        return (
                            <TouchableOpacity
                                style={[styles.cuisineChip, isSelected && styles.cuisineChipActive]}
                                onPress={() => setSelectedCuisine(isSelected ? null : item.id)}
                            >
                                <Text style={[styles.cuisineChipIcon, isSelected && styles.cuisineChipIconActive]}>
                                    {item.icon}
                                </Text>
                                <Text style={[styles.cuisineChipText, isSelected && styles.cuisineChipTextActive]}>
                                    {t(`home.cuisineFilters.${item.id}`) || item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </Animated.View>

            {/* Bottom Overlay: Restaurant Cards */}
            <Animated.View
                style={[
                    styles.bottomOverlay,
                    {
                        paddingBottom: Math.max(insets.bottom + 80, 100),
                        opacity: fadeAnim,
                        transform: [{ translateY: slideUpAnim }]
                    }
                ]}
            >
                {filteredRestaurants.length > 0 ? (
                    <FlatList
                        ref={flatListRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={filteredRestaurants}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.cardsList}
                        snapToInterval={CARD_WIDTH + CARD_MARGIN}
                        decelerationRate="fast"
                        onViewableItemsChanged={({ viewableItems }) => {
                            if (viewableItems.length > 0) {
                                const id = viewableItems[0].item.id;
                                setFocusedRestaurantId(id);
                                const coord = restaurantCoords[id];
                                if (coord && mapRef.current?.animateToRegion) {
                                    mapRef.current.animateToRegion({
                                        latitude: coord.lat,
                                        longitude: coord.lng,
                                        latitudeDelta: 0.02,
                                        longitudeDelta: 0.02,
                                    }, 500);
                                }
                            }
                        }}
                        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                        renderItem={renderRestaurantCard}
                    />
                ) : (
                    <View style={styles.noResultsCard}>
                        <Text style={styles.noResultsTitle}>{t('home.noResults') || 'No restaurants found'}</Text>
                        <Text style={styles.noResultsSubtitle}>{t('home.tryAdjust') || 'Try adjusting your search'}</Text>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        ...Shadows.sm,
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    clearBtn: {
        padding: 4,
    },
    cuisineList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    cuisineChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 6,
        ...Shadows.sm,
    },
    cuisineChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    cuisineChipIcon: {
        fontSize: 16,
    },
    cuisineChipIconActive: {
        opacity: 0.9,
    },
    cuisineChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    cuisineChipTextActive: {
        color: '#FFF',
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    cardsList: {
        paddingHorizontal: 20,
        paddingTop: 20,
        gap: CARD_MARGIN,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        ...Shadows.md,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    focusedCard: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    cardImage: {
        width: '100%',
        height: 140,
        backgroundColor: Colors.surface,
    },
    cardWishlistBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    cardRating: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    cardRatingText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginBottom: 12,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    cardLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
        marginRight: 16,
    },
    cardLocationText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
        flex: 1,
    },
    bookButton: {
        backgroundColor: Colors.primarySoft,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    bookButtonText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    noResultsCard: {
        marginHorizontal: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        ...Shadows.md,
    },
    noResultsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    noResultsSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
    },
});
