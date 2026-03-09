// components/translations-provider.tsx
"use client";

import React, { createContext, useContext, useMemo } from 'react';

const TranslationsContext = createContext<any>(null);

export function TranslationsProvider({ dictionary, children }: { dictionary: any; children: React.ReactNode }) {
    const t = useMemo(() => {
        return (key: string, vars?: Record<string, string | number>) => {
            const keys = key.split('.');
            let value: any = dictionary;
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
    }, [dictionary]);

    // We provide both 't' as a function and the 'raw' dictionary as 't' (legacy support/easy access)
    const contextValue = useMemo(() => {
        const base = (...args: any[]) => (t as any)(...args);
        Object.assign(base, dictionary);
        return { t: base };
    }, [t, dictionary]);

    return (
        <TranslationsContext.Provider value={contextValue}>
            {children}
        </TranslationsContext.Provider>
    );
}

export function useTranslations() {
    const context = useContext(TranslationsContext);
    if (!context) {
        return { t: (key: string) => key };
    }
    return context;
}
