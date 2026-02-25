'use client';

import { UtensilsCrossed } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';

export default function PrivacyPolicyPage() {
    const { t } = useLocale();
    const lastUpdated = '2026-02-25';

    const sections = [
        { title: t('privacy.section1Title'), content: t('privacy.section1Content') },
        { title: t('privacy.section2Title'), content: t('privacy.section2Content') },
        { title: t('privacy.section3Title'), content: t('privacy.section3Content') },
        { title: t('privacy.section4Title'), content: t('privacy.section4Content') },
        { title: t('privacy.section5Title'), content: t('privacy.section5Content') },
        { title: t('privacy.section6Title'), content: t('privacy.section6Content') },
        { title: t('privacy.section7Title'), content: t('privacy.section7Content') },
        { title: t('privacy.section8Title'), content: t('privacy.section8Content') },
        { title: t('privacy.section9Title'), content: t('privacy.section9Content') },
        { title: t('privacy.section10Title'), content: t('privacy.section10Content') },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-8 pt-28 pb-12">
                    <div className="flex items-center gap-2 text-primary mb-4">
                        <UtensilsCrossed className="h-5 w-5" />
                        <span className="text-sm font-semibold uppercase tracking-widest">{t('privacy.title')}</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-3">{t('privacy.title')}</h1>
                    <p className="text-muted-foreground">{t('privacy.lastUpdated')}: {lastUpdated}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                <div className="space-y-8">
                    <section className="bg-white border rounded-2xl p-8">
                        <p className="text-muted-foreground leading-relaxed">{t('privacy.intro')}</p>
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
                        <Link href="/terms" className="text-primary hover:underline">{t('footer.termsAndConditions')}</Link>
                        {' · '}
                        <Link href="/about" className="text-primary hover:underline">{t('navigation.about')}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
