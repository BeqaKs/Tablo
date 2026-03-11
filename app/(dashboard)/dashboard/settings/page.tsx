'use client';

import { useState, useEffect } from 'react';
import { getOwnerRestaurant } from '@/app/actions/owner';
import { getOperatingHours, saveOperatingHours, saveBookingRules } from '@/app/actions/operating-hours';
import type { OperatingHours, BookingRules } from '@/app/actions/operating-hours';
import { toast } from 'sonner';
import { Loader2, Save, Store, Phone, Globe, Map, MessageSquare, Clock, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';
import { useTranslations } from '@/components/translations-provider';

const PRICE_RANGES = ['₾', '₾₾', '₾₾₾', '₾₾₾₾'];
const DAYS = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
] as const;

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

function SectionHeader({ icon: Icon, title, subtitle, color }: { icon: React.ElementType; title: string; subtitle: string; color?: string }) {
    const accentColor = color || 'hsl(347 78% 58%)';
    return (
        <div className="flex items-center gap-4 mb-5">
            <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${accentColor}20` }}
            >
                <Icon className="h-5 w-5" style={{ color: accentColor }} />
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
    const [hours, setHours] = useState<OperatingHours | null>(null);
    const [rules, setRules] = useState<BookingRules | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingHours, setSavingHours] = useState(false);
    const [savingRules, setSavingRules] = useState(false);
    const { t } = useTranslations();
    const st = t.settings || {};

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [restaurantRes, hoursRes] = await Promise.all([
            getOwnerRestaurant(),
            getOperatingHours(),
        ]);
        if (restaurantRes.error) toast.error(restaurantRes.error);
        if (restaurantRes.data) setRestaurant(restaurantRes.data);
        if (hoursRes.data) {
            setHours(hoursRes.data.operating_hours);
            setRules(hoursRes.data.booking_rules);
        }
        setLoading(false);
    }

    function set(field: string, value: any) {
        setRestaurant((prev: any) => ({ ...prev, [field]: value }));
    }

    function setDayHours(day: string, field: string, value: any) {
        setHours((prev: any) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }));
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
        else toast.success(st.saveSuccess || 'Settings saved!');
        setSaving(false);
    }

    async function handleSaveHours() {
        if (!hours) return;
        setSavingHours(true);
        const result = await saveOperatingHours(hours);
        if (result.error) toast.error(result.error);
        else toast.success('Operating hours saved!');
        setSavingHours(false);
    }

    async function handleSaveRules() {
        if (!rules) return;
        setSavingRules(true);
        const result = await saveBookingRules(rules);
        if (result.error) toast.error(result.error);
        else toast.success('Booking rules saved!');
        setSavingRules(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(347 78% 58%)' }} />
                    <p className="text-sm" style={{ color: 'hsl(220 15% 45%)' }}>{st.loadLoading || 'Loading settings...'}</p>
                </div>
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center p-8 mt-20" style={{ color: 'hsl(220 15% 45%)' }}>{st.noRestaurant || "No restaurant assigned."}</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{st.title || "Restaurant Settings"}</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: 'hsl(220 15% 45%)' }}>{(st.subtitle || "Manage your public profile — {name}").replace('{name}', restaurant.name)}</p>
                </div>
            </div>

            {/* Restaurant Info Form */}
            <form onSubmit={handleSave}>
                {/* Basic Info */}
                <div className="dash-card p-6 mb-4">
                    <SectionHeader icon={Store} title={st.basicInfo?.title || "Basic Information"} subtitle={st.basicInfo?.subtitle || "Your restaurant's public-facing details"} />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label={st.basicInfo?.name || "Restaurant Name"} value={restaurant.name || ''} onChange={v => set('name', v)} placeholder="e.g. Shavi Lomi" />
                        <FormField label={st.basicInfo?.cuisine || "Cuisine Type"} value={restaurant.cuisine_type || ''} onChange={v => set('cuisine_type', v)} placeholder="e.g. Georgian, Italian" />
                        <FormTextarea label={st.basicInfo?.description || "Description"} value={restaurant.description || ''} onChange={v => set('description', v)} />
                        {/* Price Range */}
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                                {st.basicInfo?.priceRange || "Price Range"}
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
                <div className="dash-card p-6 mb-4">
                    <SectionHeader icon={Phone} title={st.contactInfo?.title || "Contact Information"} subtitle={st.contactInfo?.subtitle || "How guests can reach you"} />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label={st.contactInfo?.phone || "Phone"} type="tel" value={restaurant.phone || ''} onChange={v => set('phone', v)} placeholder="+995 555 000 000" />
                        <FormField label={st.contactInfo?.email || "Email"} type="email" value={restaurant.email || ''} onChange={v => set('email', v)} placeholder="info@restaurant.ge" />
                        <FormField label={st.contactInfo?.website || "Website"} value={restaurant.website || ''} onChange={v => set('website', v)} placeholder="https://restaurant.ge" span />
                    </div>
                </div>

                {/* Location */}
                <div className="dash-card p-6 mb-4">
                    <SectionHeader icon={Map} title={st.location?.title || "Location"} subtitle={st.location?.subtitle || "Your restaurant's physical address"} />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label={st.location?.city || "City"} value={restaurant.city || ''} onChange={v => set('city', v)} placeholder="Tbilisi" />
                        <FormField label={st.location?.address || "Address"} value={restaurant.address || ''} onChange={v => set('address', v)} placeholder="14 Rustaveli Ave" />
                    </div>
                </div>

                {/* Notifications & Integrations */}
                <div className="dash-card p-6 mb-4">
                    <SectionHeader icon={MessageSquare} title={st.notifications?.title || "Notifications & Integrations"} subtitle={st.notifications?.subtitle || "Manage external communications"} />
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-sm font-medium text-white">{st.notifications?.smsTitle || "SMS Notifications"}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                {st.notifications?.smsDescription || "Send automated booking confirmations and waitlist alerts via SMS."}
                            </p>
                        </div>
                        <Switch
                            checked={restaurant.sms_enabled || false}
                            onCheckedChange={(checked) => set('sms_enabled', checked)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold smooth-transition btn-dash-primary disabled:opacity-50 mb-6"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? (st.saving || 'Saving...') : (st.saveChanges || 'Save Changes')}
                </button>
            </form>

            {/* ═══════════════════════════════════════════ */}
            {/* Operating Hours */}
            {/* ═══════════════════════════════════════════ */}
            {hours && (
                <div className="dash-card p-6">
                    <SectionHeader icon={Clock} title="Operating Hours" subtitle="Set your open and close times for each day of the week" color="hsl(262 60% 56%)" />
                    <div className="space-y-2">
                        {DAYS.map(({ key, label }) => {
                            const day = hours[key];
                            return (
                                <div
                                    key={key}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg px-4 py-3"
                                    style={{ background: day.is_closed ? 'hsl(231 24% 9%)' : 'hsl(231 24% 11%)' }}
                                >
                                    <div className="flex items-center gap-3 sm:w-40 shrink-0">
                                        <Switch
                                            checked={!day.is_closed}
                                            onCheckedChange={(checked) => setDayHours(key, 'is_closed', !checked)}
                                        />
                                        <span className={`text-sm font-medium ${day.is_closed ? 'line-through' : ''}`} style={{ color: day.is_closed ? 'hsl(220 15% 35%)' : 'white' }}>
                                            {label}
                                        </span>
                                    </div>
                                    {!day.is_closed ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="time"
                                                value={day.open}
                                                onChange={e => setDayHours(key, 'open', e.target.value)}
                                                className="rounded-lg px-3 py-1.5 text-sm text-white"
                                                style={{ background: 'hsl(231 24% 14%)', border: '1px solid hsl(231 24% 20%)' }}
                                            />
                                            <span className="text-xs" style={{ color: 'hsl(220 15% 40%)' }}>to</span>
                                            <input
                                                type="time"
                                                value={day.close}
                                                onChange={e => setDayHours(key, 'close', e.target.value)}
                                                className="rounded-lg px-3 py-1.5 text-sm text-white"
                                                style={{ background: 'hsl(231 24% 14%)', border: '1px solid hsl(231 24% 20%)' }}
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs italic" style={{ color: 'hsl(0 72% 55%)' }}>Closed</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveHours}
                        disabled={savingHours}
                        className="flex items-center gap-2 mt-4 rounded-lg px-4 py-2 text-sm font-semibold smooth-transition"
                        style={{ background: 'hsl(262 60% 56% / 0.15)', color: 'hsl(262 60% 75%)', border: '1px solid hsl(262 60% 56% / 0.2)' }}
                    >
                        {savingHours ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {savingHours ? 'Saving...' : 'Save Hours'}
                    </button>
                </div>
            )}

            {/* ═══════════════════════════════════════════ */}
            {/* Booking Rules */}
            {/* ═══════════════════════════════════════════ */}
            {rules && (
                <div className="dash-card p-6">
                    <SectionHeader icon={Shield} title="Booking Rules" subtitle="Control how and when guests can make reservations" color="hsl(38 80% 55%)" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                                Max Party Size
                            </label>
                            <input
                                type="number"
                                min={1} max={100}
                                value={rules.max_party_size}
                                onChange={e => setRules(prev => prev ? { ...prev, max_party_size: Number(e.target.value) } : prev)}
                                className="dash-input"
                            />
                            <p className="text-[10px] mt-1" style={{ color: 'hsl(220 15% 40%)' }}>Largest group you&apos;ll accept online</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                                Max Advance Booking (Days)
                            </label>
                            <input
                                type="number"
                                min={1} max={365}
                                value={rules.max_advance_days}
                                onChange={e => setRules(prev => prev ? { ...prev, max_advance_days: Number(e.target.value) } : prev)}
                                className="dash-input"
                            />
                            <p className="text-[10px] mt-1" style={{ color: 'hsl(220 15% 40%)' }}>How far ahead guests can book</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                                Minimum Lead Time (Hours)
                            </label>
                            <input
                                type="number"
                                min={0} max={72}
                                value={rules.min_lead_time_hours}
                                onChange={e => setRules(prev => prev ? { ...prev, min_lead_time_hours: Number(e.target.value) } : prev)}
                                className="dash-input"
                            />
                            <p className="text-[10px] mt-1" style={{ color: 'hsl(220 15% 40%)' }}>Minimum hours before arrival time</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'hsl(220 15% 42%)' }}>
                                Buffer Between Bookings (Minutes)
                            </label>
                            <input
                                type="number"
                                min={0} max={120}
                                value={rules.buffer_minutes}
                                onChange={e => setRules(prev => prev ? { ...prev, buffer_minutes: Number(e.target.value) } : prev)}
                                className="dash-input"
                            />
                            <p className="text-[10px] mt-1" style={{ color: 'hsl(220 15% 40%)' }}>Cleaning/prep time between seatings</p>
                        </div>
                        <div className="sm:col-span-2 flex items-center justify-between rounded-lg px-4 py-3" style={{ background: 'hsl(231 24% 11%)' }}>
                            <div>
                                <h4 className="text-sm font-medium text-white">Auto-Confirm Bookings</h4>
                                <p className="text-xs mt-0.5" style={{ color: 'hsl(220 15% 40%)' }}>
                                    Automatically confirm new reservations instead of leaving them as pending
                                </p>
                            </div>
                            <Switch
                                checked={rules.auto_confirm}
                                onCheckedChange={(checked) => setRules(prev => prev ? { ...prev, auto_confirm: checked } : prev)}
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveRules}
                        disabled={savingRules}
                        className="flex items-center gap-2 mt-4 rounded-lg px-4 py-2 text-sm font-semibold smooth-transition"
                        style={{ background: 'hsl(38 80% 55% / 0.15)', color: 'hsl(38 80% 65%)', border: '1px solid hsl(38 80% 55% / 0.2)' }}
                    >
                        {savingRules ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {savingRules ? 'Saving...' : 'Save Rules'}
                    </button>
                </div>
            )}
        </div>
    );
}
