'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getMyWaitlist, leaveWaitlist, claimWaitlistSpot } from '@/app/actions/waitlist';
import { Loader2, Clock, MapPin, Users, CheckCircle2, XCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
    const [seconds, setSeconds] = useState(() =>
        Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    );

    useEffect(() => {
        if (seconds <= 0) return;
        const interval = setInterval(() => {
            setSeconds(s => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [seconds]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const expired = seconds <= 0;

    return (
        <span className={`font-mono font-bold text-lg ${expired ? 'text-red-500' : seconds < 120 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {expired ? 'Expired' : `${mins}:${String(secs).padStart(2, '0')}`}
        </span>
    );
}

export default function MyWaitlistPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { window.location.href = '/login'; return; }
            const { data, error } = await getMyWaitlist();
            if (error) toast.error(error);
            else setEntries(data || []);
            setLoading(false);
        }
        load();
    }, [supabase]);

    async function handleLeave(id: string) {
        setActingId(id);
        const { error } = await leaveWaitlist(id);
        if (error) toast.error(error);
        else {
            toast.success('Removed from waitlist');
            setEntries(prev => prev.filter(e => e.id !== id));
        }
        setActingId(null);
    }

    async function handleClaim(id: string) {
        setActingId(id);
        const { success, error } = await claimWaitlistSpot(id);
        if (error) toast.error(error);
        else {
            toast.success('Spot claimed! Complete your booking.');
            setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'claimed' } : e));
        }
        setActingId(null);
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="bg-white border-b">
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <h1 className="text-3xl font-bold mb-1">My Waitlist</h1>
                    <p className="text-muted-foreground">You'll be notified when a table opens up for you.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
                {entries.length === 0 ? (
                    <div className="text-center py-20">
                        <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <h2 className="text-xl font-semibold mb-2">No active waitlist entries</h2>
                        <p className="text-muted-foreground mb-6">You're not on any waitlists right now.</p>
                        <Button asChild><Link href="/restaurants">Browse Restaurants</Link></Button>
                    </div>
                ) : (
                    entries.map(entry => {
                        const restaurant = Array.isArray(entry.restaurants) ? entry.restaurants[0] : entry.restaurants;
                        const isOffered = entry.status === 'offered';
                        const timeStr = new Date(entry.requested_time).toLocaleString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit'
                        });

                        return (
                            <Card key={entry.id} className={`p-5 ${isOffered ? 'border-emerald-400 bg-emerald-50/50 shadow-emerald-100 shadow-md' : ''}`}>
                                {isOffered && (
                                    <div className="flex items-center gap-2 mb-3 p-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold">
                                        <CheckCircle2 className="h-4 w-4" />
                                        A table is available! You have
                                        <CountdownTimer expiresAt={entry.expires_at} />
                                        to claim it.
                                    </div>
                                )}

                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{restaurant?.name || 'Restaurant'}</h3>
                                            <Badge variant={isOffered ? 'default' : 'secondary'}>
                                                {isOffered ? '🟢 Offered' : `#${entry.position} in queue`}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {timeStr}</span>
                                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {entry.party_size} guests</span>
                                            {restaurant?.address && (
                                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {restaurant.address}</span>
                                            )}
                                            {entry.quoted_wait_time != null && !isOffered && (
                                                <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><Timer className="h-3.5 w-3.5" /> ~{entry.quoted_wait_time} min wait</span>
                                            )}
                                        </div>
                                        {entry.guest_name && (
                                            <p className="text-sm text-muted-foreground">Waitlisted as: <strong>{entry.guest_name}</strong></p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 items-end shrink-0">
                                        {isOffered && (
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => handleClaim(entry.id)}
                                                disabled={actingId === entry.id}
                                            >
                                                {actingId === entry.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                Claim Spot
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleLeave(entry.id)}
                                            disabled={actingId === entry.id}
                                        >
                                            <XCircle className="h-3.5 w-3.5 mr-1" />
                                            Leave Queue
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
