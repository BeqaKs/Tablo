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
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    User, Mail, Shield, LogOut, ChevronRight, Settings,
    Bell, CreditCard, HelpCircle, Star, Calendar, Heart, X, Check, Users,
    Sun, Moon, Monitor, Globe
} from 'lucide-react-native';
import { t } from '../../src/localization/i18n';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useTheme } from '../../src/context/ThemeContext';
import { supabase } from '../../src/services/supabase';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, profile, signOut } = useAuth();
    const { colors, isDark, setTheme, theme } = useTheme();
    const { language, setLanguage } = useLanguage();
    const insets = useSafeAreaInsets();
    const styles = getStyles(colors, isDark, insets);

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
            t('profile.selectLanguage'),
            t('profile.selectLanguageDesc'),
            [
                { text: 'English', onPress: () => setLanguage('en') },
                { text: 'ქართული (Georgian)', onPress: () => setLanguage('ka') },
                { text: t('common.cancel'), style: 'cancel' }
            ]
        );
    };

    const handleChangeTheme = () => {
        Alert.alert(
            t('profile.theme'),
            t('profile.selectTheme'),
            [
                { text: t('profile.themeLight'), onPress: () => setTheme('light') },
                { text: t('profile.themeDark'), onPress: () => setTheme('dark') },
                { text: t('profile.themeSystem'), onPress: () => setTheme('system') },
                { text: t('common.cancel'), style: 'cancel' }
            ]
        );
    };

    const getThemeLabel = (themeMode: string) => {
        switch (themeMode) {
            case 'light': return t('profile.themeLight');
            case 'dark': return t('profile.themeDark');
            case 'system': return t('profile.themeSystem');
            default: return themeMode.charAt(0).toUpperCase() + themeMode.slice(1);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            Alert.alert(t('common.error'), t('profile.nameRequired'));
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
            Alert.alert(t('common.success'), t('profile.updateSuccess'));
        } catch (err) {
            Alert.alert(t('common.error'), t('profile.updateError'));
        } finally {
            setSaving(false);
        }
    };

    const handleSignOutDirect = async () => {
        Alert.alert(
            t('navigation.signOut'),
            t('profile.signOutConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('navigation.signOut'),
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
                    color: isDestructive ? colors.error : colors.primary,
                })}
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <ChevronRight size={18} color={colors.border} />
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <View style={[styles.centered, { paddingTop: 60, paddingBottom: 40 }]}>
                        <View style={styles.emptyAvatarCircle}>
                            <User size={48} color={colors.border} strokeWidth={1.5} />
                        </View>
                        <Text style={styles.emptyTitle}>{t('navigation.signIn')}</Text>
                        <Text style={styles.emptySubtitle}>{t('profile.signInToManage')}</Text>
                        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(auth)/login')}>
                            <Text style={styles.primaryButtonText}>{t('auth.signInButton')}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('profile.appSettings')}</Text>
                        <View style={styles.menuContainer}>
                            {renderMenuItem(
                                Globe,
                                t('profile.language'),
                                language === 'ka' ? 'ქართული' : 'English',
                                handleChangeLanguage
                            )}
                            {renderMenuItem(
                                theme === 'dark' ? Moon : Sun,
                                t('profile.theme'),
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.header}>
                    <View style={styles.headerGradient}>
                        <View style={styles.gradientCircle1} />
                        <View style={styles.gradientCircle2} />
                    </View>

                    <View style={styles.avatarWrapper}>
                        <View style={styles.avatarCircle}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                    </View>

                    <Text style={styles.userName}>{profile?.full_name || 'Auditor'}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>-</Text>
                            <Text style={styles.statLabel}>{t('profile.bookingsStat')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>-</Text>
                            <Text style={styles.statLabel}>{t('profile.favoritesStat')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>-</Text>
                            <Text style={styles.statLabel}>{t('profile.reviewsStat')}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                            setEditName(profile?.full_name || '');
                            setEditPhone((profile as any)?.phone || '');
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
                            t('profile.friendsNetwork'),
                            t('profile.friendsSubtitle'),
                            () => router.push('/friends' as any)
                        )}
                        {renderMenuItem(Mail, t('profile.email'), user.email)}
                        {renderMenuItem(
                            Bell,
                            t('profile.notifications'),
                            t('profile.emailSms'),
                            () => setShowNotifModal(true)
                        )}
                        {renderMenuItem(
                            CreditCard,
                            t('profile.paymentMethods'),
                            t('profile.manageCards'),
                            () => Alert.alert(
                                t('profile.paymentMethods'),
                                t('profile.paymentMethodsDesc'),
                                [{ text: t('common.close') }]
                            ),
                            false,
                            true
                        )}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.appSettings')}</Text>
                    <View style={styles.menuContainer}>
                        {renderMenuItem(
                            Shield,
                            t('profile.securityPrivacy'),
                            undefined,
                            () => Alert.alert(
                                t('profile.securityPrivacy'),
                                t('profile.securityPrivacyDesc'),
                                [{ text: t('common.close') }]
                            )
                        )}
                        {renderMenuItem(
                            Settings,
                            t('profile.language'),
                            language === 'en' ? 'English' : 'ქართული',
                            handleChangeLanguage
                        )}
                        {renderMenuItem(
                            theme === 'dark' ? Moon : Sun,
                            t('profile.theme'),
                            getThemeLabel(theme),
                            handleChangeTheme
                        )}
                        {renderMenuItem(
                            HelpCircle,
                            t('profile.helpSupport'),
                            t('profile.faqContact'),
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

                <Text style={styles.versionText}>{t('profile.version')}</Text>
            </ScrollView>

            {/* ── Edit Profile Modal ─────────────────────────────── */}
            <Modal visible={showEditModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.editProfileModal.title')}</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('profile.editProfileModal.nameLabel')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editName}
                                    onChangeText={setEditName}
                                    placeholder={t('profile.editProfileModal.namePlaceholder')}
                                    placeholderTextColor={colors.textMuted}
                                    autoCapitalize="words"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('profile.editProfileModal.phoneLabel')}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editPhone}
                                    onChangeText={setEditPhone}
                                    placeholder="+995 5xx xxx xxx"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>{t('profile.editProfileModal.emailLabel')}</Text>
                                <View style={styles.inputDisabled}>
                                    <Text style={styles.inputDisabledText}>{user.email}</Text>
                                </View>
                                <Text style={styles.inputNote}>{t('profile.emailNote')}</Text>
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
                                    <Text style={styles.saveButtonText}>{t('profile.editProfileModal.save')}</Text>
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
                            <Text style={styles.modalTitle}>{t('profile.notifications')}</Text>
                            <TouchableOpacity onPress={() => setShowNotifModal(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setEmailNotifs(v => !v)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.toggleInfo}>
                                    <Text style={styles.toggleTitle}>{t('profile.emailNotifications')}</Text>
                                    <Text style={styles.toggleSubtitle}>{t('profile.emailNotificationsDesc')}</Text>
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
                                    <Text style={styles.toggleTitle}>{t('profile.smsNotifications')}</Text>
                                    <Text style={styles.toggleSubtitle}>{t('profile.smsNotificationsDesc')}</Text>
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
                                Alert.alert(t('common.success'), t('profile.notifUpdateSuccess'));
                            }}
                        >
                            <Check size={18} color="#FFF" />
                            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── Help & Support Modal ──────────────────────────── */}
            <Modal visible={showHelpModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('profile.helpSupport')}</Text>
                            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                            <TouchableOpacity
                                style={styles.helpItem}
                                onPress={() => Linking.openURL('mailto:support@tablo.ge')}
                            >
                                <Mail size={20} color={colors.primary} />
                                <View style={styles.helpTextWrap}>
                                    <Text style={styles.helpItemTitle}>{t('profile.helpEmailTitle')}</Text>
                                    <Text style={styles.helpItemSub}>{t('profile.helpEmailSub')}</Text>
                                </View>
                                <ChevronRight size={16} color={colors.border} />
                            </TouchableOpacity>
                            <View style={styles.toggleDivider} />
                            <TouchableOpacity
                                style={styles.helpItem}
                                onPress={() => Linking.openURL('https://tablo.ge/faq').catch(() => { })}
                            >
                                <HelpCircle size={20} color={colors.primary} />
                                <View style={styles.helpTextWrap}>
                                    <Text style={styles.helpItemTitle}>{t('profile.helpFaqTitle')}</Text>
                                    <Text style={styles.helpItemSub}>{t('profile.helpFaqSub')}</Text>
                                </View>
                                <ChevronRight size={16} color={colors.border} />
                            </TouchableOpacity>
                            <View style={styles.toggleDivider} />
                            <TouchableOpacity
                                style={styles.helpItem}
                                onPress={() => Linking.openURL('tel:+99532000000').catch(() => { })}
                            >
                                <Bell size={20} color={colors.primary} />
                                <View style={styles.helpTextWrap}>
                                    <Text style={styles.helpItemTitle}>{t('profile.helpCallTitle')}</Text>
                                    <Text style={styles.helpItemSub}>{t('profile.helpCallSub')}</Text>
                                </View>
                                <ChevronRight size={16} color={colors.border} />
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors: any, isDark: boolean, insets: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 40 },
    centered: { paddingHorizontal: 40, alignItems: 'center', justifyContent: 'center' },
    // Header
    header: {
        alignItems: 'center',
        paddingBottom: 32,
        backgroundColor: colors.background,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 160 + insets.top,
        backgroundColor: colors.primary,
    },
    gradientCircle1: {
        position: 'absolute',
        top: -30,
        right: -20,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    gradientCircle2: {
        position: 'absolute',
        top: 20,
        left: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.07)',
    },
    avatarWrapper: {
        marginTop: 100 + insets.top,
        marginBottom: 16,
    },
    avatarCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    avatarText: {
        fontSize: 42,
        fontWeight: '800',
        color: colors.primary,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 55,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.text,
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    userEmail: {
        fontSize: 15,
        color: colors.textMuted,
        marginBottom: 16,
        fontWeight: '500',
    },
    // Stats
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.card,
        borderRadius: 20,
        paddingVertical: 18,
        paddingHorizontal: 10,
        marginHorizontal: 24,
        marginTop: 8,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    statBox: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1.5, height: 32, backgroundColor: colors.border },
    statNumber: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 2 },
    statLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
    editButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: colors.card,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    editButtonText: { fontSize: 14, fontWeight: '700', color: colors.text },
    // Sections
    section: { paddingTop: 24, paddingHorizontal: 20 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 12,
        paddingLeft: 4,
    },
    menuContainer: {
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuItemLast: { borderBottomWidth: 0 },
    menuIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: `${colors.primary}12`,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    destructiveIconBg: { backgroundColor: isDark ? '#450a0a' : '#FEF2F2' },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    destructiveText: { color: colors.error },
    menuSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2, fontWeight: '500' },
    // Empty state
    emptyAvatarCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: colors.border,
    },
    emptyTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 12 },
    emptySubtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    primaryButton: {
        width: '100%',
        backgroundColor: colors.primary,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.textMuted,
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
        backgroundColor: colors.card,
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
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
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
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: colors.background,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    inputDisabled: {
        height: 52,
        backgroundColor: isDark ? colors.background : '#F1F5F9',
        borderRadius: 14,
        paddingHorizontal: 16,
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    inputDisabledText: {
        fontSize: 16,
        color: colors.textMuted,
        fontWeight: '600',
    },
    inputNote: {
        fontSize: 12,
        color: colors.textMuted,
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
        backgroundColor: colors.primary,
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
    toggleTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
    toggleSubtitle: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.border,
        justifyContent: 'center',
        paddingHorizontal: 3,
    },
    toggleActive: { backgroundColor: colors.primary },
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
        backgroundColor: colors.border,
    },
    // Help items
    helpItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 14,
    },
    helpTextWrap: { flex: 1 },
    helpItemTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 2 },
    helpItemSub: { fontSize: 13, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
});
