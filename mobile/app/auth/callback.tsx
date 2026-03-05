import { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../../src/services/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const url = Linking.useURL();

    useEffect(() => {
        const handleCallback = async () => {
            if (!url) return;

            console.log('AuthCallback received URL:', url);

            let accessToken = null;
            let refreshToken = null;

            // Robust URL parsing - handles hashes, query params, and deep link formats
            const normalizedUrl = url.replace('#', '?');
            let urlObj;
            try {
                urlObj = new URL(normalizedUrl);
            } catch (e) {
                // If it's a deep link like tablo://auth/callback?code=...
                // we might need to handle it differently if URL constructor fails
                console.log('URL parsing failed, trying manual parse for deep link');
                const queryString = normalizedUrl.split('?')[1] || '';
                const params = new URLSearchParams(queryString);
                accessToken = params.get('access_token');
                refreshToken = params.get('refresh_token');
                const code = params.get('code');

                if (code) {
                    console.log('Found PKCE code in manual parse, exchanging...');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (!error) { router.replace('/'); return; }
                }
            }

            if (urlObj) {
                accessToken = urlObj.searchParams.get('access_token');
                refreshToken = urlObj.searchParams.get('refresh_token');
                const code = urlObj.searchParams.get('code');

                if (code) {
                    console.log('Found PKCE code in callback, exchanging for session...');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (!error) {
                        router.replace('/');
                        return;
                    } else {
                        console.error('PKCE exchange error:', error.message);
                        router.replace('/(auth)/login');
                        return;
                    }
                }
            }

            if (accessToken && refreshToken) {
                console.log('Found tokens in callback, setting session...');
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (!error) {
                    router.replace('/');
                } else {
                    console.error('Session error:', error.message);
                    router.replace('/(auth)/login');
                }
            } else {
                console.log('No tokens found in callback URL');
                // Don't auto-redirect immediately as URL might be slow to populate
            }
        };

        handleCallback();
    }, [url]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
            <ActivityIndicator size="large" color="#E31837" />
            <Text style={{ marginTop: 20, fontWeight: '600' }}>Completing sign in...</Text>
        </View>
    );
}
