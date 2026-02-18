'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, MapPin, Clock, Users, Star, TrendingUp, CalendarCheck } from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

export default function HomePage() {
  const { t } = useLocale();

  const featuredRestaurants = [
    {
      id: 1,
      name: 'Shavi Lomi',
      cuisine: 'Georgian Fine Dining',
      image: '/placeholder-restaurant.jpg',
      rating: 4.8,
      priceRange: '$$$',
      location: 'Vera, Tbilisi',
    },
    {
      id: 2,
      name: 'Barbarestan',
      cuisine: 'Traditional Georgian',
      image: '/placeholder-restaurant.jpg',
      rating: 4.9,
      priceRange: '$$',
      location: 'Old Tbilisi',
    },
    {
      id: 3,
      name: 'Café Gabriadze',
      cuisine: 'European & Georgian',
      image: '/placeholder-restaurant.jpg',
      rating: 4.7,
      priceRange: '$$',
      location: 'Old Tbilisi',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #e11d48 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium animate-fade-in">
            {t('home.hero.badge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in">
            {t('home.hero.title1')}{' '}
            <span className="bg-gradient-to-r from-primary to-tablo-red-600 bg-clip-text text-transparent">
              {t('home.hero.highlight')}
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto animate-fade-in">
            {t('home.hero.subtitle')}
          </p>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-luxury p-3 flex flex-col md:flex-row gap-3 animate-fade-in">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('home.search.placeholder')}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <select className="bg-transparent border-none outline-none text-foreground">
                  <option>{t('home.search.today')}</option>
                  <option>{t('home.search.tomorrow')}</option>
                  <option>{t('home.search.thisWeekend')}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <Users className="h-5 w-5 text-muted-foreground" />
                <select className="bg-transparent border-none outline-none text-foreground">
                  <option>2 {t('home.search.guests')}</option>
                  <option>3 {t('home.search.guests')}</option>
                  <option>4 {t('home.search.guests')}</option>
                  <option>5+ {t('home.search.guests')}</option>
                </select>
              </div>
            </div>

            <Button size="lg" className="bg-primary hover:bg-tablo-red-600 text-white rounded-xl px-8 smooth-transition shadow-md">
              {t('home.search.button')}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>50+ {t('home.stats.restaurants')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <span>{t('home.stats.instant')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{t('home.stats.tbilisi')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-2">{t('home.featured.title')}</h2>
              <p className="text-muted-foreground">{t('home.featured.subtitle')}</p>
            </div>
            <Link href="/restaurants">
              <Button variant="outline" size="lg">
                {t('home.featured.viewAll')}
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="group premium-card rounded-2xl overflow-hidden hover:shadow-luxury-lg smooth-transition"
              >
                <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded">
                        {restaurant.priceRange}
                      </span>
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        {restaurant.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary smooth-transition">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {restaurant.location}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. {t('home.howItWorks.step1.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.howItWorks.step1.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. {t('home.howItWorks.step2.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.howItWorks.step2.description')}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
                <CalendarCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. {t('home.howItWorks.step3.title')}</h3>
              <p className="text-muted-foreground">
                {t('home.howItWorks.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-tablo-red-600 text-white">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl mb-8 text-white/90">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100 border-none">
                {t('home.cta.button1')}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              {t('home.cta.button2')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}