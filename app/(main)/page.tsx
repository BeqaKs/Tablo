'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Clock, Users, Star, TrendingUp, CalendarCheck,
  ArrowRight, Loader2, ChefHat, Sparkles, Eye, LayoutGrid, Shield, Utensils
} from 'lucide-react';
import { useLocale } from '@/lib/locale-context';

import { useState, useEffect, useRef } from 'react';
import { getRestaurants } from '@/app/actions/bookings';
import { Restaurant } from '@/types/database';

export default function HomePage() {
  const { t } = useLocale();
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    router.push(`/restaurants${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
  };

  useEffect(() => {
    async function loadRestaurants() {
      try {
        const result = await getRestaurants();
        if (result.data) {
          setRestaurants(result.data.slice(0, 6));
        }
        if (result.error) {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadRestaurants();
  }, []);

  // Auto-cycle features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const defaultImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
  ];

  const features = [
    {
      icon: Eye,
      title: t('home.howItWorks.step1.title'),
      description: t('home.howItWorks.step1.description'),
      badge: t('home.howItWorks.step1.badge'),
      gradient: 'from-rose-500/20 to-orange-500/20',
    },
    {
      icon: LayoutGrid,
      title: t('home.howItWorks.step2.title'),
      description: t('home.howItWorks.step2.description'),
      badge: t('home.howItWorks.step2.badge'),
      gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      icon: CalendarCheck,
      title: t('home.howItWorks.step3.title'),
      description: t('home.howItWorks.step3.description'),
      badge: t('home.howItWorks.step3.badge'),
      gradient: 'from-green-500/20 to-emerald-500/20',
    },
    {
      icon: ChefHat,
      title: t('home.howItWorks.step4.title'),
      description: t('home.howItWorks.step4.description'),
      badge: t('home.howItWorks.step4.badge'),
      gradient: 'from-purple-500/20 to-pink-500/20',
    },
  ];

  const stats = [
    { value: '50+', label: t('home.stats.restaurants'), icon: Utensils },
    { value: '10K+', label: t('home.stats.reservations'), icon: CalendarCheck },
    { value: '4.9★', label: t('home.stats.averageRating'), icon: Star },
    { value: '24/7', label: t('home.stats.availability'), icon: Clock },
  ];

  return (
    <div className="flex flex-col">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* Dark gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#0d1117]" />

          {/* Decorative orbs */}
          <div className="absolute top-[-10%] right-[15%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/8 blur-[100px] pointer-events-none" />
          <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-amber-500/6 blur-[80px] pointer-events-none" />

          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-8 pt-32 pb-20">
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full text-sm font-medium text-white/60 border border-white/10 bg-white/5 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              {t('home.hero.badge')}
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-tight mb-8 text-white leading-[1.05]">
              {t('home.hero.title1')}{' '}
              <span className="relative">
                <span className="relative z-10 bg-gradient-to-r from-rose-400 via-primary to-rose-300 bg-clip-text text-transparent">
                  {t('home.hero.highlight')}
                </span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/45 mb-14 max-w-2xl mx-auto leading-relaxed font-light">
              {t('home.hero.subtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-white/5 rounded-xl hover:bg-white/[0.08] smooth-transition">
                <Search className="h-4 w-4 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.search.placeholder')}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm"
                />
              </div>

              <div className="hidden md:flex gap-2">
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/[0.08] smooth-transition">
                  <Clock className="h-4 w-4 text-white/40" />
                  <select className="bg-transparent border-none outline-none text-white/70 text-sm cursor-pointer">
                    <option className="text-foreground">{t('home.search.today')}</option>
                    <option className="text-foreground">{t('home.search.tomorrow')}</option>
                    <option className="text-foreground">{t('home.search.thisWeekend')}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-xl hover:bg-white/[0.08] smooth-transition">
                  <Users className="h-4 w-4 text-white/40" />
                  <select className="bg-transparent border-none outline-none text-white/70 text-sm cursor-pointer">
                    <option className="text-foreground">2 {t('home.search.guests')}</option>
                    <option className="text-foreground">3 {t('home.search.guests')}</option>
                    <option className="text-foreground">4 {t('home.search.guests')}</option>
                    <option className="text-foreground">5+ {t('home.search.guests')}</option>
                  </select>
                </div>
              </div>

              <Button type="submit" size="lg" className="rounded-xl px-8 h-12 text-sm smooth-transition w-full md:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
                {t('home.search.button')}
              </Button>
            </form>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="text-center group">
                <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                <p className="text-xs text-white/35 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <div className="w-5 h-8 border border-white/20 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURED RESTAURANTS ═══════════════════ */}
      <section className="py-28 bg-background relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('home.featured.curatedForYou')}</p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">{t('home.featured.title')}</h2>
              <p className="text-muted-foreground mt-3 text-lg">{t('home.featured.subtitle')}</p>
            </div>
            <Link href="/restaurants">
              <Button variant="ghost" size="sm" className="rounded-full gap-2 text-foreground/70 hover:text-foreground hidden md:flex">
                {t('home.featured.viewAll')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">{t('home.featured.loadingRestaurants')}</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive mb-2">{t('home.featured.loadFailed')}</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : restaurants.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Utensils className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xl font-semibold mb-2">{t('home.featured.noRestaurants')}</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">{t('home.featured.noRestaurantsDesc')}</p>
              <Link href="/login">
                <Button size="lg" className="rounded-full px-8">{t('home.featured.getStarted')}</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Primary Feature Card — large */}
              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-6">
                <Link href={`/restaurants/${restaurants[0]?.slug}`} className="group">
                  <div className="relative aspect-[16/10] rounded-3xl overflow-hidden">
                    <img
                      src={restaurants[0]?.images?.[0] || defaultImages[0]}
                      alt={restaurants[0]?.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 smooth-transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-white/15 backdrop-blur-md text-white text-xs font-semibold rounded-full">
                          {restaurants[0]?.price_range || '$$$'}
                        </span>
                        <span className="px-3 py-1 bg-white/15 backdrop-blur-md text-white text-xs font-semibold rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {restaurants[0]?.rating || '4.9'}
                        </span>
                        <span className="px-3 py-1 bg-primary/80 backdrop-blur-md text-white text-xs font-semibold rounded-full hidden sm:inline">
                          {t('home.featured.featured')}
                        </span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">{restaurants[0]?.name}</h3>
                      <p className="text-white/60 text-sm">{restaurants[0]?.cuisine_type} · {restaurants[0]?.city}</p>
                    </div>
                  </div>
                </Link>

                {restaurants.length > 1 && (
                  <div className="flex flex-col gap-6">
                    {restaurants.slice(1, 3).map((r, i) => (
                      <Link key={r.id} href={`/restaurants/${r.slug}`} className="group flex-1">
                        <div className="relative h-full min-h-[200px] rounded-3xl overflow-hidden">
                          <img
                            src={r.images?.[0] || defaultImages[i + 1]}
                            alt={r.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 smooth-transition duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold rounded-full flex items-center gap-1">
                                <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                                {r.rating || '4.8'}
                              </span>
                              <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-[11px] font-semibold rounded-full">
                                {r.price_range || '$$$'}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold text-white">{r.name}</h3>
                            <p className="text-white/50 text-xs mt-0.5">{r.cuisine_type} · {r.city}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Remaining restaurants — smaller cards */}
              {restaurants.length > 3 && (
                <div className="grid md:grid-cols-3 gap-6">
                  {restaurants.slice(3, 6).map((restaurant, index) => {
                    const imgUrl = restaurant.images?.[0] || defaultImages[(index + 3) % defaultImages.length];
                    return (
                      <Link
                        key={restaurant.id}
                        href={`/restaurants/${restaurant.slug}`}
                        className="group"
                      >
                        <div className="premium-card rounded-2xl overflow-hidden">
                          <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                            <img
                              src={imgUrl}
                              alt={restaurant.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 smooth-transition duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-xs font-medium rounded-full flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {restaurant.rating || '4.8'}
                              </span>
                              <span className="px-2.5 py-1 bg-white/15 backdrop-blur-md text-white text-xs font-medium rounded-full">
                                {restaurant.price_range || '$$$'}
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="text-lg font-semibold mb-1 group-hover:text-primary smooth-transition">
                              {restaurant.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">{restaurant.cuisine_type}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {restaurant.city}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* View All (mobile) */}
              <div className="mt-10 text-center md:hidden">
                <Link href="/restaurants">
                  <Button variant="outline" size="lg" className="rounded-full gap-2 px-8">
                    {t('home.featured.viewAll')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-28 bg-muted/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />


        <div className="relative z-10 max-w-6xl mx-auto px-8">
          <div className="text-center mb-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('home.howItWorks.simpleQuick')}</p>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">{t('home.howItWorks.title')}</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">{t('home.howItWorks.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const isActive = activeFeature === i;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl p-7 smooth-transition cursor-pointer group ${isActive
                    ? 'bg-white shadow-luxury scale-[1.02] border border-primary/10'
                    : 'bg-white/50 border border-transparent hover:bg-white hover:shadow-soft'
                    }`}
                  onMouseEnter={() => setActiveFeature(i)}
                >
                  {/* Step number */}
                  <div className="absolute top-4 right-4 text-[52px] font-bold text-foreground/[0.04] leading-none select-none">
                    {i + 1}
                  </div>

                  {/* Badge */}
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full mb-5 smooth-transition ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {feature.badge}
                  </span>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 smooth-transition ${isActive ? 'bg-primary/10' : 'bg-gray-100 group-hover:bg-primary/5'
                    }`}>
                    <feature.icon className={`h-6 w-6 smooth-transition ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                  </div>

                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-t-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOR RESTAURANTS ═══════════════════ */}
      <section className="py-28 bg-background relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('home.forOwners.label')}</p>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 leading-tight">
                {t('home.cta.title')}
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                {t('home.cta.subtitle')}
              </p>

              <div className="space-y-5 mb-10">
                {[
                  { icon: LayoutGrid, title: t('home.forOwners.floorPlan'), desc: t('home.forOwners.floorPlanDesc') },
                  { icon: CalendarCheck, title: t('home.forOwners.calendar'), desc: t('home.forOwners.calendarDesc') },
                  { icon: Users, title: t('home.forOwners.crm'), desc: t('home.forOwners.crmDesc') },
                  { icon: Shield, title: t('home.forOwners.confirmations'), desc: t('home.forOwners.confirmationsDesc') },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 smooth-transition">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Link href="/contact">
                  <Button size="lg" className="rounded-full px-8 h-12 shadow-lg shadow-primary/20">
                    {t('home.forOwners.partnerWithUs')}
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-12">
                    {t('home.cta.button1')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual showcase */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-luxury-lg">
                <img
                  src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&h=800&fit=crop"
                  alt="Tablo"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating stats cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-luxury p-4 border border-white/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('home.cta.thisMonth')}</p>
                    <p className="font-bold text-lg leading-none">+32%</p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-luxury p-4 border border-white/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('home.cta.activeGuests')}</p>
                    <p className="font-bold text-lg leading-none">2,847</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0f1a] via-[#1a1025] to-[#0d1117]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm font-medium text-white/40 border border-white/10 bg-white/5">
            <MapPin className="h-4 w-4" />
            {t('home.cta.tbilisiGeorgia')}
          </div>

          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-white leading-tight">
            {t('home.cta.finalTitle')}
          </h2>
          <p className="text-lg mb-12 text-white/40 max-w-xl mx-auto leading-relaxed">
            {t('home.cta.finalSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/restaurants">
              <Button size="lg" className="rounded-full bg-white text-foreground hover:bg-white/90 border-none px-10 h-14 text-base shadow-2xl">
                {t('home.cta.browseRestaurants')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" className="rounded-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 px-10 h-14 text-base">
                {t('home.cta.button2')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
