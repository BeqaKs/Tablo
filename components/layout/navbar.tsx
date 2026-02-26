'use client';

import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <nav
          className={cn(
            'pointer-events-auto mt-4 mx-4 px-4 md:px-6 h-14 flex items-center gap-1 rounded-full transition-all duration-500 ease-out',
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

          {/* Center nav links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            <Link
              href="/restaurants"
              className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
            >
              {t('navigation.restaurants')}
            </Link>
            <Link
              href="/#how-it-works"
              className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
            >
              {t('navigation.howItWorks')}
            </Link>
            <Link
              href="/about"
              className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
            >
              {t('navigation.about')}
            </Link>
            <Link
              href="/contact"
              className="px-3 py-1.5 text-sm font-medium text-foreground/80 hover:text-foreground rounded-full hover:bg-white/40 smooth-transition"
            >
              {t('navigation.contact')}
            </Link>
          </div>

          {/* Right actions — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1.5 ml-auto shrink-0">
            <LanguageSwitcher />

            {user ? (
              <>
                {userRole === 'admin' && (
                  <Link href="/dashboard/admin">
                    <Button variant="ghost" size="sm" className="rounded-full text-foreground/80 hover:text-foreground hover:bg-white/40 h-8 px-3 text-xs">
                      {t('navigation.adminPanel')}
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

          {/* Mobile: language switcher + hamburger */}
          <div className="flex md:hidden items-center gap-2 ml-auto">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-full hover:bg-white/30 smooth-transition"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border p-6 space-y-1 animate-in slide-in-from-top-2 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href="/restaurants"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-gray-50 smooth-transition"
            >
              {t('navigation.restaurants')}
            </Link>
            <Link
              href="/#how-it-works"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-gray-50 smooth-transition"
            >
              {t('navigation.howItWorks')}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-gray-50 smooth-transition"
            >
              {t('navigation.about')}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium rounded-xl hover:bg-gray-50 smooth-transition"
            >
              {t('navigation.contact')}
            </Link>

            <div className="pt-6 mt-6 border-t space-y-4">
              {user ? (
                <>
                  {userRole === 'admin' && (
                    <Link href="/dashboard/admin" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full justify-start rounded-xl h-11">
                        {t('navigation.adminPanel')}
                      </Button>
                    </Link>
                  )}
                  {userRole === 'restaurant_owner' && (
                    <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full justify-start rounded-xl h-11">
                        {t('navigation.dashboard')}
                      </Button>
                    </Link>
                  )}
                  {userRole === 'customer' && (
                    <Link href="/my-bookings" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full justify-start rounded-xl h-11">
                        {t('navigation.myBookings')}
                      </Button>
                    </Link>
                  )}
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl h-11">
                      {t('navigation.profile')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-xl h-11">
                      {t('navigation.signIn')}
                    </Button>
                  </Link>
                  <Link href="/login?signup=true" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full rounded-xl h-11">
                      {t('auth.signUp')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
