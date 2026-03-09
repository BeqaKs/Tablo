import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/Colors';
import { useLanguage } from '../src/context/LanguageContext';
import { Globe } from 'lucide-react-native';

export default function LanguageSelectionScreen() {
    const router = useRouter();
    const { setLanguage } = useLanguage();

    const handleSelectLanguage = async (lang: 'en' | 'ka') => {
        await setLanguage(lang);
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Globe size={48} color={Colors.primary} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.title}>Welcome to Tablo</Text>
                    <Text style={styles.subtitle}>Please select your preferred language</Text>
                </View>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.languageOption}
                        onPress={() => handleSelectLanguage('en')}
                    >
                        <Text style={styles.languageText}>English</Text>
                        <Text style={styles.languageSubtext}>English</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.languageOption}
                        onPress={() => handleSelectLanguage('ka')}
                    >
                        <Text style={styles.languageText}>ქართული</Text>
                        <Text style={styles.languageSubtext}>Georgian</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 64,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    optionsContainer: {
        gap: 16,
    },
    languageOption: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    languageText: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    languageSubtext: {
        fontSize: 14,
        color: Colors.textMuted,
        fontWeight: '600',
    }
});
