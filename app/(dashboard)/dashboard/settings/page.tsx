'use client';

import { useState, useEffect } from 'react';
import { getOwnerRestaurant } from '@/app/actions/owner';
import { toast } from 'sonner';
import { Loader2, Save, Store, Phone, Globe, Map, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';

const PRICE_RANGES = ['₾', '₾₾', '₾₾₾', '₾₾₾₾'];

function FormField({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    span,
}: {
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    span?: boolean;
}) {
    return (
        <div className={span ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="dash-input"
            />
        </div>
    );
}

function FormTextarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                {label}
            </label>
            <textarea
                value={value}
                onChange={e => onChange(e.target.value)}
                className="dash-input min-h-[100px] resize-y"
                style={{ paddingTop: '0.625rem', paddingBottom: '0.625rem' }}
            />
        </div>
    );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
    return (
        <div className="flex items-center gap-4 mb-5">
            <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'hsl(347 78% 58% / 0.12)' }}
            >
                <Icon className="h-5 w-5" style={{ color: 'hsl(347 78% 65%)' }} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-xs" style={{ color: 'hsl(220 15% 42%)' }}>{subtitle}</p>
            </div>
        </div>
    );
}

export default function OwnerSettingsPage() {
    const [restaurant, setRestaurant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const { data, error } = await getOwnerRestaurant();
        if (error) toast.error(error);
        if (data) setRestaurant(data);
        setLoading(false);
    }

    function set(field: string, value: any) {
        setRestaurant((prev: any) => ({ ...prev, [field]: value }));
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase.from('restaurants').update({
            name: restaurant.name,
            description: restaurant.description,
            address: restaurant.address,
            city: restaurant.city,
            cuisine_type: restaurant.cuisine_type,
            price_range: restaurant.price_range,
            phone: restaurant.phone,
            email: restaurant.email,
            website: restaurant.website,
            sms_enabled: restaurant.sms_enabled,
        }).eq('id', restaurant.id);
        if (error) toast.error(error.message);
        else toast.success('Settings saved!');
        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 58%)' }} />
                    <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center p-8 mt-20" style={{ color: 'hsl(220 15% 45%)' }}>No restaurant assigned.</div>;
    }

    return (
        <form onSubmit={handleSave}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Restaurant Settings</h1>
                        <p className="text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>Manage your public profile — {restaurant.name}</p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold smooth-transition btn-dash-primary disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Basic Info */}
                <div className="dash-card p-6">
                    <SectionHeader icon={Store} title="Basic Information" subtitle="Your restaurant's public-facing details" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label="Restaurant Name" value={restaurant.name || ''} onChange={v => set('name', v)} placeholder="e.g. Shavi Lomi" />
                        <FormField label="Cuisine Type" value={restaurant.cuisine_type || ''} onChange={v => set('cuisine_type', v)} placeholder="e.g. Georgian, Italian" />
                        <FormTextarea label="Description" value={restaurant.description || ''} onChange={v => set('description', v)} />
                        {/* Price Range */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                                Price Range
                            </label>
                            <div className="flex gap-2">
                                {PRICE_RANGES.map(pr => (
                                    <button
                                        key={pr}
                                        type="button"
                                        onClick={() => set('price_range', pr)}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold smooth-transition"
                                        style={restaurant.price_range === pr
                                            ? { background: 'hsl(347 78% 52% / 0.18)', color: 'hsl(347 78% 70%)', border: '1px solid hsl(347 78% 52% / 0.4)' }
                                            : { background: 'hsl(231 24% 12%)', color: 'hsl(220 15% 50%)', border: '1px solid hsl(231 24% 18%)' }
                                        }
                                    >
                                        {pr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="dash-card p-6">
                    <SectionHeader icon={Phone} title="Contact Information" subtitle="How guests can reach you" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label="Phone" type="tel" value={restaurant.phone || ''} onChange={v => set('phone', v)} placeholder="+995 555 000 000" />
                        <FormField label="Email" type="email" value={restaurant.email || ''} onChange={v => set('email', v)} placeholder="info@restaurant.ge" />
                        <FormField label="Website" value={restaurant.website || ''} onChange={v => set('website', v)} placeholder="https://restaurant.ge" span />
                    </div>
                </div>

                {/* Location */}
                <div className="dash-card p-6">
                    <SectionHeader icon={Map} title="Location" subtitle="Your restaurant's physical address" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label="City" value={restaurant.city || ''} onChange={v => set('city', v)} placeholder="Tbilisi" />
                        <FormField label="Address" value={restaurant.address || ''} onChange={v => set('address', v)} placeholder="14 Rustaveli Ave" />
                    </div>
                </div>

                {/* Notifications & Integrations */}
                <div className="dash-card p-6">
                    <SectionHeader icon={MessageSquare} title="Notifications & Integrations" subtitle="Manage external communications" />
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-white">SMS Notifications</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                Send automated booking confirmations and waitlist alerts via SMS.
                            </p>
                        </div>
                        <Switch
                            checked={restaurant.sms_enabled || false}
                            onCheckedChange={(checked) => set('sms_enabled', checked)}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
