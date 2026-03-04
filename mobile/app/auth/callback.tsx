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

            // Handle both hash (#) for Implicit flow and code (?) for PKCE flow
            if (url.includes('#')) {
                const hash = url.split('#')[1];
                const params = new URLSearchParams(hash);
                accessToken = params.get('access_token');
                refreshToken = params.get('refresh_token');
            } else if (url.includes('?')) {
                const search = url.split('?')[1];
                const params = new URLSearchParams(search);
                accessToken = params.get('access_token');
                refreshToken = params.get('refresh_token');

                // If we have a code instead of tokens (PKCE flow)
                const code = params.get('code');
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
