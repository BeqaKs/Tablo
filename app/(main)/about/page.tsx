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
            {/* Premium Color Hero */}
            <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-[#1A1C23]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A0B10] via-[#1A1C23] to-primary/40" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

                {/* Glow Effects */}
                <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[0%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[100px] pointer-events-none" />

                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/20 to-transparent" />

                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-16 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-semibold text-white/90 border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
                        <UtensilsCrossed className="h-4 w-4" />
                        {t('about.badge')}
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-white text-balance drop-shadow-2xl">
                        {t('about.title')}
                    </h1>

                    <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed text-balance font-medium drop-shadow-lg">
                        {t('about.subtitle')}
                    </p>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-white border-b py-12 relative z-20 -mt-8 mx-auto max-w-5xl rounded-3xl shadow-xl border-gray-100 px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center px-4">
                            <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-500 font-semibold uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
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
                            </div>
                        </div>
                        <div className="relative">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative group">
                                <img
                                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop"
                                    alt="Tablo Diners"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            </div>
                            <div className="absolute -bottom-8 -left-8 bg-white/90 backdrop-blur-xl p-5 rounded-2xl shadow-xl border border-gray-100 transform transition-transform hover:-translate-y-2">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl">
                                        <UtensilsCrossed className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Est. 2024</p>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">{t('home.cta.tbilisiGeorgia')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-5xl mx-auto px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{t('about.valuesTitle')}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        {values.map((value, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-gray-200 group">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${value.color}`}>
                                    <value.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                                <p className="text-gray-500 leading-relaxed">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Features */}
            <section className="py-24 bg-white">
                <div className="max-w-5xl mx-auto px-8">
                    <div className="text-center mb-16">
                        <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">{t('about.featuresLabel')}</p>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{t('about.featuresTitle')}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {featureList.map((feature, i) => (
                            <div key={i} className="flex gap-4 items-center p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-primary/20 hover:shadow-lg transition-all duration-300 group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Star className="w-5 h-5" />
                                </div>
                                <p className="font-semibold text-gray-800">{feature}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 relative overflow-hidden bg-[#1A1C23]">
                <div className="absolute inset-0 bg-gradient-to-tr from-black via-[#1A1C23] to-primary/20" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

                <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white text-balance">
                        {t('about.ctaTitle')}
                    </h2>
                    <p className="text-xl mb-12 text-gray-400 max-w-2xl mx-auto text-balance">
                        {t('about.ctaSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/restaurants">
                            <Button size="lg" className="rounded-full bg-white text-black hover:bg-gray-100 font-bold border-none px-8 font-[family-name:var(--font-geist-sans)] shadow-xl transform transition-transform hover:scale-105">
                                {t('about.ctaDiner')}
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 font-bold px-8 backdrop-blur-sm transform transition-transform hover:scale-105">
                                {t('about.ctaOwner')}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
