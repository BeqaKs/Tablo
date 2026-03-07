import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'tablo_cache_';
const DEFAULT_EXPIRATION = 1000 * 60 * 60 * 24; // 24 hours

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export const cacheService = {
    /**
     * Save data to cache
     */
    async set<T>(key: string, data: T): Promise<void> {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
            };
            await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
        } catch (e) {
            console.warn('Cache write error:', e);
        }
    },

    /**
     * Get data from cache
     * @param key Cache key
     * @param maxAgeMax maximum age in milliseconds. Defaults to 24h. Pass Infinity to ignore age.
     */
    async get<T>(key: string, maxAgeMs: number = DEFAULT_EXPIRATION): Promise<T | null> {
        try {
            const value = await AsyncStorage.getItem(CACHE_PREFIX + key);
            if (!value) return null;

            const entry: CacheEntry<T> = JSON.parse(value);

            // Check expiration
            const age = Date.now() - entry.timestamp;
            if (age > maxAgeMs) {
                // Expired, clear it and return null
                await this.remove(key);
                return null;
            }

            return entry.data;
        } catch (e) {
            console.warn('Cache read error:', e);
            return null;
        }
    },

    /**
     * Remove a specific key from cache
     */
    async remove(key: string): Promise<void> {
        try {
            await AsyncStorage.removeItem(CACHE_PREFIX + key);
        } catch (e) {
            console.warn('Cache remove error:', e);
        }
    },

    /**
     * Clear all matching cache keys
     */
    async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(cacheKeys);
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }
};
