'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from '@/lib/locale-context';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { t } = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <nav
        className={cn(
          'pointer-events-auto mt-4 mx-4 px-6 h-14 flex items-center gap-1 rounded-full transition-all duration-500 ease-out',
          scrolled
            ? 'liquid-glass-dense shadow-soft-lg max-w-4xl w-full'
            : 'liquid-glass max-w-5xl w-full'
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg mr-2 shrink-0">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span className="tracking-tight">Tablo</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          <Link
            href="/restaurants"
            className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
          >
            {t('navigation.restaurants')}
          </Link>
          <Link
            href="#how-it-works"
            className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
          >
            {t('navigation.howItWorks')}
          </Link>
          <Link
            href="#"
            className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
          >
            {t('navigation.about')}
          </Link>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <LanguageSwitcher />

          {user ? (
            <>
              {userRole === 'admin' && (
                <Link href="/dashboard/admin">
                  <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground hover:bg-white/40 h-8 px-3 text-xs">
                    Admin Panel
                  </Button>
                </Link>
              )}
              {userRole === 'restaurant_owner' && (
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground hover:bg-white/40 h-8 px-3 text-xs">
                    {t('navigation.dashboard')}
                  </Button>
                </Link>
              )}
              {userRole === 'customer' && (
                <Link href="/my-bookings">
                  <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground hover:bg-white/40 h-8 px-3 text-xs">
                    {t('navigation.myBookings')}
                  </Button>
                </Link>
              )}
              <Link href="/profile">
                <Button size="sm" className="rounded-full h-8 px-4 text-xs">
                  {t('navigation.profile')}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground hover:bg-white/40 h-8 px-3 text-xs">
                  {t('navigation.signIn')}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="sm" className="rounded-full h-8 px-4 text-xs">
                  {t('navigation.forRestaurants')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
