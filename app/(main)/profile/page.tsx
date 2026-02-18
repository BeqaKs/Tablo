'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProfile } from '@/app/actions/profile';
import { ProfileForm } from '@/components/customer/profile-form';
import { useLocale } from '@/lib/locale-context';
import { User } from '@supabase/supabase-js';
import { Loader2, LogOut } from 'lucide-react';
import { signout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
    const { t } = useLocale();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                window.location.href = '/login';
                return;
            }
            setUser(user);

            let { profile: p, error: e } = await getProfile(user.id);

            // If profile doesn't exist, create it
            if (!p && !e) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email || '',
                        full_name: user.user_metadata?.full_name || '',
                        role: 'customer',
                    });

                if (insertError) {
                    setError(insertError.message);
                    setIsLoading(false);
                    return;
                }

                const result = await getProfile(user.id);
                p = result.profile;
                e = result.error;
            }

            if (e) {
                setError(e);
            } else {
                setProfile(p);
            }
            setIsLoading(false);
        }
        loadData();
    }, [supabase]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{t('common.error')}</h2>
                    <p className="text-muted-foreground">{error || 'Profile not found'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="max-w-4xl mx-auto px-8 py-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{t('profile.title')}</h1>
                        <p className="text-lg text-muted-foreground">
                            {t('profile.subtitle')}
                        </p>
                    </div>
                    <form action={signout}>
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2">
                            <LogOut className="h-4 w-4" />
                            {t('navigation.signOut')}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-8">
                <ProfileForm profile={profile} />
            </div>
        </div>
    );
}
