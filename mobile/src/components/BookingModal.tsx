import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Platform,
    ActivityIndicator,
    Image as RNImage,
    Animated,
    Alert
} from 'react-native';
import { X, Calendar, Clock, Users, ArrowRight, CheckCircle2, Minus, Plus } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../constants/Colors';
import { t } from '../localization/i18n';
import { PartySizeSelector } from './PartySizeSelector';
import { TableSelector } from './TableSelector';
import { Restaurant, Table } from '../types/database';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { FloorPlan } from './FloorPlan';
import { BlurView } from 'expo-blur';

interface BookingModalProps {
    isVisible: boolean;
    onClose: () => void;
    restaurant: Restaurant;
    initialDate?: string;
    initialTime?: string;
    initialPartySize?: string;
}

type BookingStep = 'selection' | 'table' | 'menu' | 'floorplan' | 'confirmation' | 'success';

export interface PreOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface MenuCategory {
    id: string;
    name: string;
}

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category_id: string;
    is_available: boolean;
    image_url?: string | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
    isVisible,
    onClose,
    restaurant,
    initialDate,
    initialTime,
    initialPartySize
}) => {
    const [step, setStep] = useState<BookingStep>('selection');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(() => {
        const d = new Date();
        d.setHours(19, 0, 0, 0);
        return d;
    });
    const [partySize, setPartySize] = useState(2);
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
    const [loadingTables, setLoadingTables] = useState(false);
    const [bookingLoading, setBookingLoading] = useState(false);

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<MenuCategory[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(false);

    const { user } = useAuth();
    const confirmRouter = useRouter();

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

    // Menu Pre-order State
    const [preOrderItems, setPreOrderItems] = useState<PreOrderItem[]>([]);

    // Animations
    const successScale = useRef(new Animated.Value(0.8)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;

    // Initialize from props
    useEffect(() => {
        if (isVisible) {
            if (initialDate) setSelectedDate(new Date(initialDate));
            if (initialTime) {
                const [hours, minutes] = initialTime.split(':');
                const d = new Date();
                d.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                setSelectedTime(d);
            }
            if (initialPartySize) setPartySize(parseInt(initialPartySize));

            fetchMenu();
        }
    }, [isVisible, initialDate, initialTime, initialPartySize]);

    useEffect(() => {
        if (step === 'success') {
            Animated.parallel([
                Animated.spring(successScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.timing(successOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            successScale.setValue(0.8);
            successOpacity.setValue(0);
        }
    }, [step]);

    async function fetchMenu() {
        try {
            setLoadingMenu(true);
            const { data: catData } = await supabase
                .from('menu_categories')
                .select('*')
                .eq('restaurant_id', restaurant.id);

            const { data: itemData } = await supabase
                .from('menu_items')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('is_available', true);

            setCategories(catData || []);
            setMenuItems(itemData || []);
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoadingMenu(false);
        }
    }

    // Derived state for cart total
    const cartTotal = preOrderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const handleDateConfirm = (date: Date) => {
        setSelectedDate(date);
        setDatePickerVisibility(false);
    };

    const handleTimeConfirm = (time: Date) => {
        setSelectedTime(time);
        setTimePickerVisibility(false);
    };

    const resetAndClose = () => {
        setStep('selection');
        setSelectedTableId(undefined);
        setPreOrderItems([]);
        onClose();
    };

    const fetchAvailableTables = async () => {
        try {
            setLoadingTables(true);
            const { data, error } = await supabase
                .from('tables')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .gte('capacity', partySize);

            if (error) throw error;

            setTables(data || []);
            setStep('table');
        } catch (error) {
            console.error('Error fetching tables:', error);
            Alert.alert(t('common.error'), 'Could not fetch tables.');
        } finally {
            setLoadingTables(false);
        }
    };

    const handleBooking = async () => {
        if (!user) {
            Alert.alert("Sign in required", "Please sign in to make a reservation.");
            return;
        }

        if (!selectedTableId) return;

        try {
            setBookingLoading(true);

            const reservationTime = new Date(selectedDate);
            reservationTime.setHours(selectedTime.getHours());
            reservationTime.setMinutes(selectedTime.getMinutes());

            const endTime = new Date(reservationTime);
            endTime.setMinutes(endTime.getMinutes() + (restaurant.turn_duration_minutes || 90));

            // Format pre-order notes if items exist
            let orderNotes = '';
            if (preOrderItems.length > 0) {
                const orderLines = preOrderItems
                    .map(item => `${item.quantity}x ${item.name} ($${item.price * item.quantity})`)
                    .join('\n');
                orderNotes = `\n\n--- PRE-ORDER ---\n${orderLines}\nTotal: $${cartTotal}`;
            }

            const { data: bookingData, error } = await supabase
                .from('reservations')
                .insert({
                    restaurant_id: restaurant.id,
                    user_id: user.id,
                    table_id: selectedTableId,
                    guest_count: partySize,
                    reservation_time: reservationTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'confirmed',
                    attendance_status: 'pending',
                    guest_name: user.user_metadata?.full_name || user.email || 'Guest',
                    guest_notes: orderNotes.trim() || null,
                })
                .select('id')
                .single();

            if (error) throw error;

            resetAndClose();
            confirmRouter.push({
                pathname: '/booking-confirmed',
                params: {
                    restaurant: restaurant.name,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    time: format(selectedTime, 'HH:mm'),
                    guests: String(partySize),
                    id: bookingData?.id || '',
                    address: restaurant.address || '',
                    slug: restaurant.slug || '',
                },
            });
        } catch (error) {
            console.error('Error creating booking:', error);
            Alert.alert(t('common.error'), 'Failed to create reservation. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    const updatePreOrderItem = (item: MenuItem, delta: number) => {
        setPreOrderItems(prev => {
            const existing = prev.find(p => p.id === item.id);
            if (existing) {
                const newQuantity = existing.quantity + delta;
                if (newQuantity <= 0) {
                    return prev.filter(p => p.id !== item.id);
                }
                return prev.map(p => p.id === item.id ? { ...p, quantity: newQuantity } : p);
            } else if (delta > 0) {
                return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
            }
            return prev;
        });
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={resetAndClose}
        >
            <View style={styles.container}>
                {/* Drag Handle Indicator */}
                <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {step === 'selection' ? t('restaurant.makeReservation') :
                            step === 'menu' ? 'Menu' :
                                step === 'floorplan' ? 'Select Table' :
                                    step === 'table' ? t('restaurant.chooseTable') :
                                        t('bookings.status.confirmed')}
                    </Text>
                    <View style={{ width: 44 }} />
                </View>

                {step === 'selection' ? (
                    <View style={styles.content}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                            {/* Summary Box styling upgraded for premium feel */}
                            <View style={styles.summaryBox}>
                                <View style={styles.summaryHeader}>
                                    <View style={styles.summaryDot} />
                                    <Text style={styles.summaryRestaurant}>{restaurant.name}</Text>
                                </View>
                                <Text style={styles.summaryText} numberOfLines={2}>
                                    {format(selectedDate, 'EEEE, MMMM d')} at {format(selectedTime, 'HH:mm')}
                                </Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>{t('bookings.guests')}</Text>
                                <PartySizeSelector
                                    selectedSize={partySize}
                                    onSelect={setPartySize}
                                />
                            </View>

                            <View style={styles.selectionGrid}>
                                <TouchableOpacity
                                    style={styles.selectionCard}
                                    onPress={() => {
                                        if (Platform.OS === 'web') handleDateConfirm(new Date());
                                        else setDatePickerVisibility(true);
                                    }}
                                >
                                    <View style={styles.iconCircle}>
                                        <Calendar size={20} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.cardLabel}>{t('restaurant.date')}</Text>
                                        <Text style={styles.cardValue}>{format(selectedDate, 'MMM d, yyyy')}</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.selectionCard}
                                    onPress={() => {
                                        if (Platform.OS === 'web') {
                                            const dinnerTime = new Date();
                                            dinnerTime.setHours(19, 0, 0);
                                            handleTimeConfirm(dinnerTime);
                                        } else setTimePickerVisibility(true);
                                    }}
                                >
                                    <View style={styles.iconCircle}>
                                        <Clock size={20} color={Colors.primary} />
                                    </View>
                                    <View>
                                        <Text style={styles.cardLabel}>{t('restaurant.time')}</Text>
                                        <Text style={styles.cardValue}>{format(selectedTime, 'HH:mm')}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={fetchAvailableTables}
                                disabled={loadingTables}
                            >
                                {loadingTables ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>{t('common.next') || 'Find a Table'}</Text>
                                        <ArrowRight size={20} color="#FFF" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : step === 'menu' ? (
                    <View style={styles.content}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                            <View style={styles.menuIntro}>
                                <Text style={styles.menuIntroTitle}>Pre-order from Menu</Text>
                                <Text style={styles.menuIntroSubtitle}>Select items you'd like to have ready when you arrive. You can also skip this step.</Text>
                            </View>

                            {loadingMenu ? (
                                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                            ) : categories.length > 0 ? (
                                categories.map(category => (
                                    <View key={category.id} style={{ marginBottom: 32 }}>
                                        <Text style={styles.categoryTitle}>{category.name}</Text>
                                        <View style={styles.menuGrid}>
                                            {menuItems
                                                .filter(item => item.category_id === category.id)
                                                .map(item => {
                                                    const cartItem = preOrderItems.find(p => p.id === item.id);
                                                    const qty = cartItem ? cartItem.quantity : 0;
                                                    return (
                                                        <View key={item.id} style={styles.premiumMenuItem}>
                                                            <View style={styles.menuItemFlex}>
                                                                <View style={styles.menuItemInfo}>
                                                                    <Text style={styles.menuItemName}>{item.name}</Text>
                                                                    <Text style={styles.menuItemDesc} numberOfLines={2}>{item.description}</Text>
                                                                    <Text style={styles.menuItemPrice}>${item.price}</Text>
                                                                </View>
                                                                {item.image_url && (
                                                                    <RNImage source={{ uri: item.image_url }} style={styles.menuItemImage} />
                                                                )}
                                                            </View>

                                                            <View style={styles.premiumQuantityControls}>
                                                                {qty > 0 ? (
                                                                    <View style={styles.qtyActiveContainer}>
                                                                        <TouchableOpacity style={styles.qtyBtnPremium} onPress={() => updatePreOrderItem(item, -1)}>
                                                                            <Minus size={18} color={Colors.text} />
                                                                        </TouchableOpacity>
                                                                        <Text style={styles.qtyTextPremium}>{qty}</Text>
                                                                        <TouchableOpacity style={styles.qtyBtnPremium} onPress={() => updatePreOrderItem(item, 1)}>
                                                                            <Plus size={18} color={Colors.text} />
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                ) : (
                                                                    <TouchableOpacity
                                                                        style={styles.addBtnPremium}
                                                                        onPress={() => updatePreOrderItem(item, 1)}
                                                                    >
                                                                        <Plus size={18} color={Colors.primary} />
                                                                        <Text style={styles.addBtnText}>Add</Text>
                                                                    </TouchableOpacity>
                                                                )}
                                                            </View>
                                                        </View>
                                                    );
                                                })}
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptySubtext}>No menu items available for pre-order.</Text>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.footerPremium}>
                            {cartTotal > 0 && (
                                <View style={styles.cartSummaryRow}>
                                    <View>
                                        <Text style={styles.cartCountText}>{preOrderItems.reduce((a, b) => a + b.quantity, 0)} items selected</Text>
                                        <Text style={styles.cartTotalText}>Total: ${cartTotal.toFixed(2)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.confirmPreorderBtn}
                                        onPress={handleBooking}
                                        disabled={bookingLoading}
                                    >
                                        {bookingLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.confirmPreorderBtnText}>Confirm Booking</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}

                            {cartTotal === 0 && (
                                <View style={styles.skipRow}>
                                    <TouchableOpacity
                                        style={styles.backBtnSecondary}
                                        onPress={() => setStep('table')}
                                    >
                                        <Text style={styles.backBtnSecondaryText}>Back</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.skipBtnPrimary}
                                        onPress={handleBooking}
                                        disabled={bookingLoading}
                                    >
                                        {bookingLoading ? (
                                            <ActivityIndicator color="#FFF" />
                                        ) : (
                                            <Text style={styles.skipBtnPrimaryText}>Skip & Confirm</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </View>
                ) : step === 'table' ? (
                    <View style={styles.content}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                            <View style={styles.section}>
                                {/* Floor Plan Toggle */}
                                <View style={styles.viewToggleContainer}>
                                    <TouchableOpacity
                                        style={styles.viewToggleButton}
                                        onPress={() => setStep('floorplan')}
                                    >
                                        <Text style={styles.viewToggleButtonText}>Switch to Floor Plan</Text>
                                    </TouchableOpacity>
                                </View>

                                <TableSelector
                                    tables={tables}
                                    selectedTableId={selectedTableId}
                                    onSelect={setSelectedTableId}
                                />
                                {tables.length === 0 && !loadingTables && (
                                    <View style={styles.noTablesContainer}>
                                        <Text style={styles.noTablesText}>
                                            No tables available for {partySize} guests at this time.
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.secondaryButtonInline}
                                            onPress={() => setStep('selection')}
                                        >
                                            <Text style={styles.secondaryButtonInlineText}>Change Time or Guests</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <View style={styles.footerRow}>
                                <TouchableOpacity
                                    style={styles.backButtonInline}
                                    onPress={() => setStep('selection')}
                                >
                                    <Text style={styles.backButtonText}>{t('common.back')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryButton, { flex: 2 }, !selectedTableId && styles.disabledButton]}
                                    onPress={() => setStep('menu')}
                                    disabled={!selectedTableId}
                                >
                                    <Text style={styles.primaryButtonText}>Continue to Menu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : step === 'floorplan' ? (
                    <View style={styles.content}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                            <View style={styles.section}>
                                {/* Floor Plan Toggle */}
                                <View style={styles.viewToggleContainer}>
                                    <TouchableOpacity
                                        style={styles.viewToggleButton}
                                        onPress={() => setStep('table')}
                                    >
                                        <Text style={styles.viewToggleButtonText}>Switch to List View</Text>
                                    </TouchableOpacity>
                                </View>

                                <FloorPlan
                                    tables={tables}
                                    floorPlanJson={restaurant.floor_plan_json}
                                    selectedTableId={selectedTableId}
                                    onSelect={setSelectedTableId}
                                />

                            </View>
                        </ScrollView>

                        <View style={styles.footer}>
                            <View style={styles.footerRow}>
                                <TouchableOpacity
                                    style={styles.backButtonInline}
                                    onPress={() => setStep('selection')}
                                >
                                    <Text style={styles.backButtonText}>{t('common.back')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryButton, { flex: 2 }, !selectedTableId && styles.disabledButton]}
                                    onPress={() => setStep('menu')}
                                    disabled={!selectedTableId}
                                >
                                    <Text style={styles.primaryButtonText}>Continue to Menu</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : step === 'success' ? (
                    <View style={[styles.content, { justifyContent: 'center', alignItems: 'center', paddingBottom: 60 }]}>
                        <Animated.View style={{
                            transform: [{ scale: successScale }],
                            opacity: successOpacity,
                            alignItems: 'center',
                            width: '100%'
                        }}>
                            <View style={styles.successIconOuter}>
                                <CheckCircle2 size={80} color={Colors.success} />
                            </View>
                            <Text style={styles.successTitle}>{t('bookings.success') || 'Booking Confirmed!'}</Text>
                            <Text style={styles.successSubtitle}>
                                {t('bookings.confirmedPage.confirmationSent') || "We've sent a confirmation to your email."}
                            </Text>

                            <View style={styles.successDetailsCard}>
                                <View style={styles.successDetailRow}>
                                    <Calendar size={20} color={Colors.primary} />
                                    <Text style={styles.successDetailText}>{format(selectedDate, 'EEEE, MMMM do')}</Text>
                                </View>
                                <View style={styles.successDetailRow}>
                                    <Clock size={20} color={Colors.primary} />
                                    <Text style={styles.successDetailText}>{format(selectedTime, 'HH:mm')}</Text>
                                </View>
                                <View style={styles.successDetailRow}>
                                    <Users size={20} color={Colors.primary} />
                                    <Text style={styles.successDetailText}>{partySize} Guests</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <TouchableOpacity
                            style={[styles.primaryButton, { width: '80%', marginTop: 40 }]}
                            onPress={resetAndClose}
                        >
                            <Text style={styles.primaryButtonText}>{t('common.close') || 'Done'}</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}

                {Platform.OS !== 'web' && (
                    <>
                        <DateTimePickerModal
                            isVisible={isDatePickerVisible}
                            mode="date"
                            onConfirm={handleDateConfirm}
                            onCancel={() => setDatePickerVisibility(false)}
                            minimumDate={new Date()}
                            textColor={Colors.text}
                            themeVariant="light"
                        />
                        <DateTimePickerModal
                            isVisible={isTimePickerVisible}
                            mode="time"
                            onConfirm={handleTimeConfirm}
                            onCancel={() => setTimePickerVisibility(false)}
                            textColor={Colors.text}
                            themeVariant="light"
                        />
                    </>
                )}
            </View>
        </Modal >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 4,
        backgroundColor: Colors.background,
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingBottom: 16,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    closeButton: {
        padding: 12,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        marginLeft: 12,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    summaryBox: {
        backgroundColor: Colors.primarySoft,
        padding: 24,
        borderRadius: 24,
        marginBottom: 32,
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    summaryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    summaryRestaurant: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    summaryText: {
        fontSize: 22,
        color: Colors.text,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    selectionGrid: {
        flexDirection: 'column',
        gap: 16,
        marginBottom: 32,
    },
    selectionCard: {
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    cardValue: {
        fontSize: 17,
        color: Colors.text,
        fontWeight: '800',
    },
    noTablesContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noTablesText: {
        textAlign: 'center',
        fontSize: 16,
        color: Colors.textMuted,
        marginBottom: 24,
        lineHeight: 24,
    },
    secondaryButtonInline: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    secondaryButtonInlineText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingVertical: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        height: 64,
        borderRadius: 32,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        ...Shadows.md,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    disabledButton: {
        opacity: 0.5,
        shadowOpacity: 0,
    },
    footerRow: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    backButtonInline: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    backButtonText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '700',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuItemInfo: {
        flex: 1,
        paddingRight: 16,
    },
    menuItemName: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    menuItemDesc: {
        fontSize: 14,
        color: Colors.textMuted,
        lineHeight: 20,
    },
    menuItemPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    viewToggleContainer: {
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    viewToggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: Colors.primarySoft,
    },
    viewToggleButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    floorPlanContainer: {
        height: 300,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        position: 'relative',
    },
    floorPlanPlaceholderText: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 14,
        color: Colors.textMuted,
        transform: [{ translateY: -10 }],
        zIndex: 0,
    },
    mockFloorPlan: {
        flex: 1,
        position: 'relative',
        zIndex: 1,
    },
    mockTable: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    mockTableActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primarySoft,
    },
    mockTableText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text,
    },
    mockTableTextActive: {
        color: Colors.primary,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginLeft: 8,
    },
    qtyButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        minWidth: 20,
        textAlign: 'center',
    },
    cartTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 8,
    },
    cartTotalLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cartTotalValue: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: 'center',
    },
    // Premium Menu Styles
    menuIntro: {
        marginBottom: 24,
    },
    menuIntroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    menuIntroSubtitle: {
        fontSize: 15,
        color: Colors.textMuted,
        lineHeight: 22,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    menuGrid: {
        gap: 16,
    },
    premiumMenuItem: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadows.sm,
    },
    successIconOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    successSubtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 20,
    },
    successDetailsCard: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 16,
    },
    successDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    successDetailText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    menuItemFlex: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    menuItemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: Colors.border,
    },
    premiumQuantityControls: {
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    qtyActiveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primarySoft,
        borderRadius: 12,
        padding: 4,
        gap: 12,
    },
    qtyBtnPremium: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyTextPremium: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        minWidth: 20,
        textAlign: 'center',
    },
    addBtnPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: Colors.primarySoft,
    },
    addBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    footerPremium: {
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        ...Shadows.md,
    },
    cartSummaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cartCountText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '700',
    },
    cartTotalText: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    confirmPreorderBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        ...Shadows.sm,
    },
    confirmPreorderBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    skipRow: {
        flexDirection: 'row',
        gap: 12,
    },
    backBtnSecondary: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    backBtnSecondaryText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    skipBtnPrimary: {
        flex: 2,
        height: 56,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    skipBtnPrimaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
});
