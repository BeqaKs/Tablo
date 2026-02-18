'use client';

import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    title: string;
    message: string;
    ctaText?: string;
    ctaLink?: string;
}

export function EmptyState({ title, message, ctaText, ctaLink }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <CalendarDays className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
            {ctaText && ctaLink && (
                <Link href={ctaLink}>
                    <Button className="bg-primary hover:bg-tablo-red-600">
                        {ctaText}
                    </Button>
                </Link>
            )}
        </div>
    );
}
