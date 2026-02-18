'use client';

import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
    const { locale, setLocale } = useLocale();
    const [isOpen, setIsOpen] = useState(false);

    const switchLocale = (newLocale: 'en' | 'ka') => {
        setLocale(newLocale);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full text-foreground/80 hover:text-foreground hover:bg-white/40 h-8 px-2.5 text-xs gap-1.5"
            >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">
                    {locale === 'ka' ? 'ქარ' : 'EN'}
                </span>
            </Button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute right-0 mt-3 w-44 liquid-glass-dense rounded-2xl z-50 overflow-hidden py-1">
                        <button
                            onClick={() => switchLocale('ka')}
                            className={cn(
                                'w-full px-4 py-2.5 text-left smooth-transition flex items-center gap-3 text-sm',
                                locale === 'ka'
                                    ? 'bg-white/40 font-medium text-foreground'
                                    : 'text-foreground/70 hover:bg-white/30 hover:text-foreground'
                            )}
                        >
                            <span className="text-lg">🇬🇪</span>
                            <span>ქართული</span>
                            {locale === 'ka' && (
                                <span className="ml-auto text-primary text-xs">✓</span>
                            )}
                        </button>

                        <button
                            onClick={() => switchLocale('en')}
                            className={cn(
                                'w-full px-4 py-2.5 text-left smooth-transition flex items-center gap-3 text-sm',
                                locale === 'en'
                                    ? 'bg-white/40 font-medium text-foreground'
                                    : 'text-foreground/70 hover:bg-white/30 hover:text-foreground'
                            )}
                        >
                            <span className="text-lg">🇬🇧</span>
                            <span>English</span>
                            {locale === 'en' && (
                                <span className="ml-auto text-primary text-xs">✓</span>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
