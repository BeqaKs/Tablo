import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Share,
    Animated,
    Easing,
    Dimensions,
    Image,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    PartyPopper, Check, CalendarPlus, Share2, ChevronRight,
    Clock, Users, MapPin, QrCode, Copy
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ka, enUS } from 'date-fns/locale';
import { Colors } from '../src/constants/Colors';
import { t } from '../src/localization/i18n';
import i18n from '../src/localization/i18n';
import { supabase } from '../src/services/supabase';

const { width } = Dimensions.get('window');
const CONFETTI_COLORS = ['#e11d48', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

function ConfettiPiece({ delay, color }: { delay: number; color: string }) {
    const fallAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const randomX = useRef(Math.random() * width).current;
    const randomSize = useRef(6 + Math.random() * 6).current;
    const isCircle = useRef(Math.random() > 0.5).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fallAnim, {
                    toValue: 1,
                    duration: 2500 + Math.random() * 2000,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 1500 + Math.random() * 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    const translateY = fallAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, Dimensions.get('window').height + 50],
    });
    const opacity = fallAnim.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 0.8, 0],
    });
    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', `${Math.random() * 720}deg`],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: randomX,
                top: -20,
                width: randomSize,
                height: randomSize,
                borderRadius: isCircle ? randomSize / 2 : 2,
                backgroundColor: color,
                transform: [{ translateY }, { rotate }],
                opacity,
            }}
        />
    );
}

