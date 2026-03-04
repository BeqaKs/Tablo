import { Redirect } from 'expo-router';
import { useLanguage } from '../src/context/LanguageContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    const { isLanguageLoaded, hasSelectedLanguage } = useLanguage();

    if (!isLanguageLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!hasSelectedLanguage) {
        return <Redirect href="/language-selection" />;
    }

    return <Redirect href="/(tabs)" />;
}

