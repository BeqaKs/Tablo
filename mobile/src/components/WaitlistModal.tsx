import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { X, User, Phone, ArrowRight } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/Colors';
import { supabase } from '../services/supabase';
import { Restaurant } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { t } from '../localization/i18n';
import { useRouter } from 'expo-router';

interface WaitlistModalProps {
    visible: boolean;
    onClose: () => void;
    restaurant: Restaurant;
    onJoined: (waitlistId: string) => void;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
    visible,
    onClose,
    restaurant,
    onJoined,
}) => {
    const { user, profile } = useAuth();
    const router = useRouter();
    const [partySize, setPartySize] = useState('2');
    const [name, setName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleJoinWaitlist = async () => {
        if (!name || !phone) {
            Alert.alert('Missing Info', 'Please provide your name and phone number.');
            return;
        }

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('waitlist')
                .insert({
                    restaurant_id: restaurant.id,
                    user_id: user?.id,
                    party_size: parseInt(partySize),
                    guest_name: name,
                    guest_phone: phone,
                    requested_time: new Date().toISOString(),
                    status: 'waiting',
                })
                .select()
                .single();

            if (error) throw error;

            onJoined(data.id);
            onClose();
            router.push(`/waitlist/${data.id}`);
        } catch (error: any) {
            console.error('Error joining waitlist:', error);
            Alert.alert('Error', error.message || 'Could not join waitlist. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Drag Handle Indicator */}
                <View style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Join Waitlist</Text>
                    <View style={{ width: 44 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                        {/* Summary Box */}
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryHeader}>
                                <View style={styles.summaryDot} />
                                <Text style={styles.summaryRestaurant}>{restaurant.name}</Text>
                            </View>
                            <Text style={styles.summaryText}>
                                Currently fully booked. Join the queue to be notified of cancellations.
                            </Text>
                        </View>

                        {/* Party Size */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Party Size</Text>
                            <View style={styles.partySizeContainer}>
                                {[1, 2, 3, 4, 5, 6, 8].map((size) => (
                                    <TouchableOpacity
                                        key={size}
                                        style={[
                                            styles.sizeChip,
                                            partySize === size.toString() && styles.activeSizeChip,
                                        ]}
                                        onPress={() => setPartySize(size.toString())}
                                    >
                                        <Text
                                            style={[
                                                styles.sizeText,
                                                partySize === size.toString() && styles.activeSizeText,
                                            ]}
                                        >
                                            {size}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Guest Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Your Details</Text>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputIconBox}>
                                    <User size={20} color={name ? Colors.primary : Colors.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.inputIconBox}>
                                    <Phone size={20} color={phone ? Colors.primary : Colors.textMuted} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone Number"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                (!name || !phone || loading) && styles.disabledButton
                            ]}
                            onPress={handleJoinWaitlist}
                            disabled={!name || !phone || loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.primaryButtonText}>Confirm & Join Queue</Text>
                                    <ArrowRight size={20} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
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
        marginBottom: 12,
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
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
        lineHeight: 24,
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
    partySizeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    sizeChip: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    activeSizeChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        ...Shadows.sm,
    },
    sizeText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    activeSizeText: {
        color: '#FFFFFF',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingLeft: 8,
        paddingRight: 16,
        height: 64,
        marginBottom: 16,
    },
    inputIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: Colors.text,
        fontWeight: '600',
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
    disabledButton: {
        opacity: 0.5,
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
