'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAdminRestaurants, createAdminRestaurant, updateAdminRestaurant, deleteAdminRestaurant, getAdminUsers } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Utensils, Plus, Pencil, Trash2, X, Check, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function AdminRestaurantsPage() {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Create form state
    const [form, setForm] = useState({
        name: '', slug: '', description: '', address: '', city: 'Tbilisi',
        cuisine_type: '', price_range: '$$$', owner_id: '', is_open: true, images: [''], lat: 0, lng: 0
    });

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setLoading(true);
        const [restResult, usersResult] = await Promise.all([
            getAdminRestaurants(),
            getAdminUsers()
        ]);
        if (restResult.data) setRestaurants(restResult.data);
        if (usersResult.data) setUsers(usersResult.data);
        setLoading(false);
    }

    function handleFormChange(field: string, value: any) {
        setForm(prev => ({ ...prev, [field]: value }));
    }

    function generateSlug(name: string) {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    async function handleCreate() {
        if (!form.name || !form.address || !form.owner_id) {
            toast.error('Name, address, and owner are required');
            return;
        }
        const slug = form.slug || generateSlug(form.name);
        const images = form.images.filter(i => i.trim());
        const { error } = await createAdminRestaurant({ ...form, slug, images });
        if (error) {
            toast.error(error);
        } else {
            toast.success('Restaurant created!');
            setShowCreate(false);
            setForm({ name: '', slug: '', description: '', address: '', city: 'Tbilisi', cuisine_type: '', price_range: '$$$', owner_id: '', is_open: true, images: [''], lat: 0, lng: 0 });
            loadData();
        }
    }

    async function handleToggleOpen(id: string, currentStatus: boolean) {
        const { error } = await updateAdminRestaurant(id, { is_open: !currentStatus });
        if (error) toast.error(error);
        else { toast.success(`Restaurant ${currentStatus ? 'closed' : 'opened'}`); loadData(); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure? This will delete all tables and bookings.')) return;
        const { error } = await deleteAdminRestaurant(id);
        if (error) toast.error(error);
        else { toast.success('Restaurant deleted'); loadData(); }
    }

    async function handleInlineUpdate(id: string, field: string, value: any) {
        const { error } = await updateAdminRestaurant(id, { [field]: value });
        if (error) toast.error(error);
        else loadData();
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Restaurant Management</h1>
                    <p className="text-muted-foreground">{restaurants.length} restaurants on the platform</p>
                </div>
                <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
                    {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {showCreate ? 'Cancel' : 'Add Restaurant'}
                </Button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <Card className="p-6 border-primary/20 bg-primary/5">
                    <h3 className="text-lg font-semibold mb-4">Create New Restaurant</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Name *</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={form.name}
                                onChange={e => { handleFormChange('name', e.target.value); handleFormChange('slug', generateSlug(e.target.value)); }} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Slug</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={form.slug}
                                onChange={e => handleFormChange('slug', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Address *</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={form.address}
                                onChange={e => handleFormChange('address', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">City</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={form.city}
                                onChange={e => handleFormChange('city', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Cuisine Type</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={form.cuisine_type}
                                onChange={e => handleFormChange('cuisine_type', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Price Range</label>
                            <select className="w-full border rounded-lg px-3 py-2" value={form.price_range}
                                onChange={e => handleFormChange('price_range', e.target.value)}>
                                <option value="$">$</option>
                                <option value="$$">$$</option>
                                <option value="$$$">$$$</option>
                                <option value="$$$$">$$$$</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Owner *</label>
                            <select className="w-full border rounded-lg px-3 py-2" value={form.owner_id}
                                onChange={e => handleFormChange('owner_id', e.target.value)}>
                                <option value="">Select owner...</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Image URL</label>
                            <input className="w-full border rounded-lg px-3 py-2" value={form.images[0]}
                                onChange={e => handleFormChange('images', [e.target.value])}
                                placeholder="https://..." />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1 block">Description</label>
                            <textarea className="w-full border rounded-lg px-3 py-2 h-20" value={form.description}
                                onChange={e => handleFormChange('description', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Latitude</label>
                            <input type="number" step="any" className="w-full border rounded-lg px-3 py-2" value={form.lat || ''}
                                onChange={e => handleFormChange('lat', parseFloat(e.target.value))} placeholder="41.7151" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Longitude</label>
                            <input type="number" step="any" className="w-full border rounded-lg px-3 py-2" value={form.lng || ''}
                                onChange={e => handleFormChange('lng', parseFloat(e.target.value))} placeholder="44.8271" />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleCreate}>Create Restaurant</Button>
                        <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                </Card>
            )}

            {/* Restaurant List */}
            <div className="space-y-4">
                {restaurants.map((r) => (
                    <Card key={r.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                    {r.images?.[0] ? (
                                        <img src={r.images[0]} alt={r.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Utensils className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold">{r.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {r.is_open ? 'Open' : 'Closed'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{r.cuisine_type} · {r.price_range} · {r.city}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{r.address}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-muted-foreground">Lat:</span>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-20 border rounded px-1 py-0.5 text-xs"
                                                defaultValue={r.lat}
                                                onBlur={(e) => handleInlineUpdate(r.id, 'lat', parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs">
                                            <span className="text-muted-foreground">Lng:</span>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-20 border rounded px-1 py-0.5 text-xs"
                                                defaultValue={r.lng}
                                                onBlur={(e) => handleInlineUpdate(r.id, 'lng', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Slug: <code className="bg-gray-100 px-1 rounded">{r.slug}</code> ·
                                        Tables: {r.tables?.[0]?.count || 0} ·
                                        ID: <code className="bg-gray-100 px-1 rounded text-[10px]">{r.id.slice(0, 8)}...</code>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <div className="flex flex-col gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleToggleOpen(r.id, r.is_open)}>
                                        {r.is_open ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDelete(r.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
