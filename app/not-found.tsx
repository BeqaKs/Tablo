'use client';

import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/locale-context';

export default function NotFound() {
    const { t } = useLocale();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-8">
            <div className="text-center max-w-md">
                <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-6">
                    <UtensilsCrossed className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-7xl font-bold text-primary mb-2">404</h1>
                <h2 className="text-2xl font-semibold mb-4 tracking-tight">{t('notFound.title')}</h2>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('notFound.description')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-8">
                            {t('notFound.goHome')}
                        </Button>
                    </Link>
                    <Link href="/restaurants">
                        <Button size="lg" variant="outline" className="rounded-full px-8">
                            {t('notFound.browseRestaurants')}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
