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

            let accessToken: string | null = null;
            let refreshToken: string | null = null;

            // Robust URL parsing - handles hashes (#), query params (?), and deep link formats
            const rawUrl = url;
            // URL parsing

            // Supabase redirects often use #access_token=...
            // We'll normalize to use URLSearchParams
            const hash = rawUrl.split('#')[1] || '';
            const query = rawUrl.split('?')[1] || '';

            // Combine both to catch tokens regardless of where they are
            const params = new URLSearchParams(hash || query);

            accessToken = params.get('access_token');
            refreshToken = params.get('refresh_token');
            const code = params.get('code');

            if (code) {
                // PKCE code exchange
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                    router.replace('/');
                    return;
                } else {
                    // PKCE exchange error
                    router.replace('/(auth)/login');
                    return;
                }
            }

            if (accessToken && refreshToken) {
                // Setting session
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                });

                if (!error) {
                    router.replace('/');
                } else {
                    // Session error
                    router.replace('/(auth)/login');
                }
            } else if (accessToken || refreshToken) {
                // Partial tokens
                // If we have one but not the other, try to let Supabase handle it or log it
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
