import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Colors } from '../constants/Colors';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    colors: typeof Colors.light;
    setTheme: (theme: ThemeType | 'system') => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = Appearance.getColorScheme();
    const [themePreference, setThemePreference] = useState<ThemeType | 'system'>('system');
    const [currentTheme, setCurrentTheme] = useState<ThemeType>(systemColorScheme === 'dark' ? 'dark' : 'light');

    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (themePreference === 'system') {
                setCurrentTheme(colorScheme === 'dark' ? 'dark' : 'light');
            }
        });

        return () => subscription.remove();
    }, [themePreference]);

    const handleSetTheme = (newTheme: ThemeType | 'system') => {
        setThemePreference(newTheme);
        if (newTheme === 'system') {
            setCurrentTheme(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');
        } else {
            setCurrentTheme(newTheme);
        }
    };

    const isDark = currentTheme === 'dark';
    const activeColors = isDark ? Colors.dark : Colors.light;

    return (
        <ThemeContext.Provider
            value={{
                theme: currentTheme,
                colors: activeColors,
                setTheme: handleSetTheme,
                isDark,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
