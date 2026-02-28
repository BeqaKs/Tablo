import { cookies } from 'next/headers';
import enMessages from '@/messages/en.json';
import kaMessages from '@/messages/ka.json';

export type Locale = 'en' | 'ka';
export type Messages = typeof enMessages;

const messages: Record<Locale, Messages> = {
    en: enMessages,
    ka: kaMessages,
};

export async function getDictionary() {
    const cookieStore = await cookies();
    const localeStr = cookieStore.get('NEXT_LOCALE')?.value;
    const locale: Locale = (localeStr === 'en' || localeStr === 'ka') ? localeStr : 'ka'; // Default to Georgian

    // Server-side translation function
    const t = (key: string, vars?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = messages[locale];

        for (const k of keys) {
            value = value?.[k];
        }

        let result = value || key;

        if (typeof result === 'string' && vars) {
            for (const [k, v] of Object.entries(vars)) {
                result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            }
        }

        return result;
    };

    return { t, locale };
}
