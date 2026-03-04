import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

WebBrowser.maybeCompleteAuthSession();

import { AuthProvider } from '../src/context/AuthContext';
import { LanguageProvider, useLanguage } from '../src/context/LanguageContext';

export default function RootLayout() {
    const [loaded, error] = useFonts({
        // We can add custom fonts later if needed
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error && Object.keys({}).length > 0) {
        return null;
    }

    return (
        <LanguageProvider>
            <AuthProvider>
                <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <Stack
                        screenOptions={{
                            headerStyle: {
                                backgroundColor: '#FFFFFF',
                            } as any,
                            headerTitleStyle: {
                                fontWeight: '600',
                                fontSize: 18,
                                color: '#1A1A1A',
                            },
                            headerTintColor: '#1A1A1A',
                            headerShadowVisible: false,
                            contentStyle: {
                                backgroundColor: '#F8FAFC',
                            },
                        }}
                    >
                        <Stack.Screen
                            name="index"
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="(auth)"
                            options={{
                                headerShown: false,
                                presentation: 'modal'
                            }}
                        />
                        <Stack.Screen
                            name="restaurant/[slug]"
                            options={{
                                headerShown: false,
                            }}
                        />
                        <Stack.Screen
                            name="(tabs)"
                            options={{
                                headerShown: false
                            }}
                        />
                    </Stack>
                    <StatusBar style="dark" />
                </View>
            </AuthProvider>
        </LanguageProvider>
    );
}
