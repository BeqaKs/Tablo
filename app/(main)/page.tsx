'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Search, MapPin, Clock, Users, Star, TrendingUp, CalendarCheck, ArrowRight } from 'lucide-react';
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
      <section className="relative min-h-[680px] flex items-center justify-center luxury-page-bg overflow-hidden pt-24">
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/[0.08] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 liquid-glass-subtle rounded-full text-sm font-medium text-foreground/80 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {t('home.hero.badge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-semibold tracking-tight mb-6 animate-fade-in text-foreground leading-[1.1]">
            {t('home.hero.title1')}{' '}
            <span className="text-primary">
              {t('home.hero.highlight')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-14 max-w-2xl mx-auto animate-fade-in leading-relaxed">
            {t('home.hero.subtitle')}
          </p>

          {/* Search Bar — liquid glass */}
          <div className="max-w-4xl mx-auto liquid-glass-dense rounded-full p-2 flex flex-col md:flex-row gap-2 animate-fade-in">
            <div className="flex-1 flex items-center gap-3 px-5 py-3 bg-white/30 rounded-full">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('home.search.placeholder')}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>

            <div className="hidden md:flex gap-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/30 rounded-full">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <select className="bg-transparent border-none outline-none text-foreground text-sm">
                  <option>{t('home.search.today')}</option>
                  <option>{t('home.search.tomorrow')}</option>
                  <option>{t('home.search.thisWeekend')}</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-white/30 rounded-full">
                <Users className="h-4 w-4 text-muted-foreground" />
                <select className="bg-transparent border-none outline-none text-foreground text-sm">
                  <option>2 {t('home.search.guests')}</option>
                  <option>3 {t('home.search.guests')}</option>
                  <option>4 {t('home.search.guests')}</option>
                  <option>5+ {t('home.search.guests')}</option>
                </select>
              </div>
            </div>

            <Button size="lg" className="rounded-full px-8 h-12 text-sm smooth-transition">
              {t('home.search.button')}
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="mt-14 flex items-center justify-center gap-8 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary/70" />
              <span>50+ {t('home.stats.restaurants')}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary/70" />
              <span>{t('home.stats.instant')}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary/70" />
              <span>{t('home.stats.tbilisi')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="py-24 bg-background relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Curated for you</p>
              <h2 className="text-4xl font-semibold tracking-tight">{t('home.featured.title')}</h2>
              <p className="text-muted-foreground mt-2">{t('home.featured.subtitle')}</p>
            </div>
            <Link href="/restaurants">
              <Button variant="ghost" size="sm" className="rounded-full gap-2 text-foreground/70 hover:text-foreground">
                {t('home.featured.viewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                href={`/restaurants/${restaurant.id}`}
                className="group premium-card rounded-2xl overflow-hidden"
              >
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                    <span className="liquid-glass-subtle px-2.5 py-1 text-white text-xs font-medium rounded-full">
                      {restaurant.priceRange}
                    </span>
                    <span className="liquid-glass-subtle px-2.5 py-1 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      {restaurant.rating}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-1.5 group-hover:text-primary smooth-transition">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{restaurant.cuisine}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {restaurant.location}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="divider-fade mx-auto w-full max-w-5xl" />

      {/* How It Works */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Simple & Quick</p>
            <h2 className="text-4xl font-semibold tracking-tight mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, step: '1', titleKey: 'home.howItWorks.step1.title', descKey: 'home.howItWorks.step1.description' },
              { icon: MapPin, step: '2', titleKey: 'home.howItWorks.step2.title', descKey: 'home.howItWorks.step2.description' },
              { icon: CalendarCheck, step: '3', titleKey: 'home.howItWorks.step3.title', descKey: 'home.howItWorks.step3.description' },
            ].map(({ icon: Icon, step, titleKey, descKey }) => (
              <div key={step} className="group text-center liquid-glass-subtle rounded-3xl p-8 smooth-transition hover:shadow-soft">
                <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 smooth-transition">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  <span className="text-primary/50 mr-1">{step}.</span>
                  {t(titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-primary/80" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-white">
            {t('home.cta.title')}
          </h2>
          <p className="text-lg mb-10 text-white/70 max-w-xl mx-auto leading-relaxed">
            {t('home.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="rounded-full bg-white text-foreground hover:bg-white/90 border-none px-8 h-12">
                {t('home.cta.button1')}
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8 h-12">
              {t('home.cta.button2')}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
