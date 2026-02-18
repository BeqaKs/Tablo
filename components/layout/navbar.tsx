'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/lib/locale-context';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export function Navbar() {
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        setUserRole(profile?.role || null);
      }
    }
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="tracking-tight">Tablo.</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/restaurants" className="text-sm font-medium text-foreground hover:text-primary smooth-transition">
              {t('navigation.restaurants')}
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-foreground hover:text-primary smooth-transition">
              {t('navigation.howItWorks')}
            </Link>
            <Link href="#" className="text-sm font-medium text-foreground hover:text-primary smooth-transition">
              {t('navigation.about')}
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {user ? (
              <>
                {/* Show Admin Dashboard for admins */}
                {userRole === 'admin' && (
                  <Link href="/dashboard/admin">
                    <Button variant="ghost" size="sm">
                      Admin Panel
                    </Button>
                  </Link>
                )}
                {/* Show Dashboard only for restaurant owners */}
                {userRole === 'restaurant_owner' && (
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      {t('navigation.dashboard')}
                    </Button>
                  </Link>
                )}
                {/* Show My Bookings for customers */}
                {userRole === 'customer' && (
                  <Link href="/my-bookings">
                    <Button variant="ghost" size="sm">
                      {t('navigation.myBookings')}
                    </Button>
                  </Link>
                )}
                {/* Profile link for all logged-in users */}
                <Link href="/profile">
                  <Button size="sm" className="bg-primary hover:bg-tablo-red-600">
                    {t('navigation.profile')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('navigation.signIn')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-primary hover:bg-tablo-red-600">
                    {t('navigation.forRestaurants')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
