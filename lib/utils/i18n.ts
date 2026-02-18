/**
 * Internationalization utilities for Georgian/English localization
 */

export type Locale = 'en' | 'ka'; // English | Georgian (ქართული)

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Translation keys for common UI elements
 * Future: These will be replaced with actual translation files
 */
export const translations = {
    en: {
        common: {
            search: 'Search',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            confirm: 'Confirm',
            loading: 'Loading...',
        },
        dashboard: {
            overview: 'Overview',
            calendar: 'Calendar',
            floorPlan: 'Floor Plan',
            guests: 'Guests',
            settings: 'Settings',
            signOut: 'Sign Out',
        },
        booking: {
            findTable: 'Find a Table',
            selectDate: 'Select Date',
            selectTime: 'Select Time',
            partySize: 'Party Size',
            confirmBooking: 'Confirm Booking',
            bookingConfirmed: 'Booking Confirmed',
        },
        restaurant: {
            open: 'Open',
            closed: 'Closed',
            serviceStatus: 'Service Status',
        },
    },
    ka: {
        // Georgian translations - placeholder for future implementation
        common: {
            search: 'ძებნა',
            save: 'შენახვა',
            cancel: 'გაუქმება',
            delete: 'წაშლა',
            edit: 'რედაქტირება',
            close: 'დახურვა',
            confirm: 'დადასტურება',
            loading: 'იტვირთება...',
        },
        dashboard: {
            overview: 'მიმოხილვა',
            calendar: 'კალენდარი',
            floorPlan: 'იატაკის გეგმა',
            guests: 'სტუმრები',
            settings: 'პარამეტრები',
            signOut: 'გასვლა',
        },
        booking: {
            findTable: 'მაგიდის პოვნა',
            selectDate: 'აირჩიეთ თარიღი',
            selectTime: 'აირჩიეთ დრო',
            partySize: 'სტუმრების რაოდენობა',
            confirmBooking: 'დაჯავშნის დადასტურება',
            bookingConfirmed: 'დაჯავშნა დადასტურებულია',
        },
        restaurant: {
            open: 'ღია',
            closed: 'დახურული',
            serviceStatus: 'სერვისის სტატუსი',
        },
    },
};

/**
 * Get translation for a key
 * @param key - Translation key (e.g., 'common.search')
 * @param locale - Target locale
 * @returns Translated string
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
        value = value?.[k];
    }

    return value || key;
}

/**
 * Detect user's preferred locale
 * Future: Will check browser settings and user preferences
 */
export function detectLocale(): Locale {
    // For now, default to English
    // Future: Check navigator.language and user preferences
    return DEFAULT_LOCALE;
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, locale: Locale = DEFAULT_LOCALE): string {
    return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

/**
 * Format time according to locale
 */
export function formatTime(date: Date, locale: Locale = DEFAULT_LOCALE): string {
    return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}
