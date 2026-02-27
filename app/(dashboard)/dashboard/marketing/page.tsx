'use client';

import { useState, useEffect } from 'react';
import { getOwnerRestaurant } from '@/app/actions/owner';
import { getCampaigns, toggleCampaignStatus, getLapsedCustomers } from '@/app/actions/marketing';
import { toast } from 'sonner';
import { Loader2, Megaphone, Users, Calendar, Mail, MessageSquare, Play, Pause, ChevronRight } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function MarketingPage() {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [lapsedGuests, setLapsedGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const { data: resData } = await getOwnerRestaurant();
            if (resData) {
                setRestaurant(resData);
                const [campRes, lapsedRes] = await Promise.all([
                    getCampaigns(resData.id),
                    getLapsedCustomers(resData.id, 90) // 90 days = 3 months
                ]);
                if (campRes.data) setCampaigns(campRes.data);
                if (lapsedRes.data) setLapsedGuests(lapsedRes.data);
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleToggle = async (id: string, currentStatus: boolean) => {
        const { error } = await toggleCampaignStatus(id, !currentStatus);
        if (error) {
            toast.error(error);
        } else {
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
            toast.success(`Campaign ${currentStatus ? 'paused' : 'started'}!`);
        }
    };

    if (loading) return (
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );

    if (!restaurant) return (
        <div className="p-8 text-center text-muted-foreground mt-20">No restaurant assigned.</div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Automated Marketing</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Set up campaigns to engage guests based on behavior and dates.</p>
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/90 smooth-transition shadow-sm">
                    <Megaphone className="h-4 w-4" />
                    New Campaign
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <div className="dash-card p-6 md:col-span-2 space-y-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Play className="h-5 w-5 text-indigo-500" />
                        Active Campaigns
                    </h2>

                    {campaigns.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl border-gray-200">
                            <Megaphone className="h-8 w-8 mx-auto text-gray-300 mb-3" />
                            <h3 className="font-semibold text-gray-900">No campaigns running</h3>
                            <p className="text-sm text-gray-500 mt-1 mb-4">You have not created any automated campaigns yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-gray-300 smooth-transition bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${c.trigger_type === 'lapsed_customer' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {c.trigger_type === 'lapsed_customer' ? <Users className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">{c.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.trigger_type.replace('_', ' ')} • SMS</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {c.is_active ? 'Active' : 'Paused'}
                                        </span>
                                        <button
                                            onClick={() => handleToggle(c.id, c.is_active)}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 smooth-transition"
                                        >
                                            {c.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Insights Block */}
                    <div className="dash-card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                        <Users className="h-6 w-6 mb-4 text-white/80" />
                        <h3 className="text-2xl font-bold mb-1">{lapsedGuests.length}</h3>
                        <p className="text-sm text-white/90 font-medium">Lapsed VIPs & Guests</p>
                        <p className="text-xs text-indigo-100 mt-2">Guests who haven't visited in the last 90 days. Rekindle their interest.</p>
                        <button className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white border-0 py-2 rounded-lg text-sm font-semibold smooth-transition">
                            Create Win-back Campaign
                        </button>
                    </div>

                    {/* Lapsed Customers Preview */}
                    <div className="dash-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-sm">Needs Attention</h3>
                            <button className="text-xs text-primary font-medium hover:underline">View All</button>
                        </div>
                        <div className="space-y-3">
                            {lapsedGuests.slice(0, 5).map(g => (
                                <div key={g.id} className="flex justify-between items-center group cursor-pointer">
                                    <div>
                                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{g.first_name} {g.last_name}</p>
                                        <p className="text-xs text-muted-foreground">{g.last_visit_date ? `${differenceInDays(new Date(), new Date(g.last_visit_date))} days ago` : 'Never visited'}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                            {lapsedGuests.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">All guests visited recently!</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
