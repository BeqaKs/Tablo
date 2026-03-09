// mobile/src/localization/i18n.ts
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import en from './en.json';
import ka from './ka.json';

const translations = {
    en,
    ka,
};

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app
i18n.locale = Localization.getLocales()[0].languageCode ?? 'en';

// Enable fallbacks if a translation is missing
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const t = (key: string, options?: any) => i18n.t(key, options);

export default i18n;
