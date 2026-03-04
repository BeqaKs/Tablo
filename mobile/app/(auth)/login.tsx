import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Image as RNImage,
    Animated,
    ScrollView,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { makeRedirectUri } from 'expo-auth-session';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { supabase } from '../../src/services/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('auth.errors.required'));
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

            if (error) throw error;
            router.replace('/');
        } catch (error: any) {
            Alert.alert(t('common.error'), error.message || t('auth.errors.invalidCredentials'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);

            // Using standard Linking.createURL for better Expo compatibility
            const redirectUri = Linking.createURL('auth/callback');
            console.log('Redirecting to Supabase with URI:', redirectUri);

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUri,
                    skipBrowserRedirect: true,
                },
            });

            if (error) throw error;

            if (data?.url) {
                console.log('Opening WebBrowser with URL:', data.url);
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

                if (result.type === 'success' && result.url) {
                    const { url } = result;
                    console.log('Auth success, parsing result...', url);

                    let accessToken = null;
                    let refreshToken = null;
                    let code = null;

                    // Robust URL parsing - handles both query params and hash fragments
                    // This is necessary because Supabase can return either depending on the flow
                    const urlObj = new URL(url.replace('#', '?'));
                    accessToken = urlObj.searchParams.get('access_token');
                    refreshToken = urlObj.searchParams.get('refresh_token');
                    code = urlObj.searchParams.get('code');

                    if (code) {
                        console.log('Found PKCE code, exchanging for session...');
                        const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
                        if (codeError) throw codeError;
                        router.replace('/');
                    } else if (accessToken && refreshToken) {
                        console.log('Found tokens, setting session...');
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });

                        if (sessionError) throw sessionError;
                        router.replace('/');
                    }
                } else {
                    console.log('Auth session ended:', result.type);
                    if (result.type === 'cancel') {
                        Alert.alert(
                            'Auth Whitelist Check',
                            `If you saw the website instead of the app, Supabase likely rejected the redirect.\n\n` +
                            `RECOMMENDED: Add a wildcard "**" to your Supabase "Redirect URLs" list to allow development redirects.\n\n` +
                            `Current URI: ${redirectUri}`,
                            [
                                { text: 'Copy URI', onPress: () => Clipboard.setStringAsync(redirectUri) },
                                { text: 'OK' }
                            ]
                        );
                    }
                }
            }
        } catch (error: any) {
            console.error('Google Login Error:', error);
            Alert.alert(t('common.error'), error.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                    <Animated.View
                        style={[
                            styles.content,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <ChevronLeft size={24} color={Colors.text} />
                        </TouchableOpacity>

                        <View style={styles.header}>
                            <Text style={styles.title} numberOfLines={1}>{t('auth.signIn')}</Text>
                            <Text style={styles.subtitle}>{t('home.hero.subtitle')}</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.email')}
                                    placeholderTextColor={Colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder={t('auth.password')}
                                    placeholderTextColor={Colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.primaryButtonText}>{t('auth.signInButton')}</Text>
                                        <ArrowRight size={20} color="#FFF" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>{t('common.or') || 'OR'}</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={handleGoogleLogin}
                                disabled={loading}
                            >
                                <RNImage
                                    source={{ uri: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png' }}
                                    style={styles.googleIcon}
                                    resizeMode="contain"
                                />
                                <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle') || 'Continue with Google'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                                <Text style={styles.linkText}>{t('auth.signUp')}</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    backButton: {
        marginTop: 12,
        marginBottom: 24,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        lineHeight: 24,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 'auto',
        marginBottom: 32,
    },
    footerText: {
        fontSize: 16,
        color: Colors.textMuted,
    },
    linkText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        marginHorizontal: 16,
        color: Colors.textMuted,
        fontSize: 14,
        fontWeight: '500',
    },
    googleButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 12,
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    googleButtonText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '600',
    },
});
