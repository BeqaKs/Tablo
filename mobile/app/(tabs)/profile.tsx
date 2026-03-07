import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    User, Mail, Shield, LogOut, ChevronRight, Settings,
    Bell, CreditCard, HelpCircle, Star, Calendar, Heart, X, Check, Users,
    Sun, Moon, Monitor, Globe
} from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/services/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();
    const { language, setLanguage } = useLanguage();
    const { theme, setTheme, colors } = useTheme();

    // Edit Profile modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(profile?.full_name || '');
    const [editPhone, setEditPhone] = useState((profile as any)?.phone || '');
    const [saving, setSaving] = useState(false);

    // Notification prefs modal state
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [smsNotifs, setSmsNotifs] = useState(true);

    // Help modal state
    const [showHelpModal, setShowHelpModal] = useState(false);

    const handleChangeLanguage = () => {
        Alert.alert(
            t('profile.selectLanguage') || 'Select Language / აირჩიეთ ენა',
            t('profile.selectLanguageDesc') || 'Choose your preferred language for Tablo.',
            [
                { text: 'English', onPress: () => setLanguage('en') },
                { text: 'ქართული (Georgian)', onPress: () => setLanguage('ka') },
                { text: t('common.cancel') || 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleChangeTheme = () => {
        Alert.alert(
            t('profile.theme') || 'App Theme',
            t('profile.selectTheme') || 'Select your preferred theme.',
            [
                { text: t('profile.themeLight') || 'Light', onPress: () => setTheme('light') },
                { text: t('profile.themeDark') || 'Dark', onPress: () => setTheme('dark') },
                { text: t('profile.themeSystem') || 'System', onPress: () => setTheme('system') },
                { text: t('common.cancel') || 'Cancel', style: 'cancel' }
            ]
        );
    };

    const getThemeLabel = (themeMode: string) => {
        switch (themeMode) {
            case 'light': return t('profile.themeLight') || 'Light';
            case 'dark': return t('profile.themeDark') || 'Dark';
            case 'system': return t('profile.themeSystem') || 'System';
            default: return themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            Alert.alert(t('common.error') || 'Error', 'Name cannot be empty.');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ full_name: editName.trim(), phone: editPhone.trim() })
                .eq('id', user?.id);
            if (error) throw error;
            setShowEditModal(false);
            Alert.alert(t('common.success') || 'Success', 'Profile updated successfully!');
        } catch (err) {
            Alert.alert(t('common.error') || 'Error', 'Could not update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOutDirect = async () => {
        Alert.alert(
            t('navigation.signOut') || 'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                {
                    text: t('navigation.signOut') || 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await signOut();
                        router.replace('/(tabs)');
                    }
                }
            ]
        );
    };

    const renderMenuItem = (
        icon: any,
        title: string,
        subtitle?: string,
        onPress?: () => void,
        isDestructive?: boolean,
        isLast?: boolean,
    ) => (
        <TouchableOpacity
            style={[styles.menuItem, isLast && styles.menuItemLast]}
            onPress={onPress}
            disabled={!onPress}
            activeOpacity={0.6}
        >
            <View style={[styles.menuIconContainer, isDestructive && styles.destructiveIconBg]}>
                {React.createElement(icon, {
                    size: 18,
                    color: isDestructive ? Colors.error : Colors.primary,
                })}
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={18} color={Colors.border} />
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <View style={[styles.centered, { paddingTop: 60, paddingBottom: 40 }]}>
                        <View style={styles.emptyAvatarCircle}>
                            <User size={48} color={Colors.border} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>{t('navigation.signIn')}</Text>
                        <Text style={styles.emptySubtitle}>{t('profile.signInToManage') || 'Sign in to manage your bookings and profile settings.'}</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.primaryButtonText}>{t('auth.signInButton')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('profile.appSettings') || 'App Settings'}</Text>
                        <View style={styles.menuContainer}>
                            {renderMenuItem(
                                Globe,
                                t('profile.language') || 'Language',
                                language === 'ka' ? 'ქართული' : 'English',
                                handleChangeLanguage
                            )}
                            {renderMenuItem(
                                theme === 'dark' ? Moon : Sun,
                                t('profile.theme') || 'App Theme',
                                getThemeLabel(theme),
                                handleChangeTheme,
                                false,
                                true
                            )}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const initials = profile?.full_name
        ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : user.email?.charAt(0).toUpperCase();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Gradient-like profile header */}
                <View style={styles.header}>
                    <View style={styles.headerGradient}>
                        <View style={styles.gradientCircle1} />
                        <View style={styles.gradientCircle2} />
                    </View>
                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarCircle}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                    </View>
                    <Text style={styles.userName}>{profile?.full_name || 'Diner'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Calendar size={16} color={Colors.primary} />
                            <Text style={styles.statValue}>—</Text>
                            <Text style={styles.statLabel}>{t('profile.bookingsStat') || 'Bookings'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Heart size={16} color={Colors.primary} />
                            <Text style={styles.statValue}>—</Text>
                            <Text style={styles.statLabel}>{t('profile.favoritesStat') || 'Favorites'}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Star size={16} color={Colors.primary} />
                            <Text style={styles.statValue}>—</Text>
                            <Text style={styles.statLabel}>{t('profile.reviewsStat') || 'Reviews'}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                            setEditName(profile?.full_name || '');
                            setEditPhone(profile?.phone || '');
                            setShowEditModal(true);
                        }}
                    >
                        <Text style={styles.editButtonText}>{t('profile.editProfile')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
                    <View style={styles.menuContainer}>
                        {renderMenuItem(
                            Users,
                            'Friends & Network',
                            'View your dining friends',
                            () => router.push('/friends' as any)
                        )}
                        {renderMenuItem(Mail, t('profile.email'), user.email)}
                        {renderMenuItem(
                            Bell,
                            t('profile.notifications') || 'Notifications',
                            t('profile.emailSms') || 'Email & SMS',
                            () => setShowNotifModal(true)
                        )}
                        {renderMenuItem(
                            CreditCard,
                            t('profile.paymentMethods') || 'Payment Methods',
                            t('profile.manageCards') || 'Manage your cards',
                            () => Alert.alert(
                                t('profile.paymentMethods') || 'Payment Methods',
                                'Payment methods management coming soon.',
                                [{ text: t('common.close') || 'Close' }]
                            ),
                            false,
                            true
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.appSettings') || 'App Settings'}</Text>
                    <View style={styles.menuContainer}>
                        {renderMenuItem(
                            Shield,
                            t('profile.securityPrivacy') || 'Security & Privacy',
                            undefined,
                            () => Alert.alert(
                                t('profile.securityPrivacy') || 'Security & Privacy',
                                'Your account is secured with email authentication. To change your password, sign out and use "Forgot Password" on the login screen.',
                                [{ text: t('common.close') || 'Close' }]
                            )
                        )}
                        {renderMenuItem(
                            Settings,
                            t('profile.language') || 'Language / ენა',
                            language === 'en' ? 'English' : 'ქართული',
                            handleChangeLanguage
                        )}
                        {renderMenuItem(
                            theme === 'dark' ? Moon : Sun,
                            t('profile.theme') || 'App Theme',
                            getThemeLabel(theme),
                            handleChangeTheme
                        )}
                        {renderMenuItem(
                            HelpCircle,
                            t('profile.helpSupport') || 'Help & Support',
                            t('profile.faqContact') || 'FAQ, Contact us',
                            () => setShowHelpModal(true),
                            false,
                            true
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.menuContainer}>
                        {renderMenuItem(LogOut, t('navigation.signOut'), undefined, handleSignOutDirect, true, true)}
                    </View>
                </View>

                <Text style={styles.versionText}>{t('profile.version') || 'Tablo v1.0.0'}</Text>
            </ScrollView>

            {/* ── Edit Profile Modal ─────────────────────────────── */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.editProfileModal.title') || 'Edit Profile'}</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('profile.editProfileModal.nameLabel') || 'Full Name'}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder="Your full name"
                                    placeholderTextColor={Colors.textMuted}
                                    autoCapitalize="words"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('profile.editProfileModal.phoneLabel') || 'Phone Number'}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="+995 5xx xxx xxx"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('profile.editProfileModal.emailLabel') || 'Email'}</Text>
                                <View style={styles.inputDisabled}>
                                    <Text style={styles.inputDisabledText}>{user.email}</Text>
                                </View>
                                <Text style={styles.inputNote}>{t('profile.emailNote') || 'Email cannot be changed.'}</Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSaveProfile}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Check size={18} color="#FFF" />
                                    <Text style={styles.saveButtonText}>{t('profile.editProfileModal.save') || 'Save Changes'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Notifications Modal ───────────────────────────── */}
            <Modal visible={showNotifModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.notifications') || 'Notification Preferences'}</Text>
                            <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setEmailNotifs(v => !v)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.toggleInfo}>
                                    <Text style={styles.toggleTitle}>{t('profile.emailNotifications') || 'Email Notifications'}</Text>
                                    <Text style={styles.toggleSubtitle}>{t('profile.emailNotificationsDesc') || 'Booking confirmations via email'}</Text>
                                </View>
                                <View style={[styles.toggle, emailNotifs && styles.toggleActive]}>
                                    <View style={[styles.toggleKnob, emailNotifs && styles.toggleKnobActive]} />
                                </View>
                            </TouchableOpacity>
                            <View style={styles.toggleDivider} />
                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setSmsNotifs(v => !v)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.toggleInfo}>
                                    <Text style={styles.toggleTitle}>{t('profile.smsNotifications') || 'SMS Notifications'}</Text>
                                    <Text style={styles.toggleSubtitle}>{t('profile.smsNotificationsDesc') || 'Booking reminders via SMS'}</Text>
                                </View>
                                <View style={[styles.toggle, smsNotifs && styles.toggleActive]}>
                                    <View style={[styles.toggleKnob, smsNotifs && styles.toggleKnobActive]} />
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => {
                                setShowNotifModal(false);
                                Alert.alert(t('common.success') || 'Saved', 'Notification preferences updated!');
                            }}
                        >
                            <Check size={18} color="#FFF" />
                            <Text style={styles.saveButtonText}>{t('common.save') || 'Save'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Help & Support Modal ──────────────────────────── */}
            <Modal visible={showHelpModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.helpSupport') || 'Help & Support'}</Text>
                            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <TouchableOpacity
                                style={styles.helpItem}
                                onPress={() => Linking.openURL('mailto:support@tablo.ge')}
                            >
                                <Mail size={20} color={Colors.primary} />
                                <View style={styles.helpTextWrap}>
                                    <Text style={styles.helpItemTitle}>Email Support</Text>
                                    <Text style={styles.helpItemSub}>support@tablo.ge</Text>
                                </View>
                                <ChevronRight size={16} color={Colors.border} />
                            </TouchableOpacity>
                            <View style={styles.toggleDivider} />
                            <TouchableOpacity
                                style={styles.helpItem}
                                onPress={() => Linking.openURL('https://tablo.ge/faq').catch(() => { })}
                            >
                                <HelpCircle size={20} color={Colors.primary} />
                                <View style={styles.helpTextWrap}>
                                    <Text style={styles.helpItemTitle}>FAQ</Text>
                                    <Text style={styles.helpItemSub}>Frequently asked questions</Text>
                                </View>
                                <ChevronRight size={16} color={Colors.border} />
                            </TouchableOpacity>
                            <View style={styles.toggleDivider} />
                            <TouchableOpacity
                                style={styles.helpItem}
                                onPress={() => Linking.openURL('tel:+99532000000').catch(() => { })}
                            >
                                <Bell size={20} color={Colors.primary} />
                                <View style={styles.helpTextWrap}>
                                    <Text style={styles.helpItemTitle}>Call Us</Text>
                                    <Text style={styles.helpItemSub}>+995 32 000 000</Text>
                                </View>
                                <ChevronRight size={16} color={Colors.border} />
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centered: { paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
    // Header
    header: {
        alignItems: 'center',
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        position: 'relative',
        overflow: 'hidden',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: Colors.primary,
    },
    gradientCircle1: {
        position: 'absolute',
        top: -30,
        right: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    gradientCircle2: {
        position: 'absolute',
        top: 20,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    avatarWrapper: {
        marginTop: 70,
        marginBottom: 14,
    },
    avatarCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.primary,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    userEmail: {
        fontSize: 15,
        color: Colors.textMuted,
        marginBottom: 16,
        fontWeight: '500',
    },
    // Stats
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 20,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statDivider: { width: 1, height: 32, backgroundColor: Colors.border },
    statValue: { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 2 },
    statLabel: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    editButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    editButtonText: { fontSize: 14, fontWeight: '700', color: Colors.text },
    // Sections
    section: { paddingTop: 24, paddingHorizontal: 20 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 12,
        paddingLeft: 4,
    },
    menuContainer: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    menuItemLast: { borderBottomWidth: 0 },
    menuIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: `${Colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    destructiveIconBg: { backgroundColor: '#FEF2F2' },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    destructiveText: { color: Colors.error },
    menuSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
    // Empty state
    emptyAvatarCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    emptyTitle: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    emptySubtitle: { fontSize: 16, color: Colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    primaryButton: {
        width: '100%',
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 24,
        marginBottom: 40,
        fontWeight: '500',
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: 40,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    modalBody: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    inputDisabled: {
        height: 52,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    inputDisabledText: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '600',
    },
    inputNote: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 6,
        fontWeight: '500',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 24,
        marginTop: 20,
        height: 56,
        backgroundColor: Colors.primary,
        borderRadius: 28,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    // Toggle styles
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    toggleInfo: { flex: 1 },
    toggleTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    toggleSubtitle: { fontSize: 13, color: Colors.textMuted, fontWeight: '500' },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.border,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleActive: { backgroundColor: Colors.primary },
    toggleKnob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleKnobActive: { alignSelf: 'flex-end' },
    toggleDivider: {
        height: 1,
        backgroundColor: Colors.border,
    },
    // Help items
    helpItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 14,
    },
    helpTextWrap: { flex: 1 },
    helpItemTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    helpItemSub: { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 2 },
});
