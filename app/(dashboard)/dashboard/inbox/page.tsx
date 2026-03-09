'use client';

import { useState, useEffect, useRef } from 'react';
import { getOwnerRestaurant } from '@/app/actions/owner';
import { getSmsInbox, sendReplySms } from '@/app/actions/inbox';
import { toast } from 'sonner';
import { Loader2, MessageSquare, Send, Phone, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslations } from '@/components/translations-provider';

export default function InboxPage() {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [threads, setThreads] = useState<any[]>([]);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { t } = useTranslations();
    const it = t.inbox || {};

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const { data: resData } = await getOwnerRestaurant();
            if (resData) {
                setRestaurant(resData);
                const { data: threadsData } = await getSmsInbox(resData.id);
                if (threadsData) {
                    setThreads(threadsData);
                    if (threadsData.length > 0) setSelectedPhone(threadsData[0].phone);
                }
            }
            setLoading(false);
        }
        load();
    }, []);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedPhone, threads]);

    const activeThread = threads.find(t => t.phone === selectedPhone);

    const handleSend = async () => {
        if (!replyText.trim() || !restaurant || !selectedPhone) return;

        setSending(true);
        const { error } = await sendReplySms(restaurant.id, selectedPhone, replyText);
        setSending(false);

        if (error) {
            toast.error(error);
        } else {
            setReplyText('');
            // Optimistic update
            const newMsg = {
                id: Math.random().toString(),
                direction: 'outbound',
                content: replyText,
                status: 'delivered',
                created_at: new Date().toISOString()
            };

            setThreads(prev => prev.map(t => {
                if (t.phone === selectedPhone) {
                    return {
                        ...t,
                        messages: [...t.messages, newMsg],
                        lastMessage: newMsg
                    };
                }
                return t;
            }));
            toast.success(it.sentSuccess || 'Message sent');
        }
    };

    if (loading) return (
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!restaurant) return (
        <div className="p-8 text-center text-muted-foreground mt-20">{it.noRestaurant || "No restaurant assigned."}</div>
    );

    return (
        <div className="h-[calc(100vh-64px)] w-full flex overflow-hidden">
            {/* Thread List Sidebar */}
            <div className="w-80 border-r bg-white flex flex-col h-full shrink-0">
                <div className="p-4 border-b">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        {it.title || "SMS Inbox"}
                    </h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {threads.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            {it.noMessages || "No messages yet."}
                        </div>
                    ) : (
                        threads.map(thread => (
                            <button
                                key={thread.phone}
                                onClick={() => setSelectedPhone(thread.phone)}
                                className={`w-full text-left p-4 border-b smooth-transition ${selectedPhone === thread.phone ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-sm flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {thread.phone}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {format(new Date(thread.lastMessage.created_at), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                    {thread.lastMessage.direction === 'outbound' ? (it.you || 'You: ') : ''}
                                    {thread.lastMessage.content}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-gray-50 h-[calc(100vh-64px)]">
                {activeThread ? (
                    <>
                        <div className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                            <div>
                                <h2 className="font-semibold flex items-center gap-2">
                                    {activeThread.phone}
                                </h2>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <User className="h-3 w-3" /> {it.guestProfile || "Guest Profile"}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                            {activeThread.messages.map((msg: any) => {
                                const isOutbound = msg.direction === 'outbound';
                                return (
                                    <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${isOutbound ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border text-foreground rounded-tl-sm'}`}>
                                            <p>{msg.content}</p>
                                            <div className={`text-[9px] mt-1.5 flex items-center gap-1 ${isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                                <Clock className="h-2.5 w-2.5" />
                                                {format(new Date(msg.created_at || new Date()), 'h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 bg-white border-t shrink-0">
                            <div className="flex items-end gap-2 bg-gray-50 p-1.5 rounded-xl border focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary smooth-transition">
                                <textarea
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder={it.typeMessage || "Type a message..."}
                                    className="flex-1 bg-transparent resize-none outline-none max-h-32 min-h-[44px] py-3 px-3 text-sm"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim() || sending}
                                    className="p-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 smooth-transition shrink-0 mb-0.5"
                                >
                                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 px-2 text-center">{it.pressEnter || "Press Enter to send, Shift+Enter for new line."}</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                        <p>{it.selectConversation || "Select a conversation to start texting"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
