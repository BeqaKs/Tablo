import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Users, UserPlus, Search, Check, X, UserMinus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors as ThemeColors } from '../../src/constants/Colors';
import { friendsService } from '../../src/services/friends';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { t } from '../../src/localization/i18n';

export default function FriendsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const [activeTab, setActiveTab] = useState<'friends' | 'add'>('friends');
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const loadData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [f, r] = await Promise.all([
                friendsService.getFriends(user.id),
                friendsService.getPendingRequests(user.id)
            ]);
            setFriends(f);
            setRequests(r);
        } catch (error: any) {
            console.error('Error loading friends:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 3 && user) {
                const results = await friendsService.searchUsers(searchQuery, user.id);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleAccept = async (id: string) => {
        setActionLoading(id);
        await friendsService.acceptRequest(id).catch(e => Alert.alert(t('common.error'), e.message));
        await loadData();
        setActionLoading(null);
    };

    const handleReject = async (id: string, isRemoval = false) => {
        if (isRemoval) {
            Alert.alert(
                t('friends.removeFriend'),
                t('friends.removeFriendConfirm'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('common.remove'), style: 'destructive', onPress: async () => {
                            setActionLoading(id);
                            await friendsService.removeFriend(id).catch(e => Alert.alert(t('common.error'), e.message));
                            await loadData();
                            setActionLoading(null);
                        }
                    }
                ]
            );
        } else {
            setActionLoading(id);
            await friendsService.removeFriend(id).catch(e => Alert.alert('Error', e.message));
            await loadData();
            setActionLoading(null);
        }
    };

    const handleSendRequest = async (userId: string) => {
        if (!user) return;
        setActionLoading(userId);
        try {
            await friendsService.sendRequest(user.id, userId);
            setSearchQuery('');
            setSearchResults([]);
            Alert.alert(t('common.success'), t('friends.successRequestSent'));
        } catch (error: any) {
            Alert.alert(t('common.notice'), error.message);
        }
        setActionLoading(userId === null ? null : userId); // Wait, this is fine
        setActionLoading(null);
    };

    if (isLoading && friends.length === 0) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ChevronLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>{t('friends.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                        {t('friends.myFriends')} ({friends.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'add' && styles.activeTab]}
                    onPress={() => setActiveTab('add')}
                >
                    <Text style={[styles.tabText, activeTab === 'add' && styles.activeTabText]}>
                        {t('friends.addFriends')} {requests.length > 0 && `(${requests.length})`}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {activeTab === 'friends' ? (
                    <View>
                        {friends.length === 0 ? (
                            <View style={styles.emptyState}>
                                <View style={styles.emptyStateIconContainer}>
                                    <Users size={32} color={colors.primary} />
                                </View>
                                <Text style={styles.emptyStateTitle}>{t('friends.noFriends')}</Text>
                                <Text style={styles.emptyStateSubtitle}>{t('friends.noFriendsSubtitle')}</Text>
                                <TouchableOpacity style={styles.primaryButton} onPress={() => setActiveTab('add')}>
                                    <Text style={styles.primaryButtonText}>{t('friends.findFriends')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.listContainer}>
                                {friends.map((friend, idx) => (
                                    <View key={friend.id} style={[styles.listItem, idx === friends.length - 1 && styles.lastListItem]}>
                                        <View style={styles.avatar}>
                                            <Text style={styles.avatarText}>{friend.profile?.full_name?.charAt(0) || '?'}</Text>
                                        </View>
                                        <View style={styles.userInfo}>
                                            <Text style={styles.userName}>{friend.profile?.full_name}</Text>
                                            <Text style={styles.userSince}>{t('friends.userSince', { date: new Date(friend.created_at).toLocaleDateString() })}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.iconBtn}
                                            onPress={() => handleReject(friend.id, true)}
                                            disabled={actionLoading === friend.id}
                                        >
                                            {actionLoading === friend.id ? <ActivityIndicator size="small" color={colors.error} /> : <UserMinus size={20} color={colors.error} />}
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.addFriendsContainer}>
                        {requests.length > 0 && (
                            <View style={{ marginBottom: 24 }}>
                                <Text style={styles.sectionHeader}>{t('friends.pendingRequests')}</Text>
                                <View style={styles.listContainer}>
                                    {requests.map((req, idx) => (
                                        <View key={req.id} style={[styles.listItem, idx === requests.length - 1 && styles.lastListItem]}>
                                            <View style={styles.avatar}>
                                                <Text style={styles.avatarText}>{req.profile?.full_name?.charAt(0) || '?'}</Text>
                                            </View>
                                            <View style={styles.userInfo}>
                                                <Text style={styles.userName}>{req.profile?.full_name}</Text>
                                            </View>
                                            <View style={styles.actionsRow}>
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, styles.acceptBtn]}
                                                    onPress={() => handleAccept(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? <ActivityIndicator size="small" color="#fff" /> : <Check size={16} color="#FFF" />}
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.actionBtn, styles.rejectBtn]}
                                                    onPress={() => handleReject(req.id)}
                                                    disabled={actionLoading === req.id}
                                                >
                                                    {actionLoading === req.id ? <ActivityIndicator size="small" color={colors.text} /> : <X size={16} color={colors.text} />}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Text style={styles.sectionHeader}>{t('friends.findFriends')}</Text>
                        <View style={styles.searchContainer}>
                            <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={t('friends.searchPlaceholder')}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                            />
                        </View>

                        {searchQuery.length >= 3 ? (
                            <View style={styles.listContainer}>
                                {searchResults.length > 0 ? searchResults.map(sUser => {
                                    const isFriend = friends.some(f => f.profile?.id === sUser.id);
                                    const hasPending = requests.some(r => r.profile?.id === sUser.id);

                                    return (
                                        <View key={sUser.id} style={[styles.listItem, styles.lastListItem]}>
                                            <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                                                <Text style={[styles.avatarText, { color: colors.textMuted }]}>{sUser.full_name?.charAt(0) || '?'}</Text>
                                            </View>
                                            <View style={styles.userInfo}>
                                                <Text style={styles.userName}>{sUser.full_name}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={[styles.smallBtn, isFriend && styles.smallBtnOutline]}
                                                onPress={() => !isFriend && !hasPending && handleSendRequest(sUser.id)}
                                                disabled={isFriend || hasPending || actionLoading === sUser.id}
                                            >
                                                {actionLoading === sUser.id ? (
                                                    <ActivityIndicator size="small" color={isFriend ? colors.text : "#FFF"} />
                                                ) : isFriend ? (
                                                    <Text style={styles.smallBtnOutlineText}>{t('friends.statusFriends')}</Text>
                                                ) : hasPending ? (
                                                    <Text style={styles.smallBtnOutlineText}>{t('friends.statusPending')}</Text>
                                                ) : (
                                                    <Text style={styles.smallBtnText}>{t('friends.add')}</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                }) : (
                                    <Text style={styles.noResultsText}>{t('friends.noUsersFound')}</Text>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.searchPrompt}>{t('friends.searchHint')}</Text>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    activeTabText: {
        color: colors.primary,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyStateIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: `${colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: 32,
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    primaryButtonText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    listContainer: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    lastListItem: {
        borderBottomWidth: 0,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    userSince: {
        fontSize: 12,
        color: colors.textMuted,
        fontWeight: '500',
    },
    iconBtn: {
        padding: 8,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        paddingLeft: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    acceptBtn: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    rejectBtn: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
    },
    addFriendsContainer: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 52,
        fontSize: 16,
        color: colors.text,
    },
    smallBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    smallBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    smallBtnOutline: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    smallBtnOutlineText: {
        color: colors.textMuted,
        fontSize: 13,
        fontWeight: '700',
    },
    noResultsText: {
        padding: 20,
        textAlign: 'center',
        color: colors.textMuted,
        fontWeight: '500',
    },
    searchPrompt: {
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: 14,
        marginTop: 20,
    }
});
