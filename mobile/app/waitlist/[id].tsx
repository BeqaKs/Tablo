import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Users, RefreshCw, XCircle } from 'lucide-react-native';
import { supabase } from '../../src/services/supabase';
import { Colors } from '../../src/constants/Colors';

export default function WaitlistStatusScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const infoFade = useRef(new Animated.Value(0)).current;
    const infoSlide = useRef(new Animated.Value(30)).current;

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
            Alert.alert('Error', 'Could not load waitlist status.');
        } finally {
            setLoading(false);
        }
    }

    const handleCancel = async () => {
        Alert.alert(
            'Cancel Waitlist',
            'Are you sure you want to leave the waitlist?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
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
                            Alert.alert('Error', 'Could not cancel at this time.');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!status) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Status not found</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Waitlist Status</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View style={[styles.statusCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.restaurantName}>{status.restaurants?.name}</Text>

                    <View style={styles.positionCircle}>
                        <Text style={styles.positionNumber}>#{status.position || '?'}</Text>
                        <Text style={styles.positionLabel}>in queue</Text>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Users size={20} color={Colors.primary} />
                            <Text style={styles.statValue}>{status.party_size}</Text>
                            <Text style={styles.statLabel}>Guests</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Clock size={20} color={Colors.primary} />
                            <Text style={styles.statValue}>~15m</Text>
                            <Text style={styles.statLabel}>Est. Wait</Text>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status.status) }]}>
                        <Text style={styles.statusText}>{status.status.toUpperCase()}</Text>
                    </View>
                </Animated.View>

                <Animated.View style={[styles.infoBox, { opacity: infoFade, transform: [{ translateY: infoSlide }] }]}>
                    <RefreshCw size={20} color={Colors.primary} />
                    <Text style={styles.infoText}>
                        This page updates automatically. We'll send you a notification when your table is ready!
                    </Text>
                </Animated.View>

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <XCircle size={20} color={Colors.error} />
                    <Text style={styles.cancelButtonText}>Leave Waitlist</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'offered': return Colors.success;
        case 'waiting': return Colors.primary;
        case 'cancelled':
        case 'expired': return Colors.textMuted;
        default: return Colors.primary;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: Colors.text,
        marginBottom: 16,
    },
    backLink: {
        color: Colors.primary,
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
        color: Colors.text,
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
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
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
        color: Colors.text,
        marginBottom: 32,
        textAlign: 'center',
    },
    positionCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 8,
        borderColor: Colors.primary,
        marginBottom: 32,
    },
    positionNumber: {
        fontSize: 42,
        fontWeight: '900',
        color: Colors.primary,
    },
    positionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMuted,
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
        color: Colors.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMuted,
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
        backgroundColor: Colors.secondary,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        gap: 16,
        marginBottom: 40,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
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
        color: Colors.error,
        fontSize: 16,
        fontWeight: '700',
    },
});
