'use client';

import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactPage() {
    const { t } = useLocale();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success(t('contact.formSuccess'));
        setIsSubmitting(false);
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Hero Section */}
            <div className="bg-foreground text-white overflow-hidden relative">
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                }} />
                <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-5xl mx-auto px-8 pt-32 pb-20 text-center">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium text-white/70 border border-white/10 bg-white/5">
                        <Mail className="h-4 w-4" />
                        {t('contact.badge')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1]">
                        {t('contact.title')}
                    </h1>
                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        {t('contact.subtitle')}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-16">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <h2 className="text-2xl font-bold">{t('contact.infoTitle')}</h2>
                        <div className="grid gap-5">
                            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <Mail className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{t('contact.infoEmail')}</p>
                                    <p className="text-muted-foreground">partners@tablo.ge</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                <div className="p-3 bg-green-50 rounded-xl">
                                    <Phone className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{t('contact.infoPhone')}</p>
                                    <p className="text-muted-foreground">+995 322 123 456</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                <div className="p-3 bg-purple-50 rounded-xl">
                                    <MapPin className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{t('contact.infoAddress')}</p>
                                    <p className="text-muted-foreground">{t('contact.infoAddressValue')}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                <div className="p-3 bg-amber-50 rounded-xl">
                                    <Clock className="h-6 w-6 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">{t('contact.infoHours')}</p>
                                    <p className="text-muted-foreground">{t('contact.infoHoursValue')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-10 rounded-3xl shadow-luxury border border-gray-100">
                        <h3 className="text-2xl font-bold mb-8">{t('contact.formTitle')}</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">{t('contact.formName')}</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder={t('contact.formNamePlaceholder')}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">{t('contact.formEmail')}</label>
                                    <input
                                        required
                                        type="email"
                                        placeholder={t('contact.formEmailPlaceholder')}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">{t('contact.formSubject')}</label>
                                <input
                                    required
                                    type="text"
                                    placeholder={t('contact.formSubjectPlaceholder')}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">{t('contact.formMessage')}</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder={t('contact.formMessagePlaceholder')}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-6 text-lg font-bold bg-primary hover:bg-tablo-red-600 shadow-lg shadow-primary/20 smooth-transition"
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('contact.formSending')}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Send className="h-5 w-5" />
                                        {t('contact.formSubmit')}
                                    </div>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
