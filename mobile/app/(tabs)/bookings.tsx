import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    Alert,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Users, MapPin, Clock, X, Share2 } from 'lucide-react-native';
import { format, isPast } from 'date-fns';
import { Colors, Shadows } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { Reservation, Restaurant } from '../../src/types/database';
import { useRouter } from 'expo-router';

type ExtendedReservation = Reservation & { restaurants: Restaurant };

export default function BookingsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');
    const [bookings, setBookings] = useState<ExtendedReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchBookings();
    }, [user, activeTab]);

    const fetchBookings = async () => {
        try {
            if (!refreshing) setLoading(true);
            const { data, error } = await supabase
                .from('reservations')
                .select('*, restaurants(*)')
                .eq('user_id', user?.id)
                .order('reservation_time', { ascending: activeTab === 'active' });

            if (error) throw error;
            setBookings(data || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleCancel = async (id: string, restaurantName: string) => {
        Alert.alert(
            t('bookings.cancelDialog.title') || 'Cancel Reservation?',
            (t('bookings.cancelDialog.message') || `Are you sure you want to cancel your reservation at ${restaurantName}?`).replace('{restaurant}', restaurantName),
            [
                { text: t('bookings.cancelDialog.keep') || 'Keep Reservation', style: 'cancel' },
                {
                    text: t('bookings.cancelDialog.confirm') || 'Yes, Cancel', style: 'destructive',
                    onPress: async () => {
                        setCancellingId(id);
                        try {
                            const { error } = await supabase
                                .from('reservations')
                                .update({ status: 'cancelled' })
                                .eq('id', id);
                            if (error) throw error;
                            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
                        } catch {
                            Alert.alert(t('common.error') || 'Error', 'Could not cancel this booking.');
                        }
                        setCancellingId(null);
                    },
                },
            ]
        );
    };

    const filteredBookings = bookings.filter(booking => {
        const isBookingPast = isPast(new Date(booking.reservation_time)) ||
            booking.status === 'cancelled' || booking.status === 'completed';
        return activeTab === 'past' ? isBookingPast : !isBookingPast;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: Colors.successSoft, color: Colors.success, label: t('bookings.status.confirmed') || 'Confirmed' };
            case 'pending': return { bg: '#FEF3C7', color: '#D97706', label: t('bookings.status.pending') || 'Pending' };
            case 'cancelled': return { bg: '#FEF2F2', color: Colors.error, label: t('bookings.status.cancelled') || 'Cancelled' };
            case 'seated': return { bg: Colors.primarySoft, color: Colors.primary, label: t('bookings.status.seated') || 'Seated' };
            case 'completed': return { bg: Colors.successSoft, color: Colors.success, label: t('bookings.status.completed') || 'Completed' };
            default: return { bg: Colors.surface, color: Colors.textMuted, label: status };
        }
    };

    const renderBookingCard = ({ item }: { item: ExtendedReservation }) => {
        const statusInfo = getStatusStyle(item.status || '');
        const isActive = activeTab === 'active';
        const isCancelling = cancellingId === item.id;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/restaurant/${item.restaurants.slug}`)}
                activeOpacity={0.9}
            >
                <View style={[styles.cardTopIndicator, { backgroundColor: statusInfo.color }]} />

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Image
                            source={{ uri: item.restaurants.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200' }}
                            style={styles.restaurantImage}
                        />
                        <View style={styles.cardInfo}>
                            <Text style={styles.restaurantName} numberOfLines={1}>{item.restaurants.name}</Text>
                            <View style={styles.locationRow}>
                                <MapPin size={12} color={Colors.textMuted} />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {item.restaurants.city || item.restaurants.address}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                {statusInfo.label}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconBox}>
                                <Calendar size={16} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>{t('bookings.confirmedPage.date') || 'Date'}</Text>
                                <Text style={styles.detailValue}>
                                    {format(new Date(item.reservation_time), 'MMM d')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconBox}>
                                <Clock size={16} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>{t('bookings.confirmedPage.time') || 'Time'}</Text>
                                <Text style={styles.detailValue}>
                                    {format(new Date(item.reservation_time), 'HH:mm')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.detailItem}>
                            <View style={styles.detailIconBox}>
                                <Users size={16} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.detailLabel}>{t('bookings.guests') || 'Guests'}</Text>
                                <Text style={styles.detailValue}>{item.guest_count}</Text>
                            </View>
                        </View>
                    </View>

                    {isActive && item.status !== 'cancelled' && (
                        <View style={styles.cardActions}>
                            <TouchableOpacity
                                style={styles.actionBtn}
                                onPress={() => handleCancel(item.id, item.restaurants.name)}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color={Colors.error} />
                                ) : (
                                    <>
                                        <X size={16} color={Colors.error} />
                                        <Text style={styles.actionCancelText}>{t('bookings.cancel') || 'Cancel'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <View style={styles.actionDivider} />
                            <TouchableOpacity style={styles.actionBtn} onPress={() => {
                                const msg = `I have a booking at ${item.restaurants.name}\n📅 ${format(new Date(item.reservation_time), 'EEE, MMM d')} at ${format(new Date(item.reservation_time), 'HH:mm')}\n👥 ${item.guest_count} guests`;
                                import('react-native').then(({ Share }) => {
                                    Share.share({ message: msg, title: `Booking at ${item.restaurants.name}` });
                                });
                            }}>
                                <Share2 size={16} color={Colors.primary} />
                                <Text style={styles.actionShareText}>{t('common.viewAll') && 'Share'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Calendar size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
                {activeTab === 'active' ? (t('bookings.empty.noActive') || 'No Upcoming Bookings') : (t('bookings.empty.noPast') || 'No Past Bookings')}
            </Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'active'
                    ? (t('bookings.empty.noActiveDesc') || 'When you book a table, it will appear here.')
                    : (t('bookings.empty.noPastDesc') || 'Your past dining experiences will be listed here.')}
            </Text>
            {activeTab === 'active' && (
                <TouchableOpacity style={styles.emptyCta} onPress={() => router.push('/(tabs)')}>
                    <Text style={styles.emptyCtaText}>{t('bookings.empty.cta') || 'Discover Restaurants'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, styles.centerAll]}>
                <View style={styles.emptyIconCircle}>
                    <Users size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('navigation.signIn') || 'Sign In'}</Text>
                <Text style={styles.emptySubtitle}>{t('profile.signInToManage') || 'Manage all your upcoming and past reservations in one place.'}</Text>
                <TouchableOpacity style={styles.primaryAuthButton} onPress={() => router.push('/(auth)/login')}>
                    <Text style={styles.primaryAuthButtonText}>{t('auth.signInButton')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('bookings.title') || 'My Bookings'}</Text>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                            {t('bookings.active') || 'Upcoming'}
                        </Text>
                        {activeTab === 'active' && filteredBookings.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{filteredBookings.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'past' && styles.activeTab]}
                        onPress={() => setActiveTab('past')}
                    >
                        <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
                            {t('bookings.past') || 'History'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerAll}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    renderItem={renderBookingCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchBookings(); }}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerAll: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 20,
        letterSpacing: -1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        padding: 4,
        borderRadius: 20,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        gap: 6,
    },
    activeTab: {
        backgroundColor: '#FFF',
        ...Shadows.sm,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textMuted,
    },
    activeTabText: {
        color: Colors.text,
    },
    badge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
        paddingBottom: 100, // Important: Space for floating tab bar
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginBottom: 20,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    cardTopIndicator: {
        height: 4,
        width: '100%',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    restaurantImage: {
        width: 60,
        height: 60,
        borderRadius: 16,
        marginRight: 16,
    },
    cardInfo: {
        flex: 1,
    },
    restaurantName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    locationText: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 16,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 11,
        color: Colors.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 16,
        marginTop: 4,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    actionDivider: {
        width: 1,
        height: '100%',
        backgroundColor: Colors.border,
    },
    actionCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.error,
    },
    actionShareText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    emptyCta: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        ...Shadows.sm,
    },
    emptyCtaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    primaryAuthButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },
    primaryAuthButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});
