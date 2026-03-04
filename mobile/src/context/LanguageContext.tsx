import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../localization/i18n';
import * as Localization from 'expo-localization';

type LanguageType = 'en' | 'ka';

interface LanguageContextType {
    language: LanguageType;
    setLanguage: (lang: LanguageType) => Promise<void>;
    isLanguageLoaded: boolean;
    hasSelectedLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<LanguageType>('en');
    const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);
    const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);

    useEffect(() => {
        loadLanguagePreference();
    }, []);

    const loadLanguagePreference = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('user-language');

            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ka')) {
                i18n.locale = savedLanguage;
                setLanguageState(savedLanguage);
                setHasSelectedLanguage(true);
            } else {
                // If no preference is saved, we don't set it immediately, 
                // but default to device locale for initial load.
                // We'll leave it as 'en' or user's system 'ka' but without saving
                const systemLang = Localization.getLocales()[0]?.languageCode === 'ka' ? 'ka' : 'en';
                i18n.locale = systemLang;
                setLanguageState(systemLang);
                setHasSelectedLanguage(false);
            }
        } catch (error) {
            console.error('Failed to load language preference:', error);
        } finally {
            setIsLanguageLoaded(true);
        }
    };

    const setLanguage = async (newLang: LanguageType) => {
        try {
            await AsyncStorage.setItem('user-language', newLang);
            i18n.locale = newLang;
            setLanguageState(newLang);
            setHasSelectedLanguage(true);
        } catch (error) {
            console.error('Failed to save language preference:', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isLanguageLoaded, hasSelectedLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
