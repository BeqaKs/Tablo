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

import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function RootLayoutNav() {
    const { colors, theme } = useTheme();
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.background,
                    } as any,
                    headerTitleStyle: {
                        fontWeight: '600',
                        fontSize: 18,
                        color: colors.text,
                    },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: colors.surface,
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
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        </View>
    );
}

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
                <ThemeProvider>
                    <RootLayoutNav />
                </ThemeProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
