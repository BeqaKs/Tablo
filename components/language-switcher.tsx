'use client';

import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState } from 'react';

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
                className="flex items-center gap-2"
            >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                    {locale === 'ka' ? 'ქართული' : 'English'}
                </span>
                <span className="text-lg">
                    {locale === 'ka' ? '🇬🇪' : '🇬🇧'}
                </span>
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
                        <button
                            onClick={() => switchLocale('ka')}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 smooth-transition flex items-center gap-3 ${locale === 'ka' ? 'bg-gray-50 font-medium' : ''
                                }`}
                        >
                            <span className="text-2xl">🇬🇪</span>
                            <span>ქართული</span>
                            {locale === 'ka' && (
                                <span className="ml-auto text-primary">✓</span>
                            )}
                        </button>

                        <button
                            onClick={() => switchLocale('en')}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 smooth-transition flex items-center gap-3 ${locale === 'en' ? 'bg-gray-50 font-medium' : ''
                                }`}
                        >
                            <span className="text-2xl">🇬🇧</span>
                            <span>English</span>
                            {locale === 'en' && (
                                <span className="ml-auto text-primary">✓</span>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
