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
              <p className="text-sm leading-relaxed mb-4">
                {t('footer.description')}
              </p>
              <div className="flex gap-3 mt-4">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 smooth-transition text-xs font-bold">f</a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 smooth-transition text-xs font-bold">ig</a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 smooth-transition text-xs font-bold">x</a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-white/80 text-sm uppercase tracking-widest mb-5">{t('footer.forDiners')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/restaurants" className="hover:text-white smooth-transition">{t('navigation.restaurants')}</a></li>
                <li><a href="/#how-it-works" className="hover:text-white smooth-transition">{t('navigation.howItWorks')}</a></li>
                <li><a href="/my-bookings" className="hover:text-white smooth-transition">{t('navigation.myBookings')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white/80 text-sm uppercase tracking-widest mb-5">{t('footer.forRestaurants')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/contact" className="hover:text-white smooth-transition">{t('footer.partnerWithUs')}</a></li>
                <li><a href="/login" className="hover:text-white smooth-transition">{t('navigation.forRestaurants')}</a></li>
                <li><a href="/about" className="hover:text-white smooth-transition">{t('footer.featuresAndBenefits')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white/80 text-sm uppercase tracking-widest mb-5">{t('footer.company')}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/about" className="hover:text-white smooth-transition">{t('navigation.about')}</a></li>
                <li><a href="/contact" className="hover:text-white smooth-transition">{t('navigation.contact')}</a></li>
                <li><a href="/privacy" className="hover:text-white smooth-transition">{t('footer.privacyPolicy')}</a></li>
                <li><a href="/terms" className="hover:text-white smooth-transition">{t('footer.termsAndConditions')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} Tablo LLC. {t('footer.allRightsReserved')}</p>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-white/70 smooth-transition">{t('footer.privacy')}</a>
              <a href="/terms" className="hover:text-white/70 smooth-transition">{t('footer.terms')}</a>
              <a href="/contact" className="hover:text-white/70 smooth-transition">{t('navigation.contact')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
