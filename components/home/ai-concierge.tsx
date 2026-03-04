'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ChefHat, MapPin, Star, ChevronRight } from 'lucide-react';
import { askConcierge, ConciergeResponse } from '@/app/actions/ai-concierge';
import { Restaurant } from '@/types/database';
import Link from 'next/link';
import { useLocale } from '@/lib/locale-context';

type Message = {
    id: string;
    role: 'user' | 'ai';
    content: string;
    restaurants?: Restaurant[];
};

export function AIConcierge() {
    const { t, locale } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', role: 'ai', content: t('aiConcierge.greeting') }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Reset chat and localization if the user switches languages mid-session
    useEffect(() => {
        setMessages([
            { id: '1', role: 'ai', content: t('aiConcierge.greeting') }
        ]);
    }, [locale, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        // Add user message
        const newMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: newMsgId, role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            // Call our smart search server action, passing the current locale
            const response = await askConcierge(userMsg, locale);

            // Add AI response
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: response.message,
                restaurants: response.restaurants
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: (Date.now() + 2).toString(), role: 'ai', content: t('aiConcierge.error') }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 flex items-center justify-center
                    ${isOpen ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}
                    bg-gradient-to-br from-gray-900 to-black text-white border border-white/10`}
            >
                <div className="absolute inset-0 rounded-full bg-white/20 blur-md animate-pulse"></div>
                <Sparkles className="w-6 h-6 relative z-10" />
            </button>

            {/* Chat Window */}
            <div
                className={`fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 w-[calc(100vw-48px)] sm:w-[400px] bg-white dark:bg-[#1A1C23] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right
                    ${isOpen ? 'scale-100 opacity-100 h-[550px] max-h-[80vh]' : 'scale-50 opacity-0 h-0 pointer-events-none'}`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-black p-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                            <ChefHat className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">{t('aiConcierge.title')}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                {t('aiConcierge.online')}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/20">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>

                            {/* Chat Bubble */}
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-sm'
                                    : 'bg-white dark:bg-[#2A2D35] text-gray-800 dark:text-white border border-gray-100 dark:border-white/5 rounded-tl-sm'
                                    }`}
                            >
                                {msg.content}
                            </div>

                            {/* Restaurant Carousel (if ai returned results) */}
                            {msg.role === 'ai' && msg.restaurants && msg.restaurants.length > 0 && (
                                <div className="mt-3 w-full flex overflow-x-auto gap-3 pb-2 hide-scrollbar snap-x snap-mandatory pr-4">
                                    {msg.restaurants.map((r) => (
                                        <Link
                                            href={`/restaurants/${r.slug}`}
                                            key={r.id}
                                            className="snap-start flex-none w-[200px] bg-white dark:bg-[#2A2D35] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm transition-transform hover:-translate-y-1 block"
                                        >
                                            <div className="h-24 w-full relative">
                                                <img
                                                    src={r.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&fit=crop'}
                                                    alt={r.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] text-white font-medium flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                    {r.rating || '4.9'}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{r.name}</h4>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate">{r.city}</span>
                                                </div>
                                                <div className="text-xs font-semibold text-black dark:text-white text-right">
                                                    {t('aiConcierge.book')} <ChevronRight className="w-3 h-3 inline pb-0.5" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex items-start">
                            <div className="bg-white dark:bg-[#2A2D35] border border-gray-100 dark:border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce delay-75"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce delay-150"></div>
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce delay-300"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-[#1A1C23] border-t border-gray-100 dark:border-white/10 shrink-0">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={t('aiConcierge.placeholder')}
                            className="w-full bg-gray-100 dark:bg-black/50 text-gray-900 dark:text-white placeholder:text-gray-500 text-sm rounded-full pl-4 pr-12 py-3 outline-none border border-transparent focus:border-gray-300 dark:focus:border-white/20 transition-all"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1.5 p-2 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
