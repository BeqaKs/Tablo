'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getOwnerRestaurant } from '@/app/actions/owner';
// We'd need an updateOwnerRestaurant function in actions/owner.ts
// for now, let's keep it read-only or a mock form if not strictly requested.
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        const supabase = createClient();

        // Simple client-side update for demonstration (can also be moved to server action)
        const { error } = await supabase
            .from('restaurants')
            .update({
                name: restaurant.name,
                description: restaurant.description,
                address: restaurant.address,
                city: restaurant.city,
                cuisine_type: restaurant.cuisine_type,
                price_range: restaurant.price_range,
                phone: restaurant.phone,
                email: restaurant.email,
                website: restaurant.website,
            })
            .eq('id', restaurant.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Restaurant settings saved!');
        }
        setSaving(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!restaurant) {
        return <div className="text-center p-8 text-muted-foreground mt-20">You need to be assigned to a restaurant to manage settings.</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Restaurant Settings</h1>
                    <p className="text-muted-foreground">Manage your public profile ({restaurant.name})</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <Card className="p-6">
                <form className="space-y-6" onSubmit={handleSave}>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Restaurant Name</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.name || ''}
                                onChange={e => setRestaurant({ ...restaurant, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cuisine Type</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.cuisine_type || ''}
                                onChange={e => setRestaurant({ ...restaurant, cuisine_type: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 min-h-[100px]"
                                value={restaurant.description || ''}
                                onChange={e => setRestaurant({ ...restaurant, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.phone || ''}
                                onChange={e => setRestaurant({ ...restaurant, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                type="email"
                                value={restaurant.email || ''}
                                onChange={e => setRestaurant({ ...restaurant, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">City</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.city || ''}
                                onChange={e => setRestaurant({ ...restaurant, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Address</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.address || ''}
                                onChange={e => setRestaurant({ ...restaurant, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Website</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.website || ''}
                                onChange={e => setRestaurant({ ...restaurant, website: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Price Range (e.g., $$, $$$)</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={restaurant.price_range || ''}
                                onChange={e => setRestaurant({ ...restaurant, price_range: e.target.value })}
                            />
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
}
