import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Platform,
    StatusBar,
    Animated,
    ScrollView,
    Switch,
    FlatList,
    Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ChevronLeft, Star, MapPin, Clock, Users, Navigation, Flame,
    Heart, Share2, Wifi, UtensilsCrossed, ShoppingBag, ChevronDown, ChevronRight,
} from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { Restaurant } from '../../src/types/database';
import { Colors, Shadows } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { BookingModal } from '../../src/components/BookingModal';
import { Skeleton } from '../../src/components/Skeleton';
import { WaitlistModal } from '../../src/components/WaitlistModal';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 340;

// Sample menu data
const SAMPLE_MENU = {
    categories: ['Brunch', 'Appetizers', 'Main Course', 'Desserts', 'Drinks'],
    items: [
        { id: '1', name: 'Eggs Benedict', price: 14.99, cat: 'Brunch', img: 'https://images.unsplash.com/photo-1608039829572-9b1234ef409f?q=80&w=400&auto=format&fit=crop' },
        { id: '2', name: 'Avocado Toast', price: 12.49, cat: 'Brunch', img: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=400&auto=format&fit=crop' },
        { id: '3', name: 'Pancake Stack', price: 11.99, cat: 'Brunch', img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=400&auto=format&fit=crop' },
        { id: '4', name: 'French Toast', price: 13.49, cat: 'Brunch', img: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=400&auto=format&fit=crop' },
        { id: '5', name: 'Bruschetta', price: 9.99, cat: 'Appetizers', img: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?q=80&w=400&auto=format&fit=crop' },
        { id: '6', name: 'Caesar Salad', price: 11.49, cat: 'Appetizers', img: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=400&auto=format&fit=crop' },
        { id: '7', name: 'Grilled Salmon', price: 24.99, cat: 'Main Course', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=400&auto=format&fit=crop' },
        { id: '8', name: 'Filet Mignon', price: 34.99, cat: 'Main Course', img: 'https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=400&auto=format&fit=crop' },
        { id: '9', name: 'Tiramisu', price: 8.99, cat: 'Desserts', img: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=400&auto=format&fit=crop' },
        { id: '10', name: 'Mojito', price: 10.99, cat: 'Drinks', img: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=400&auto=format&fit=crop' },
    ]
};

// Sample reviews
const SAMPLE_REVIEWS = [
    { id: '1', name: 'Sarah Jenkins', initial: 'S', rating: 5.0, date: '2 days ago', body: '"Absolutely incredible experience. The truffle pasta was out of this world, and the service was impeccable. Highly recommend booking in advance!"' },
    { id: '2', name: 'Michael Chen', initial: 'M', rating: 4.5, date: '1 week ago', body: '"Great atmosphere and fantastic wine list. Only docking half a star because the wait for the table was a bit long even with a reservation. Still worth it."' },
    { id: '3', name: 'Emma Wilson', initial: 'E', rating: 5.0, date: '2 weeks ago', body: '"Best dining experience in Tbilisi! The chef\'s tasting menu was extraordinary. Can\'t wait to come back."' },
];

type TabType = 'overview' | 'menu' | 'review';

export default function RestaurantDetailScreen() {
    const { slug, booking, time, date, partySize } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [loading, setLoading] = useState(true);
    const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
    const [isWaitlistModalVisible, setIsWaitlistModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [hasVisited, setHasVisited] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedMenuCat, setSelectedMenuCat] = useState('Brunch');
    const [showHours, setShowHours] = useState(false);

    const scrollY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (slug) fetchRestaurant();
    }, [slug]);

    useEffect(() => {
        if (booking === 'true' && !loading && restaurant) {
            setIsBookingModalVisible(true);
        }
    }, [booking, loading, restaurant]);

    async function fetchRestaurant() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) throw error;
            setRestaurant(data);
        } catch (error) {
            console.error('Error fetching restaurant:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Skeleton height={HEADER_HEIGHT} borderRadius={0} />
                <View style={[styles.content, { marginTop: -32 }]}>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        <Skeleton width={80} height={28} borderRadius={100} />
                        <Skeleton width={60} height={28} borderRadius={100} />
                    </View>
                    <Skeleton width="80%" height={40} style={{ marginBottom: 16 }} />
                    <Skeleton width="60%" height={20} style={{ marginBottom: 32 }} />
                    <Skeleton height={1} style={{ marginBottom: 32 }} />
                    <Skeleton width="40%" height={24} style={{ marginBottom: 12 }} />
                    <Skeleton height={100} borderRadius={16} style={{ marginBottom: 24 }} />
                </View>
            </View>
        );
    }

    if (!restaurant) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('restaurant.notFound') || 'Restaurant not found'}</Text>
                <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={styles.backLinkBtn}>
                    <Text style={styles.backLink}>{t('restaurant.goBack') || 'Go Back'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const galleryImages = [
        restaurant.gallery_images?.[0] || restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop',
        ...(restaurant.gallery_images?.slice(1) || []),
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop',
    ];
    const totalImages = galleryImages.length;

    const matchPct = Math.min(99, Math.max(80, Math.floor((Number(restaurant.rating) || 4) * 20)));

    // Parallax  
    const imageTranslateY = scrollY.interpolate({
        inputRange: [-100, 0, HEADER_HEIGHT],
        outputRange: [-50, 0, HEADER_HEIGHT * 0.5],
        extrapolate: 'clamp',
    });
    const imageScale = scrollY.interpolate({
        inputRange: [-100, 0],
        outputRange: [1.5, 1],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp',
    });
    const headerBgOpacity = scrollY.interpolate({
        inputRange: [HEADER_HEIGHT - 100, HEADER_HEIGHT],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const menuItemsForCat = SAMPLE_MENU.items.filter(i => i.cat === selectedMenuCat);

    const timeSlots = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'];

    // ── Tab Content Renderers ───────────────────────────
    const renderOverviewTab = () => (
        <>
            {/* Have you visited? */}
            <View style={styles.visitedRow}>
                <Text style={styles.visitedText}>{t('restaurant.haveVisited') || 'Have you visited this restaurant?'}</Text>
                <Switch
                    value={hasVisited}
                    onValueChange={setHasVisited}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor="#FFF"
                />
            </View>

            {/* Service Chips */}
            <View style={styles.serviceChips}>
                <View style={styles.serviceChip}>
                    <UtensilsCrossed size={16} color={Colors.primary} />
                    <Text style={styles.serviceChipText}>{t('restaurant.dineIn') || 'Dine In'}</Text>
                </View>
                <View style={styles.serviceChip}>
                    <ShoppingBag size={16} color={Colors.primary} />
                    <Text style={styles.serviceChipText}>{t('restaurant.takeaway') || 'Takeaway'}</Text>
                </View>
                <View style={styles.serviceChip}>
                    <Wifi size={16} color={Colors.primary} />
                    <Text style={styles.serviceChipText}>{t('restaurant.freeWifi') || 'Free Wifi'}</Text>
                </View>
            </View>

            {/* Open Time */}
            <View style={styles.infoPanelSection}>
                <Text style={styles.infoPanelLabel}>{t('restaurant.openTime') || 'Open Time'}</Text>
                <TouchableOpacity
                    style={styles.openTimeRow}
                    onPress={() => setShowHours(!showHours)}
                >
                    <Clock size={16} color={Colors.primary} />
                    <Text style={styles.openTimeText}>08:00 AM - 10:00 PM</Text>
                    <ChevronDown size={16} color={Colors.textMuted} style={{ transform: [{ rotate: showHours ? '180deg' : '0deg' }] }} />
                </TouchableOpacity>
                {showHours && (
                    <View style={styles.hoursExpanded}>
                        {['Mon-Fri: 08:00 - 22:00', 'Sat: 10:00 - 23:00', 'Sun: 10:00 - 21:00'].map((h, i) => (
                            <Text key={i} style={styles.hoursText}>{h}</Text>
                        ))}
                    </View>
                )}
            </View>

            {/* Book For - Time Slots */}
            <View style={styles.infoPanelSection}>
                <Text style={styles.infoPanelLabel}>{t('restaurant.bookFor') || 'Book For'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeSlotsRow}>
                    {timeSlots.map((slot, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.timeSlotPill, idx === 1 && styles.timeSlotPillActive]}
                            onPress={() => {
                                setIsBookingModalVisible(true);
                            }}
                        >
                            <Text style={[styles.timeSlotText, idx === 1 && styles.timeSlotTextActive]}>{slot}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Address */}
            <View style={styles.infoPanelSection}>
                <View style={styles.addressRow}>
                    <MapPin size={16} color={Colors.primary} />
                    <Text style={styles.addressText}>{restaurant.address || '2 Rue François Mouthon, Tbilisi'}</Text>
                </View>
            </View>

            {/* About */}
            <View style={styles.aboutSection}>
                <Text style={styles.sectionTitle}>{t('restaurant.about') || 'About'}</Text>
                <Text style={styles.description}>{restaurant.description || 'A wonderful dining experience awaits you with our carefully curated menu and warm atmosphere.'}</Text>
            </View>

            {/* Need to Know */}
            <View style={styles.needToKnowSection}>
                <Text style={styles.sectionTitle}>{t('restaurant.goodToKnow') || 'Good to Know'}</Text>
                <View style={styles.policyCard}>
                    <View style={styles.policyRow}>
                        <View style={styles.policyIconBox}>
                            <Users size={18} color={Colors.primary} />
                        </View>
                        <View style={styles.policyTextContent}>
                            <Text style={styles.policyLabel}>{t('restaurant.dressCode') || 'Dress Code'}</Text>
                            <Text style={styles.policyValue}>{restaurant.dress_code || 'Smart Casual'}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </>
    );

    const renderMenuTab = () => (
        <>
            {/* Menu Category selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.menuCatRow}
            >
                {SAMPLE_MENU.categories.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.menuCatPill, selectedMenuCat === cat && styles.menuCatPillActive]}
                        onPress={() => setSelectedMenuCat(cat)}
                    >
                        <Text style={[styles.menuCatText, selectedMenuCat === cat && styles.menuCatTextActive]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Menu Items Grid - 2 columns like the video */}
            <View style={styles.menuGrid}>
                {menuItemsForCat.map(item => (
                    <TouchableOpacity key={item.id} style={styles.menuItem}>
                        <Image source={{ uri: item.img }} style={styles.menuItemImage} />
                        <View style={styles.menuItemInfo}>
                            <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {menuItemsForCat.length === 0 && (
                <View style={styles.emptyMenu}>
                    <UtensilsCrossed size={32} color={Colors.border} />
                    <Text style={styles.emptyMenuText}>{t('restaurant.noItemsInCategory') || 'No items in this category'}</Text>
                </View>
            )}
        </>
    );

    const renderReviewTab = () => (
        <>
            {/* Overall Rating */}
            <View style={styles.overallRatingContainer}>
                <Text style={styles.overallRatingScore}>{restaurant.rating || '4.8'}</Text>
                <View style={styles.overallRatingStars}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} size={18} color="#FBBF24" fill="#FBBF24" />
                    ))}
                </View>
                <Text style={styles.overallRatingCount}>{(t('restaurant.basedOnReviews') || 'Based on {{count}} reviews').replace('{{count}}', String(restaurant.review_count || 124))}</Text>
            </View>

            {/* Reviews List */}
            {SAMPLE_REVIEWS.map(review => (
                <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                            <View style={styles.reviewerAvatar}>
                                <Text style={styles.reviewerInitial}>{review.initial}</Text>
                            </View>
                            <View>
                                <Text style={styles.reviewerName}>{review.name}</Text>
                                <Text style={styles.reviewDate}>{review.date}</Text>
                            </View>
                        </View>
                        <View style={styles.reviewRatingBadge}>
                            <Star size={12} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                        </View>
                    </View>
                    <Text style={styles.reviewBody}>{review.body}</Text>
                </View>
            ))}
        </>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Top Navigation Bar with Blur */}
            <Animated.View style={[
                styles.floatingHeader,
                { paddingTop: Math.max(insets.top, 20), opacity: headerBgOpacity }
            ]}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
                ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.95)' }]} />
                )}
                <View style={styles.floatingHeaderContent}>
                    <Text style={styles.floatingHeaderTitle} numberOfLines={1}>{restaurant.name}</Text>
                </View>
            </Animated.View>

            {/* Back Button */}
            <TouchableOpacity
                style={[styles.backButton, { top: Math.max(insets.top, 20) + 10 }]}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            >
                <ChevronLeft size={24} color={Colors.text} />
            </TouchableOpacity>

            {/* Wishlist + Share buttons */}
            <View style={[styles.topRightActions, { top: Math.max(insets.top, 20) + 10 }]}>
                <TouchableOpacity style={styles.topActionBtn} onPress={() => setIsWishlisted(!isWishlisted)}>
                    <Heart size={20} color={isWishlisted ? '#E11D48' : '#FFF'} fill={isWishlisted ? '#E11D48' : 'transparent'} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.topActionBtn} onPress={() => {
                    Share.share({
                        message: `${restaurant.name} - ${restaurant.address || 'Tbilisi'} | Tablo`,
                        url: `https://tablo.ge/restaurant/${restaurant.slug}`,
                    });
                }}>
                    <Share2 size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
            >
                {/* Parallax Image Header with Gallery Counter */}
                <View style={styles.imageContainer}>
                    <Animated.Image
                        source={{ uri: galleryImages[currentImageIndex] }}
                        style={[
                            styles.image,
                            { transform: [{ translateY: imageTranslateY }, { scale: imageScale }] }
                        ]}
                    />
                    <View style={styles.imageGradientOverlay} />

                    {/* Image Counter */}
                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {String(currentImageIndex + 1).padStart(2, '0')}/{String(totalImages).padStart(2, '0')}
                        </Text>
                    </View>

                    {/* Image navigation dots */}
                    <View style={styles.imageDots}>
                        {galleryImages.slice(0, 5).map((_, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.imageDot, currentImageIndex === idx && styles.imageDotActive]}
                                onPress={() => setCurrentImageIndex(idx)}
                            />
                        ))}
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Restaurant Info Header */}
                    <View style={styles.restaurantHeader}>
                        <Text style={styles.name}>{restaurant.name}</Text>
                        <View style={styles.metaRow}>
                            <Star size={16} color="#FBBF24" fill="#FBBF24" />
                            <Text style={styles.ratingValue}>{restaurant.rating || '4.8'}</Text>
                            <Text style={styles.reviewCountText}>({restaurant.review_count || 125} {t('restaurant.reviewsLabel') || 'Reviews'})</Text>
                            <View style={styles.matchingBadge}>
                                <Text style={styles.matchingText}>{matchPct}% Matching</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {(['overview', 'menu', 'review'] as TabType[]).map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                    {tab === 'overview' ? (t('restaurant.tabOverview') || 'Overview')
                                        : tab === 'menu' ? (t('restaurant.tabMenu') || 'Menu')
                                            : (t('restaurant.tabReview') || 'Review')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'overview' && renderOverviewTab()}
                    {activeTab === 'menu' && renderMenuTab()}
                    {activeTab === 'review' && renderReviewTab()}

                    {/* Spacer for bottom button */}
                    <View style={{ height: 140 }} />
                </View>
            </Animated.ScrollView>

            {/* Floating Action Bar */}
            <View style={styles.floatingActionContainer}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFillObject} />
                ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.95)' }]} />
                )}
                <View style={styles.floatingActionBar}>
                    <TouchableOpacity
                        style={styles.waitlistButton}
                        onPress={() => setIsWaitlistModalVisible(true)}
                    >
                        <Clock size={20} color={Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => setIsBookingModalVisible(true)}
                    >
                        <Text style={styles.bookButtonText}>{t('home.bookYourSeat') || 'BOOK YOUR SEAT'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <BookingModal
                isVisible={isBookingModalVisible}
                onClose={() => setIsBookingModalVisible(false)}
                restaurant={restaurant}
                initialDate={date as string}
                initialTime={time as string}
                initialPartySize={partySize as string}
            />

            <WaitlistModal
                visible={isWaitlistModalVisible}
                onClose={() => setIsWaitlistModalVisible(false)}
                restaurant={restaurant}
                onJoined={(id) => console.log('Joined waitlist:', id)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
        fontWeight: '700',
    },
    backLinkBtn: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: Colors.surface,
        borderRadius: 20,
    },
    backLink: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },

    // ── Image Header ──────────────────────────────────
    imageContainer: {
        height: HEADER_HEIGHT,
        width: '100%',
        backgroundColor: Colors.surface,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageGradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    imageCounter: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    imageCounterText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    imageDots: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    imageDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    imageDotActive: {
        backgroundColor: '#FFF',
        width: 12,
    },

    // ── Floating Header ───────────────────────────────
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    floatingHeaderContent: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
    },
    floatingHeaderTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 11,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    topRightActions: {
        position: 'absolute',
        right: 20,
        zIndex: 11,
        flexDirection: 'row',
        gap: 10,
    },
    topActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Content ───────────────────────────────────────
    content: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -28,
        paddingHorizontal: 20,
        paddingTop: 24,
    },

    // ── Restaurant Header ─────────────────────────────
    restaurantHeader: {
        marginBottom: 20,
    },
    name: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    ratingValue: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
    },
    reviewCountText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    matchingBadge: {
        backgroundColor: '#10B981',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 4,
    },
    matchingText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },

    // ── Tab Bar ───────────────────────────────────────
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 20,
    },
    tabItem: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabItemActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: '800',
    },

    // ── Overview Tab ──────────────────────────────────
    visitedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 16,
    },
    visitedText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    serviceChips: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    serviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    serviceChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text,
    },
    infoPanelSection: {
        marginBottom: 20,
    },
    infoPanelLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    openTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.surface,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    openTimeText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    hoursExpanded: {
        marginTop: 8,
        paddingHorizontal: 14,
        gap: 6,
    },
    hoursText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    timeSlotsRow: {
        gap: 10,
    },
    timeSlotPill: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Colors.border,
        backgroundColor: '#FFF',
    },
    timeSlotPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    timeSlotText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    timeSlotTextActive: {
        color: '#FFF',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: Colors.surface,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    addressText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
        lineHeight: 20,
    },
    aboutSection: {
        marginBottom: 24,
    },
    needToKnowSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 14,
        letterSpacing: -0.3,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        color: Colors.textSecondary,
        fontWeight: '400',
    },
    policyCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    policyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    policyIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    policyTextContent: {
        flex: 1,
    },
    policyLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    policyValue: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },

    // ── Menu Tab ──────────────────────────────────────
    menuCatRow: {
        gap: 10,
        paddingBottom: 16,
    },
    menuCatPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    menuCatPillActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    menuCatText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    menuCatTextActive: {
        color: '#FFF',
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    menuItem: {
        width: (width - 52) / 2,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    menuItemImage: {
        width: '100%',
        height: 130,
    },
    menuItemInfo: {
        padding: 12,
    },
    menuItemName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    menuItemPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
    },
    emptyMenu: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyMenuText: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 12,
    },

    // ── Review Tab ────────────────────────────────────
    overallRatingContainer: {
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    overallRatingScore: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -1,
        marginBottom: 8,
    },
    overallRatingStars: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: 8,
    },
    overallRatingCount: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    reviewCard: {
        padding: 18,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 14,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reviewerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerInitial: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
    },
    reviewerName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    reviewRatingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    reviewRatingText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#D97706',
    },
    reviewBody: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 22,
    },

    // ── Floating Action Bar ───────────────────────────
    floatingActionContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    floatingActionBar: {
        flexDirection: 'row',
        gap: 12,
    },
    waitlistButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    bookButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.colored(Colors.primary),
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
