'use client';

import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactPage() {
    const { t } = useLocale();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.success(t('contact.success') || 'Message sent successfully!');
        setIsSubmitting(false);
        (e.target as HTMLFormElement).reset();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-white border-b overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 transform translate-x-20" />
                <div className="max-w-7xl mx-auto px-8 py-20 relative z-10">
                    <div className="max-w-3xl">
                        <h1 className="text-5xl font-bold tracking-tight mb-6">
                            {t('contact.title') || 'Partner with Tablo'}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {t('contact.subtitle') || 'Join Georgia\'s premier dining platform and take your restaurant management to the next level.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-16">
                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Contact Information */}
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-2xl font-bold mb-8">Get in Touch</h2>
                            <div className="grid gap-6">
                                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                    <div className="p-3 bg-blue-50 rounded-xl">
                                        <Mail className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Email Us</p>
                                        <p className="text-muted-foreground">partners@tablo.ge</p>
                                        <p className="text-sm text-blue-600 mt-1 cursor-pointer">Send a direct message →</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                    <div className="p-3 bg-green-50 rounded-xl">
                                        <Phone className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Call Us</p>
                                        <p className="text-muted-foreground">+995 322 123 456</p>
                                        <p className="text-sm text-green-600 mt-1">Available Mon-Fri, 10am - 7pm</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md smooth-transition">
                                    <div className="p-3 bg-purple-50 rounded-xl">
                                        <MapPin className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Office</p>
                                        <p className="text-muted-foreground">12 Rustaveli Ave, Tbilisi, Georgia</p>
                                        <p className="text-sm text-purple-600 mt-1">Visit our headquarters</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10">
                            <div className="flex items-center gap-3 mb-4">
                                <MessageCircle className="h-6 w-6 text-primary" />
                                <h3 className="font-bold text-lg">Why partner with us?</h3>
                            </div>
                            <ul className="space-y-3">
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Real-time interactive floor plan management
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Automated reservation confirmation
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Comprehensive guest analytics and CRM
                                </li>
                                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    Exposure to thousands of local and international diners
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-10 rounded-3xl shadow-luxury border border-gray-100">
                        <h3 className="text-2xl font-bold mb-8">Send us a message</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Restaurant Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Grand Cafe"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Contact Person</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Giorgi Beridze"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="giorgi@restautant.ge"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none smooth-transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Tell us about your restaurant..."
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
                                        Sending...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Send className="h-5 w-5" />
                                        Submit Application
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
