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
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Tablo</h3>
              <p className="text-sm text-muted-foreground">
                Premium restaurant reservations in Tbilisi
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.forDiners')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/restaurants" className="hover:text-primary">{t('navigation.restaurants')}</a></li>
                <li><a href="#" className="hover:text-primary">{t('navigation.howItWorks')}</a></li>
                <li><a href="#" className="hover:text-primary">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.forRestaurants')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/login" className="hover:text-primary">{t('navigation.forRestaurants')}</a></li>
                <li><a href="#" className="hover:text-primary">Join Tablo</a></li>
                <li><a href="#" className="hover:text-primary">Features</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.company')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">{t('navigation.about')}</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Tablo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}