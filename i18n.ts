export const locales = ['en', 'ka'] as const;
export const defaultLocale = 'ka' as const;

export type Locale = (typeof locales)[number];