export default function BookingConfirmedScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [showConfetti, setShowConfetti] = useState(true);
    const [copied, setCopied] = useState(false);
    const [status, setStatus] = useState<'pending' | 'confirmed' | 'seated' | 'cancelled'>(params.status as any || 'pending');
    const [loading, setLoading] = useState(!params.status);
    const scaleAnim = useRef(new Animated.Value(0)).current;

    const restaurant = (params.restaurant as string) || 'Restaurant';
    const date = (params.date as string) || '';
    const time = (params.time as string) || '';
    const guests = (params.guests as string) || '2';
    const bookingId = (params.id as string) || '';
    const address = (params.address as string) || '';
    const slug = (params.slug as string) || '';

    const locale = i18n.locale === 'ka' ? ka : enUS;
    const formattedDate = date ? format(new Date(date + 'T12:00:00'), 'EEE, MMM d, yyyy', { locale }) : '';
    const shortDate = date ? format(new Date(date + 'T12:00:00'), 'MMM d, yyyy', { locale }) : '—';

    useEffect(() => {
        // Entrance animation for the success icon
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
        }).start();

        // Fetch current status if not provided or to be fresh
        const fetchStatus = async () => {
            if (!bookingId) return;
            try {
                const { data, error } = await supabase
                    .from('reservations')
                    .select('status')
                    .eq('id', bookingId)
                    .single();
                if (data) setStatus(data.status);
            } catch (err) {
                console.error('Error fetching booking status:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();

        // Subscribe to real-time updates for this booking
        const subscription = supabase
            .channel(`booking-status-${bookingId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reservations',
                    filter: `id=eq.${bookingId}`,
                },
                (payload) => {
                    if (payload.new.status) {
                        setStatus(payload.new.status);
                    }
                }
            )
            .subscribe();

        // Stop confetti after 4 seconds
        const timer = setTimeout(() => setShowConfetti(false), 4500);
        return () => {
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, [bookingId]);

    const handleShare = async () => {
        const shareText = t('bookings.shareTemplate', {
            name: restaurant,
            date: formattedDate,
            time: time,
            guests: guests
        });
        try {
            await Share.share({
                message: shareText,
                title: t('bookings.shareTitle', { name: restaurant }),
            });
        } catch { }
    };

    const handleCopyId = () => {
        // In a real app we'd use expo-clipboard
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const qrUrl = bookingId
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`tablo://booking/${bookingId}`)}&color=1a1a2e&bgcolor=ffffff&margin=8`
        : '';

    return (
        <SafeAreaView style={styles.container}>
            {/* Confetti */}
            {showConfetti && (
                <View style={styles.confettiContainer}>
                    {Array.from({ length: 50 }).map((_, i) => (
                        <ConfettiPiece
                            key={i}
                            delay={Math.random() * 2500}
                            color={CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]}
                        />
                    ))}
                </View>
            )}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Header */}
                <View style={styles.successHeader}>
                    <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
                        <PartyPopper size={48} color={Colors.success} />
                        <View style={styles.checkBadge}>
                            <Check size={14} color="#FFF" strokeWidth={3} />
                        </View>
                    </Animated.View>
                    <Text style={styles.title}>
                        {status === 'pending' ? t('confirmedPage.pendingTitle') : t('confirmedPage.title')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {status === 'pending'
                            ? t('confirmedPage.pendingSubtitle', { restaurant })
                            : t('confirmedPage.subtitle', { restaurant })}
                    </Text>
                </View>

                {/* ===== BOARDING PASS TICKET ===== */}
                <View style={styles.ticket}>
                    {/* Gradient strip */}
                    <View style={styles.ticketStrip} />

                    {/* Restaurant header */}
                    <View style={styles.ticketHeader}>
                        <View style={styles.ticketHeaderLeft}>
                            <Text style={styles.ticketLabel}>{t('bookings.reservationAt')}</Text>
                            <Text style={styles.ticketRestaurant}>{restaurant}</Text>
                            {address ? (
                                <View style={styles.addressRow}>
                                    <MapPin size={11} color={Colors.textMuted} />
                                    <Text style={styles.addressText}>{address}</Text>
                                </View>
                            ) : null}
                        </View>
                        <View style={styles.ticketInitialCircle}>
                            <Text style={styles.ticketInitial}>{restaurant ? restaurant[0] : 'R'}</Text>
                        </View>
                    </View>

                    {/* Details grid */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>{t('restaurant.date')}</Text>
                            <Text style={styles.detailValue}>{shortDate}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>{t('restaurant.time')}</Text>
                            <Text style={styles.detailValue}>{time || '—'}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>{t('bookings.guests')}</Text>
                            <Text style={styles.detailValue}>{guests}</Text>
                        </View>
                    </View>

                    {/* Torn-edge divider */}
                    <View style={styles.tornEdge}>
                        <View style={[styles.tornCircle, styles.tornLeft]} />
                        <View style={[styles.tornCircle, styles.tornRight]} />
                        <View style={styles.dashedLine} />
                    </View>

                    {/* QR Code section */}
                    <View style={styles.qrSection}>
                        {qrUrl ? (
                            <View style={styles.qrRow}>
                                <View style={styles.qrInfo}>
                                    <View style={styles.qrLabelRow}>
                                        <QrCode size={12} color={Colors.textMuted} />
                                        <Text style={styles.qrLabel}>{t('confirmedPage.scanHostStand')}</Text>
                                    </View>
                                    <Text style={styles.bookingIdText}>
                                        #{bookingId.slice(0, 8).toUpperCase()}
                                    </Text>
                                    <View style={[styles.confirmedBadge, status === 'pending' && styles.pendingBadge]}>
                                        <View style={[styles.pulseDot, status === 'pending' && styles.pendingPulseDot]} />
                                        <Text style={[styles.confirmedText, status === 'pending' && styles.pendingText]}>
                                            {status === 'pending' ? t('bookings.status.pending') : t('bookings.status.confirmed')}
                                        </Text>
                                    </View>
                                </View>
                                <Image
                                    source={{ uri: qrUrl }}
                                    style={styles.qrImage}
                                    resizeMode="contain"
                                />
                            </View>
                        ) : (
                            <View style={styles.confirmedSimple}>
                                <View style={styles.confirmedIconBox}>
                                    <Check size={20} color={Colors.success} />
                                </View>
                                <View>
                                    <Text style={[styles.confirmedSimpleTitle, status === 'pending' && styles.pendingText]}>
                                        {status === 'pending' ? t('bookings.status.pending') : t('bookings.status.confirmed')}
                                    </Text>
                                    <Text style={styles.confirmedSimpleSub}>{t('confirmedPage.confirmationSent')}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleCopyId}>
                        {copied ? (
                            <Check size={18} color={Colors.success} />
                        ) : (
                            <CalendarPlus size={18} color={Colors.primary} />
                        )}
                        <Text style={styles.actionText}>
                            {copied ? t('common.copied') : t('confirmedPage.addToCalendar')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                        <Share2 size={18} color={Colors.primary} />
                        <Text style={styles.actionText}>{t('confirmedPage.inviteGuests')}</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.viewBookingsButton}
                    onPress={() => router.replace('/(tabs)/bookings')}
                >
                    <Text style={styles.viewBookingsText}>{t('confirmedPage.viewBookings')}</Text>
                    <ChevronRight size={18} color="#FFF" />
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    {t('confirmedPage.confirmationSent')}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    confettiContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        pointerEvents: 'none',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    // Success Header
    successHeader: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    checkBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.success,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
    subtitleBold: {
        fontWeight: '700',
        color: Colors.text,
    },
    // Ticket
    ticket: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 16,
    },
    ticketStrip: {
        height: 6,
        backgroundColor: Colors.primary,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
    },
    ticketHeaderLeft: {
        flex: 1,
    },
    ticketLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 2,
        marginBottom: 6,
    },
    ticketRestaurant: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 6,
    },
    addressText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    ticketInitialCircle: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: `${Colors.primary}18`,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    ticketInitial: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
    },
    detailsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingBottom: 20,
        gap: 16,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 2,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
    },
    // Torn edge
    tornEdge: {
        position: 'relative',
        paddingHorizontal: 24,
        height: 1,
    },
    tornCircle: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        top: -12,
        zIndex: 10,
    },
    tornLeft: {
        left: -12,
    },
    tornRight: {
        right: -12,
    },
    dashedLine: {
        borderTopWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#E2E8F0',
        marginHorizontal: 12,
    },
    // QR section
    qrSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 24,
    },
    qrRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qrInfo: {
        flex: 1,
    },
    qrLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    qrLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.textMuted,
        letterSpacing: 2,
    },
    bookingIdText: {
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        color: Colors.textMuted,
        fontWeight: '600',
        marginBottom: 10,
    },
    confirmedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#D1FAE5',
        borderRadius: 100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.success,
    },
    confirmedText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#047857',
    },
    pendingBadge: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FEF3C7',
    },
    pendingPulseDot: {
        backgroundColor: '#F59E0B',
    },
    pendingText: {
        color: '#B45309',
    },
    qrImage: {
        width: 96,
        height: 96,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    confirmedSimple: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    confirmedIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmedSimpleTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    confirmedSimpleSub: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    // Actions
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    viewBookingsButton: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
        marginBottom: 16,
    },
    viewBookingsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    footerNote: {
        fontSize: 13,
        color: Colors.textMuted,
        textAlign: 'center',
    },
});
