import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Users, RefreshCw, XCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/services/supabase';
import { useTheme } from '../../src/context/ThemeContext';
import { t } from '../../src/localization/i18n';

export default function WaitlistStatusScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const infoFade = useRef(new Animated.Value(0)).current;
    const infoSlide = useRef(new Animated.Value(30)).current;

    const styles = getStyles(colors);

    useEffect(() => {
        if (id) {
            fetchStatus();
            const subscription = supabase
                .channel(`waitlist:${id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'waitlist',
                        filter: `id=eq.${id}`,
                    },
                    (payload) => {
                        setStatus(payload.new);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, [id]);

    useEffect(() => {
        if (status) {
            Animated.stagger(200, [
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                    Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(infoFade, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(infoSlide, { toValue: 0, duration: 500, useNativeDriver: true }),
                ]),
            ]).start();
        }
    }, [status]);

    async function fetchStatus() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('waitlist')
                .select('*, restaurants(name)')
                .eq('id', id)
                .single();

            if (error) throw error;
            setStatus(data);
        } catch (error) {
            console.error('Error fetching waitlist status:', error);
            Alert.alert(t('common.error'), t('waitlist.errorLoad'));
        } finally {
            setLoading(false);
        }
    }

    const handleCancel = async () => {
        Alert.alert(
            t('waitlist.cancelTitle'),
            t('waitlist.cancelConfirm'),
            [
                { text: t('common.no'), style: 'cancel' },
                {
                    text: t('common.yes'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('waitlist')
                                .update({ status: 'cancelled' })
                                .eq('id', id);

                            if (error) throw error;
                            router.back();
                        } catch (error) {
                            Alert.alert(t('common.error'), t('waitlist.cancelError'));
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!status) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{t('waitlist.errorNotFound')}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'offered': return colors.success;
            case 'waiting': return colors.primary;
            case 'cancelled':
            case 'expired': return colors.textMuted;
            default: return colors.primary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('waitlist.statusTitle')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View style={[styles.statusCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.restaurantName}>{status.restaurants?.name}</Text>

                    <View style={styles.positionCircle}>
                        <Text style={styles.positionNumber}>#{status.position || '?'}</Text>
                        <Text style={styles.positionLabel}>{t('waitlist.inQueue')}</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Users size={20} color={colors.primary} />
                            <Text style={styles.statValue}>{status.party_size}</Text>
                            <Text style={styles.statLabel}>{t('common.guest')}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Clock size={20} color={colors.primary} />
                            <Text style={styles.statValue}>~15{t('common.minutesShort') || 'm'}</Text>
                            <Text style={styles.statLabel}>{t('waitlist.estWait')}</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status.status) }]}>
                        <Text style={styles.statusText}>{t(`waitlist.status.${status.status}`).toUpperCase()}</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.infoBox, { opacity: infoFade, transform: [{ translateY: infoSlide }] }]}>
                    <RefreshCw size={20} color={colors.primary} />
                    <Text style={styles.infoText}>
                        {t('waitlist.autoUpdateInfo')}
                    </Text>
                </Animated.View>

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <XCircle size={20} color={colors.error} />
                    <Text style={styles.cancelButtonText}>{t('waitlist.leaveWaitlist')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    errorText: {
        fontSize: 18,
        color: colors.text,
        marginBottom: 16,
    },
    backLink: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 56,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    statusCard: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        marginBottom: 24,
    },
    restaurantName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 32,
        textAlign: 'center',
    },
    positionCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 8,
        borderColor: colors.primary,
        marginBottom: 32,
    },
    positionNumber: {
        fontSize: 42,
        fontWeight: '900',
        color: colors.primary,
    },
    positionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        marginBottom: 32,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 100,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: colors.surface, // Changed from secondary for better consistency
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
        fontWeight: '500',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    cancelButtonText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: '700',
    },
});
