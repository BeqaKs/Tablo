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

    const contextValue = useMemo(() => {
        const base = (...args: any[]) => (t as any)(...args);

        // Use a Proxy instead of Object.assign to safely expose dictionary keys
        // without accidentally overwriting inherited Function properties (like .apply, .call, .name, .map, etc.)
        const proxy = new Proxy(base, {
            get(target, prop, receiver) {
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }
                return dictionary[prop as string];
            }
        });

        return { t: proxy };
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
