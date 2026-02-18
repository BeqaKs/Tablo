'use client';

import { Navbar } from '@/components/layout/navbar';
import { useLocale } from '@/lib/locale-context';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-foreground text-white/60">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <h3 className="font-semibold text-lg text-white mb-4 tracking-tight">Tablo</h3>
              <p className="text-sm leading-relaxed">
                Premium restaurant reservations in Tbilisi
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white/80 text-sm uppercase tracking-widest mb-5">{t('footer.forDiners')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/restaurants" className="hover:text-white smooth-transition">{t('navigation.restaurants')}</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">{t('navigation.howItWorks')}</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white/80 text-sm uppercase tracking-widest mb-5">{t('footer.forRestaurants')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/login" className="hover:text-white smooth-transition">{t('navigation.forRestaurants')}</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">Join Tablo</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white/80 text-sm uppercase tracking-widest mb-5">{t('footer.company')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white smooth-transition">{t('navigation.about')}</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">Contact</a></li>
                <li><a href="#" className="hover:text-white smooth-transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-14 pt-8 border-t border-white/10 text-center text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} Tablo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
