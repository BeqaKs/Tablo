'use client';

import { useLocale } from '@/lib/locale-context';
import { UtensilsCrossed, Heart, Globe, Shield, Zap, Users, Star, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AboutPage() {
    const { t } = useLocale();

    const values = [
        { icon: Heart, title: t('about.value1Title'), description: t('about.value1Desc'), color: 'bg-rose-50 text-rose-600' },
        { icon: Zap, title: t('about.value2Title'), description: t('about.value2Desc'), color: 'bg-amber-50 text-amber-600' },
        { icon: Globe, title: t('about.value3Title'), description: t('about.value3Desc'), color: 'bg-blue-50 text-blue-600' },
        { icon: Shield, title: t('about.value4Title'), description: t('about.value4Desc'), color: 'bg-green-50 text-green-600' },
    ];

    const stats = [
        { value: '50+', label: t('about.statsPartner') },
        { value: '10K+', label: t('about.statsReservations') },
        { value: '4.9', label: t('about.statsRating') },
        { value: '24/7', label: t('about.statsAvailability') },
    ];

    const featureList = [
        t('about.feature1'), t('about.feature2'), t('about.feature3'),
        t('about.feature4'), t('about.feature5'), t('about.feature6'),
    ];

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="relative bg-foreground text-white overflow-hidden pt-20">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                }} />
                <div className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-5xl mx-auto px-8 pt-32 pb-20 text-center">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium text-white/70 border border-white/10 bg-white/5">
                        <UtensilsCrossed className="h-4 w-4" />
                        {t('about.badge')}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
                        {t('about.title')}
                    </h1>

                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        {t('about.subtitle')}
                    </p>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-white border-b">
                <div className="max-w-5xl mx-auto px-8 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{stat.value}</p>
                                <p className="text-sm text-muted-foreground mt-1 font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-20 bg-background">
                <div className="max-w-5xl mx-auto px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('about.storyLabel')}</p>
                            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6">
                                {t('about.storyTitle')}
                            </h2>
                            <div className="space-y-4 text-muted-foreground leading-relaxed">
                                <p>{t('about.storyP1')}</p>
                                <p>{t('about.storyP2')}</p>
                                <p>{t('about.storyP3')}</p>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-luxury">
                                <img
                                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"
                                    alt="Tablo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-luxury border">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-xl">
                                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Est. 2024</p>
                                        <p className="text-xs text-muted-foreground">{t('home.cta.tbilisiGeorgia')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-muted/30">
                <div className="max-w-5xl mx-auto px-8">
                    <div className="text-center mb-14">
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('about.valuesLabel')}</p>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t('about.valuesTitle')}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {values.map((value, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md smooth-transition">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${value.color}`}>
                                    <value.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Features */}
            <section className="py-20 bg-background">
                <div className="max-w-5xl mx-auto px-8">
                    <div className="text-center mb-14">
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('about.featuresLabel')}</p>
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t('about.featuresTitle')}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featureList.map((feature, i) => (
                            <div key={i} className="flex gap-3 items-center p-5 rounded-2xl border bg-white hover:border-primary/20 smooth-transition">
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                <p className="text-sm font-medium">{feature}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-primary/80" />
                <div className="relative z-10 max-w-3xl mx-auto px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-white">
                        {t('about.ctaTitle')}
                    </h2>
                    <p className="text-lg mb-10 text-white/60 max-w-xl mx-auto">
                        {t('about.ctaSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/restaurants">
                            <Button size="lg" className="rounded-full bg-white text-foreground hover:bg-white/90 border-none px-8 h-12">
                                {t('about.ctaDiner')}
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 px-8 h-12">
                                {t('about.ctaOwner')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
