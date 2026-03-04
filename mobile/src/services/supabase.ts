import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://woqaooqedogwuxukiite.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWFvb3FlZG9nd3V4dWtpaXRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODc2OTksImV4cCI6MjA4Njg2MzY5OX0.9DNp4VCg84EQyLjB6eaO-rn081vTMJoEsJgsY3naZD0';

// Use dynamic require for native-only modules to avoid bundling issues on web
const getStorage = () => {
    if (Platform.OS === 'web') {
        return {
            getItem: (key: string) => Promise.resolve(typeof (global as any).window !== 'undefined' ? (global as any).window.localStorage.getItem(key) : null),
            setItem: (key: string, value: string) => {
                if (typeof (global as any).window !== 'undefined') (global as any).window.localStorage.setItem(key, value);
                return Promise.resolve();
            },
            removeItem: (key: string) => {
                if (typeof (global as any).window !== 'undefined') (global as any).window.localStorage.removeItem(key);
                return Promise.resolve();
            },
        };
    } else {
        // This will only be executed on native
        const SecureStore = require('expo-secure-store');
        return {
            getItem: (key: string) => SecureStore.getItemAsync(key),
            setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
            removeItem: (key: string) => SecureStore.deleteItemAsync(key),
        };
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: getStorage() as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
