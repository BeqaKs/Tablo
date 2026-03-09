import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Clock, Users, MapPin, CheckCircle2, XCircle,
    Timer, Utensils
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/Colors';
import { supabase } from '../../src/services/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { t } from '../../src/localization/i18n';

// Countdown timer component
function CountdownTimer({ expiresAt }: { expiresAt: string }) {
    const [seconds, setSeconds] = useState(() =>
        Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    );

    useEffect(() => {
        if (seconds <= 0) return;
        const interval = setInterval(() => {
            setSeconds(s => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const expired = seconds <= 0;
    const urgent = seconds < 120;

    return (
        <View style={[styles.countdownBadge, expired ? styles.countdownExpired : urgent ? styles.countdownUrgent : styles.countdownActive]}>
            <Timer size={14} color={expired ? '#EF4444' : urgent ? '#D97706' : '#059669'} />
            <Text style={[styles.countdownText, { color: expired ? '#EF4444' : urgent ? '#D97706' : '#059669' }]}>
                {expired ? (t('common.closed') || 'Expired') : `${mins}:${String(secs).padStart(2, '0')}`}
            </Text>
        </View>
    );
}

export default function MyWaitlistScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);

    useEffect(() => {
        if (user) fetchWaitlist();
    }, [user]);

    const fetchWaitlist = async () => {
        try {
            if (!refreshing) setLoading(true);
            const { data, error } = await supabase
                .from('waitlist')
                .select('*, restaurants(name, address, slug)')
                .eq('user_id', user?.id)
                .in('status', ['waiting', 'offered'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (error) {
            console.error('Error fetching waitlist:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleLeave = async (id: string) => {
        Alert.alert(
            t('waitlist.leaveWaitlist') || 'Leave Waitlist',
            t('waitlist.leaveQueueConfirm') || 'Are you sure you want to leave this queue?',
            [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('waitlist.leaveQueue') || 'Leave', style: 'destructive', onPress: async () => {
                        setActingId(id);
                        try {
                            const { error } = await supabase
                                .from('waitlist')
                                .update({ status: 'cancelled' })
                                .eq('id', id);
                            if (error) throw error;
                            setEntries(prev => prev.filter(e => e.id !== id));
                        } catch (error) {
                            Alert.alert(t('common.error') || 'Error', t('waitlist.cancelError') || 'Could not leave the waitlist.');
                        }
                        setActingId(null);
                    },
                },
            ]
        );
    };

    const handleClaim = async (id: string, restaurantSlug: string) => {
        setActingId(id);
        try {
            const { error } = await supabase
                .from('waitlist')
                .update({ status: 'claimed' })
                .eq('id', id);
            if (error) throw error;
            Alert.alert(t('waitlist.claimSuccess') || 'Spot Claimed!', t('waitlist.claimSuccessDesc') || 'Your table is ready. Head to the host stand.');
            setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'claimed' } : e));

            // Wait briefly before refreshing or let the user navigate
            setTimeout(() => {
                fetchWaitlist();
            }, 2000);
        } catch (error) {
            Alert.alert(t('common.error') || 'Error', t('waitlist.errorClaim') || 'Could not claim this spot.');
            setActingId(null);
        }
    };

    const renderEntry = ({ item }: { item: any }) => {
        const restaurant = Array.isArray(item.restaurants) ? item.restaurants[0] : item.restaurants;
        const isOffered = item.status === 'offered';
        const timeStr = item.requested_time
            ? new Date(item.requested_time).toLocaleString(t('common.locale') === 'ka' ? 'ka-GE' : 'en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
            })
            : '';

        return (
            <TouchableOpacity
                style={[styles.card, isOffered && styles.cardOffered]}
                activeOpacity={0.9}
                onPress={() => router.push(`/restaurant/${restaurant?.slug}`)}
            >
                {/* Offered banner */}
                {isOffered && (
                    <View style={styles.offeredBanner}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                            <CheckCircle2 size={18} color="#FFF" />
                            <Text style={styles.offeredBannerText}>{t('waitlist.successDesc') || 'Your table is ready!'}</Text>
                        </View>
                        {item.expires_at && <CountdownTimer expiresAt={item.expires_at} />}
                    </View>
                )}

                {!isOffered && (
                    <View style={styles.cardTopStrip} />
                )}

                <View style={styles.cardBody}>
                    <View style={styles.cardHeader}>
                        <View style={styles.nameRow}>
                            <Text style={styles.restaurantName} numberOfLines={1}>{restaurant?.name || 'Restaurant'}</Text>
                            <View style={[styles.statusBadge, isOffered ? styles.badgeOffered : styles.badgeWaiting]}>
                                <Text style={[styles.statusText, isOffered ? styles.statusOffered : styles.statusWaiting]}>
                                    {isOffered ? t('waitlist.actionRequired') : t('waitlist.inQueueLabel', { pos: item.position ?? '?' })}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.detailsRow}>
                            {timeStr ? (
                                <View style={styles.detailChip}>
                                    <View style={styles.detailIconBox}>
                                        <Clock size={14} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.detailText}>{timeStr}</Text>
                                </View>
                            ) : null}
                            <View style={styles.detailChip}>
                                <View style={styles.detailIconBox}>
                                    <Users size={14} color={Colors.primary} />
                                </View>
                                <Text style={styles.detailText}>{t('dashboard.guests', { count: item.party_size })}</Text>
                            </View>
                            {restaurant?.address ? (
                                <View style={styles.detailChip}>
                                    <View style={styles.detailIconBox}>
                                        <MapPin size={14} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.detailText} numberOfLines={1}>{restaurant.address}</Text>
                                </View>
                            ) : null}
                        </View>

                        {item.quoted_wait_time != null && !isOffered && (
                            <View style={styles.waitTimeBadge}>
                                <Timer size={14} color="#D97706" />
                                <Text style={styles.waitTimeText}>
                                    {(t('waitlist.estimatedWait') || 'Estimated wait: {mins} mins').replace('{mins}', item.quoted_wait_time)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsRow}>
                        {isOffered && (
                            <TouchableOpacity
                                style={styles.claimButton}
                                onPress={() => handleClaim(item.id, restaurant?.slug)}
                                disabled={actingId === item.id}
                            >
                                {actingId === item.id ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <CheckCircle2 size={18} color="#FFF" />
                                        <Text style={styles.claimButtonText}>{t('waitlist.confirmWaitlist') || 'Claim Table'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.leaveButton, isOffered && styles.leaveButtonFlex]}
                            onPress={() => handleLeave(item.id)}
                            disabled={actingId === item.id}
                        >
                            <XCircle size={16} color={Colors.error} />
                            <Text style={styles.leaveButtonText}>{t('waitlist.leaveQueue') || 'Leave Queue'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Clock size={32} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>{t('waitlist.noActive') || 'No Active Waitlists'}</Text>
            <Text style={styles.emptySubtitle}>{t('waitlist.noActiveDesc') || "You're not currently waiting for any tables."}</Text>
            <TouchableOpacity style={styles.primaryCta} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.primaryCtaText}>{t('waitlist.findRestaurant') || 'Find a Restaurant'}</Text>
            </TouchableOpacity>
        </View>
    );

    if (!user) {
        return (
            <SafeAreaView style={[styles.container, styles.centerAll]}>
                <View style={styles.emptyIconCircle}>
                    <Clock size={32} color={Colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>{t('waitlist.signInRequired') || 'Sign In Required'}</Text>
                <Text style={styles.emptySubtitle}>{t('waitlist.signInDesc') || 'Sign in to view and join restaurant waitlists.'}</Text>
                <TouchableOpacity style={styles.primaryAuthButton} onPress={() => router.push('/(auth)/login')}>
                    <Text style={styles.primaryAuthButtonText}>{t('auth.signInButton')}</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('waitlist.screenTitle') || 'My Waitlist'}</Text>
                <Text style={styles.headerSubtitle}>{t('waitlist.screenSubtitle') || 'Real-time updates on your table status.'}</Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centerAll}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={entries}
                    renderItem={renderEntry}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchWaitlist(); }}
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
        paddingBottom: 16,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
        paddingBottom: 100, // Space for floating tab bar
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardTopStrip: {
        height: 4,
        backgroundColor: Colors.border,
    },
    cardOffered: {
        borderColor: Colors.success,
        ...Shadows.md,
        shadowColor: Colors.success,
    },
    offeredBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.success,
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    offeredBannerText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    cardBody: {
        padding: 20,
    },
    cardHeader: {
        marginBottom: 16,
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    restaurantName: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        flex: 1,
        letterSpacing: -0.5,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
    },
    badgeOffered: {
        backgroundColor: '#FFF', // Contrast against the offered banner or background
    },
    badgeWaiting: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    statusOffered: {
        color: Colors.success,
    },
    statusWaiting: {
        color: Colors.textMuted,
    },
    detailsRow: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderRadius: 16,
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailIconBox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '600',
    },
    waitTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    waitTimeText: {
        fontSize: 14,
        color: '#D97706',
        fontWeight: '800',
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    countdownActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    countdownUrgent: { backgroundColor: 'rgba(255,255,255,0.3)' },
    countdownExpired: { backgroundColor: 'rgba(255,255,255,0.4)' },
    countdownText: { fontSize: 13, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 16,
    },
    claimButton: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.success,
        height: 56,
        borderRadius: 28,
        ...Shadows.sm,
    },
    claimButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 56,
        paddingHorizontal: 20,
        borderRadius: 28,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    leaveButtonFlex: {
        flex: 1,
    },
    leaveButtonText: {
        color: Colors.error,
        fontSize: 15,
        fontWeight: '700',
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
        paddingHorizontal: 40,
    },
    primaryCta: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        ...Shadows.sm,
    },
    primaryCtaText: {
        fontSize: 16,
        fontWeight: '800',
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
