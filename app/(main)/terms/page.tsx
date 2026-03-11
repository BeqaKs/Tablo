'use client';

import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';

export default function TermsPage() {
    const { t } = useLocale();
    const lastUpdated = '2026-02-25';

    const sections = [
        { title: t('terms.section1Title'), content: t('terms.section1Content') },
        { title: t('terms.section2Title'), content: t('terms.section2Content') },
        { title: t('terms.section3Title'), content: t('terms.section3Content') },
        { title: t('terms.section4Title'), content: t('terms.section4Content') },
        { title: t('terms.section5Title'), content: t('terms.section5Content') },
        { title: t('terms.section6Title'), content: t('terms.section6Content') },
        { title: t('terms.section7Title'), content: t('terms.section7Content') },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-8 pt-28 pb-12">
                    <div className="flex items-center gap-2 text-primary mb-4">
                        <UtensilsCrossed className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-widest">{t('terms.title')}</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">{t('terms.title')}</h1>
                    <p className="text-muted-foreground">{t('terms.lastUpdated')}: {lastUpdated}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="space-y-8">
                    <section className="bg-white border rounded-2xl p-8">
                        <p className="text-muted-foreground leading-relaxed">{t('terms.intro')}</p>
                    </section>

                    {sections.map((section, i) => (
                        <section key={i} className="bg-white border rounded-2xl p-8">
                            <h2 className="text-xl font-semibold mb-4">{i + 1}. {section.title}</h2>
                            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                        </section>
                    ))}
                </div>

                <div className="mt-12 text-center text-sm text-muted-foreground">
                    <p>
                        <Link href="/privacy" className="text-primary hover:underline">{t('footer.privacyPolicy')}</Link>
                        {' · '}
                        <Link href="/about" className="text-primary hover:underline">{t('navigation.about')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
