import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Platform,
    StatusBar
} from 'react-native';
import { Users, CalendarCheck, TrendingUp, Clock, Phone, ChevronRight, Flame, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/services/supabase';
import { cacheService } from '../../src/services/cache';
import { Colors } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { Reservation, Restaurant, Table } from '../../src/types/database';

export default function DashboardScreen() {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [stats, setStats] = useState({
        occupancy: 0,
        totalCapacity: 0,
        todayCovers: 0,
        recentCount: 0,
        waitlistCount: 0
    });
    const [waitlist, setWaitlist] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'reservations' | 'waitlist'>('reservations');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Attempt to load from cache first
            const cachedData = await cacheService.get<any>(`dashboard_${user.id}`);
            if (cachedData) {
                setRestaurant(cachedData.restaurant);
                setReservations(cachedData.reservations);
                setWaitlist(cachedData.waitlist);
                setStats(cachedData.stats);
                setLoading(false);
            }

            // 1. Fetch Restaurant
            const { data: restData, error: restError } = await supabase
                .from('restaurants')
                .select('*')
                .eq('owner_id', user.id)
                .single();

            if (restError) throw restError;
            setRestaurant(restData);

            if (restData) {
                // 2. Fetch Reservations for today
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const { data: resData, error: resError } = await supabase
                    .from('reservations')
                    .select('*')
                    .eq('restaurant_id', restData.id)
                    .gte('reservation_time', today.toISOString())
                    .lt('reservation_time', tomorrow.toISOString())
                    .order('reservation_time', { ascending: true });

                if (resError) throw resError;
                setReservations(resData || []);

                // 3. Fetch Tables for capacity
                const { data: tablesData } = await supabase
                    .from('tables')
                    .select('capacity')
                    .eq('restaurant_id', restData.id);

                const totalCap = (tablesData || []).reduce((sum, t) => sum + (t.capacity || 0), 0);
                const seated = (resData || []).filter(r => r.status === 'seated').reduce((sum, r) => sum + (r.guest_count || 0), 0);
                const covers = (resData || []).filter(r => r.status !== 'cancelled').reduce((sum, r) => sum + (r.guest_count || 0), 0);

                // 4. Fetch Waitlist
                const { data: waitListData, error: waitListError } = await supabase
                    .from('waitlist')
                    .select('*')
                    .eq('restaurant_id', restData.id)
                    .neq('status', 'cancelled')
                    .neq('status', 'expired')
                    .neq('status', 'claimed')
                    .order('created_at', { ascending: true });

                if (waitListError) throw waitListError;
                setWaitlist(waitListData || []);

                setStats({
                    occupancy: seated,
                    totalCapacity: totalCap,
                    todayCovers: covers,
                    recentCount: (resData || []).length,
                    waitlistCount: waitListData?.length || 0
                });

                // Cache all the valid data for the dashboard
                await cacheService.set(`dashboard_${user.id}`, {
                    restaurant: restData,
                    reservations: resData || [],
                    waitlist: waitListData || [],
                    stats: {
                        occupancy: seated,
                        totalCapacity: totalCap,
                        todayCovers: covers,
                        recentCount: (resData || []).length,
                        waitlistCount: waitListData?.length || 0
                    }
                });
            }
        } catch (error) {
            console.error('Dashboard Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleHitlist = async () => {
        if (!restaurant) return;
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ is_open: !restaurant.is_open })
                .eq('id', restaurant.id);

            if (error) throw error;
            setRestaurant({ ...restaurant, is_open: !restaurant.is_open });
        } catch (error) {
            console.error('Toggle Hitlist Error:', error);
        }
    };

    const updateWaitlistStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('waitlist')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Update Waitlist Status Error:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!restaurant) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Flame size={48} color={Colors.primary} style={{ marginBottom: 16 }} />
                    <Text style={styles.noRestTitle}>{t('dashboard.welcome')}</Text>
                    <Text style={styles.noRestSubtitle}>{t('dashboard.noRestaurant')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    const occupancyPercentage = stats.totalCapacity > 0 ? Math.round((stats.occupancy / stats.totalCapacity) * 100) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.restName}>{restaurant.name}</Text>
                    <Text style={styles.dateText}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>

                {/* KPI Grid */}
                <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, { borderLeftColor: Colors.primary }]}>
                        <View style={styles.kpiTop}>
                            <Text style={styles.kpiLabel}>{t('dashboard.occupancy')}</Text>
                            <Users size={16} color={Colors.primary} />
                        </View>
                        <Text style={styles.kpiValue}>{stats.occupancy} / {stats.totalCapacity}</Text>
                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { width: `${Math.min(occupancyPercentage, 100)}%` }]} />
                        </View>
                        <Text style={styles.kpiPct}>{occupancyPercentage}%</Text>
                    </View>

                    <View style={[styles.kpiCard, { borderLeftColor: '#8B5CF6' }]}>
                        <View style={styles.kpiTop}>
                            <Text style={styles.kpiLabel}>{t('dashboard.totalCovers')}</Text>
                            <Users size={16} color="#8B5CF6" />
                        </View>
                        <Text style={styles.kpiValue}>{stats.todayCovers}</Text>
                        <Text style={styles.kpiSub}>{t('dashboard.guestsArriving')}</Text>
                    </View>
                </View>

                <View style={styles.kpiGrid}>
                    <View style={[styles.kpiCard, { borderLeftColor: '#F59E0B' }]}>
                        <View style={styles.kpiTop}>
                            <Text style={styles.kpiLabel}>{t('dashboard.activeReservations')}</Text>
                            <CalendarCheck size={16} color="#F59E0B" />
                        </View>
                        <Text style={styles.kpiValue}>{reservations.length}</Text>
                        <Text style={styles.kpiSub}>{t('dashboard.upcomingSoon', { count: reservations.length })}</Text>
                    </View>

                    <View style={[styles.kpiCard, { borderLeftColor: '#10B981' }]}>
                        <View style={styles.kpiTop}>
                            <Text style={styles.kpiLabel}>{t('dashboard.estRevenue')}</Text>
                            <TrendingUp size={16} color="#10B981" />
                        </View>
                        <Text style={styles.kpiValue}>₾{stats.todayCovers * 85}</Text>
                        <Text style={styles.kpiSub}>{t('dashboard.avgCheck', { amount: '₾85' })}</Text>
                    </View>
                </View>

                {/* Hitlist Management */}
                <View style={styles.section}>
                    <View style={styles.hitlistCard}>
                        <View style={styles.hitlistInfo}>
                            <Sparkles size={24} color="#FBBF24" />
                            <View>
                                <Text style={styles.hitlistTitle}>{t('hitlist.title')}</Text>
                                <Text style={styles.hitlistDesc}>{t('hitlist.subtitle')}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.hitlistToggle, restaurant.is_open ? styles.hitlistActive : styles.hitlistInactive]}
                            onPress={toggleHitlist}
                        >
                            <Text style={styles.hitlistToggleText}>
                                {restaurant.is_open ? 'ACTIVE' : 'PROMOTE'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Tab Switcher */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reservations' && styles.activeTab]}
                        onPress={() => setActiveTab('reservations')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reservations' && styles.activeTabText]}>
                            Reservations ({reservations.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'waitlist' && styles.activeTab]}
                        onPress={() => setActiveTab('waitlist')}
                    >
                        <Text style={[styles.tabText, activeTab === 'waitlist' && styles.activeTabText]}>
                            Waitlist ({waitlist.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'reservations' ? (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Clock size={20} color={Colors.text} />
                            <Text style={styles.sectionTitle}>{t('dashboard.upcomingTitle')}</Text>
                        </View>

                        <View style={styles.resList}>
                            {reservations.length === 0 ? (
                                <View style={styles.emptyRes}>
                                    <Text style={styles.emptyText}>{t('dashboard.noUpcoming')}</Text>
                                </View>
                            ) : (
                                reservations.slice(0, 10).map((res) => (
                                    <View key={res.id} style={styles.resItem}>
                                        <View style={styles.tableBadge}>
                                            <Text style={styles.tableLabel}>TBL</Text>
                                            <Text style={styles.tableValue}>{res.table_id ? 'T' + res.table_id.slice(-2) : 'TBD'}</Text>
                                        </View>
                                        <View style={styles.resInfo}>
                                            <View style={styles.resRow}>
                                                <Text style={styles.guestName} numberOfLines={1}>{res.guest_name || 'Guest'}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(res.status || '') + '22' }]}>
                                                    <Text style={[styles.statusText, { color: getStatusColor(res.status || '') }]}>{(res.status || 'unknown').toUpperCase()}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.resDetailRow}>
                                                <Clock size={12} color={Colors.textMuted} />
                                                <Text style={styles.resDetailText}>{new Date(res.reservation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                                <View style={styles.dot} />
                                                <Text style={styles.resDetailText}>{t('dashboard.guests', { count: res.guest_count })}</Text>
                                            </View>
                                        </View>
                                        <ChevronRight size={16} color={Colors.textMuted} />
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                ) : (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Users size={20} color={Colors.text} />
                            <Text style={styles.sectionTitle}>Active Waitlist</Text>
                        </View>

                        <View style={styles.resList}>
                            {waitlist.length === 0 ? (
                                <View style={styles.emptyRes}>
                                    <Text style={styles.emptyText}>No one is currently on the waitlist.</Text>
                                </View>
                            ) : (
                                waitlist.map((item, index) => (
                                    <View key={item.id} style={styles.resItem}>
                                        <View style={styles.posBadge}>
                                            <Text style={styles.posValue}>#{index + 1}</Text>
                                        </View>
                                        <View style={styles.resInfo}>
                                            <View style={styles.resRow}>
                                                <Text style={styles.guestName} numberOfLines={1}>{item.guest_name}</Text>
                                                <View style={[styles.statusBadge, { backgroundColor: Colors.primary + '22' }]}>
                                                    <Text style={[styles.statusText, { color: Colors.primary }]}>{item.status.toUpperCase()}</Text>
                                                </View>
                                            </View>
                                            <View style={styles.resDetailRow}>
                                                <Phone size={12} color={Colors.textMuted} />
                                                <Text style={styles.resDetailText}>{item.guest_phone}</Text>
                                                <View style={styles.dot} />
                                                <Text style={styles.resDetailText}>{item.party_size} guests</Text>
                                            </View>
                                        </View>
                                        <View style={styles.actionRow}>
                                            <TouchableOpacity
                                                style={styles.notifyButton}
                                                onPress={() => updateWaitlistStatus(item.id, 'offered')}
                                            >
                                                <Text style={styles.notifyButtonText}>OFFER</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'confirmed': return '#3B82F6';
        case 'seated': return '#10B981';
        case 'completed': return '#8B5CF6';
        case 'cancelled': return '#EF4444';
        default: return '#F59E0B';
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 24,
    },
    restName: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    dateText: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
        fontWeight: '500',
    },
    noRestTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    noRestSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
    },
    kpiGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 16,
        borderLeftWidth: 3,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    kpiTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    kpiLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    kpiValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    kpiSub: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 4,
    },
    kpiPct: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '700',
        textAlign: 'right',
        marginTop: 4,
    },
    progressContainer: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    section: {
        marginTop: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    resList: {
        gap: 12,
    },
    resItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    tableBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tableLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.primary,
    },
    tableValue: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
    },
    resInfo: {
        flex: 1,
    },
    resRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    guestName: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '800',
    },
    resDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resDetailText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.border,
    },
    emptyRes: {
        paddingVertical: 40,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    hitlistCard: {
        backgroundColor: '#000',
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    hitlistInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    hitlistTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
    },
    hitlistDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    hitlistToggle: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    hitlistActive: {
        backgroundColor: '#10B981',
    },
    hitlistInactive: {
        backgroundColor: Colors.primary,
    },
    hitlistToggleText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 4,
        marginTop: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    activeTabText: {
        color: '#FFF',
    },
    posBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    posValue: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
    },
    actionRow: {
        justifyContent: 'center',
    },
    notifyButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    notifyButtonText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
    },
});
