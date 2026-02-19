'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAdminRestaurants, getAdminTables, createAdminTable, updateAdminTable, deleteAdminTable, saveFloorPlan } from '@/app/actions/admin';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Save, Undo, ZoomIn, ZoomOut, Upload } from 'lucide-react';
import { useFloorPlanStore } from '@/lib/stores/floor-plan-store';
import { Canvas } from '@/components/floor-plan/canvas';
import { TablePosition } from '@/lib/stores/floor-plan-store';

export default function AdminTablesPage() {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [zoom, setZoom] = useState(0.8);
    const [bgImageUrl, setBgImageUrl] = useState('');

    // Store Access
    const { tables: storeTables, loadTables, addTable, deleteTable, setBackgroundImage, backgroundImage } = useFloorPlanStore();

    const [form, setForm] = useState({
        table_number: '', capacity: 2, shape: 'square' as string,
        x_coord: 100, y_coord: 100, zone_name: 'Main', width: 60, height: 60
    });

    useEffect(() => {
        async function load() {
            const { data } = await getAdminRestaurants();
            if (data) {
                setRestaurants(data);
                if (data.length > 0) setSelectedRestaurant(data[0].id);
            }
            setLoading(false);
        }
        load();
    }, []);

    useEffect(() => {
        if (selectedRestaurant) {
            loadRestaurantTables();
            // Load background image from restaurant data
            const restaurant = restaurants.find(r => r.id === selectedRestaurant);
            if (restaurant?.floor_plan_json?.backgroundImage) {
                setBackgroundImage(restaurant.floor_plan_json.backgroundImage);
                setBgImageUrl(restaurant.floor_plan_json.backgroundImage);
            } else {
                setBackgroundImage(null);
                setBgImageUrl('');
            }
        }
    }, [selectedRestaurant, restaurants]); // Added restaurants dep to catch initial load

    async function loadRestaurantTables() {
        const { data, error } = await getAdminTables(selectedRestaurant);
        if (error) toast.error(error);
        if (data) {
            // Map DB tables to store format
            const mappedTables: TablePosition[] = data.map((t: any) => ({
                ...t,
                // Ensure coords are numbers
                x_coord: Number(t.x_coord) || 0,
                y_coord: Number(t.y_coord) || 0,
                rotation: Number(t.rotation) || 0,
            }));
            loadTables(mappedTables);
        }
    }

    async function handleCreate() {
        if (!form.table_number) { toast.error('Table number is required'); return; }

        // 1. Create in DB first
        const { data: newTable, error } = await createAdminTable({
            restaurant_id: selectedRestaurant,
            ...form,
            capacity: Number(form.capacity),
            // Use current zoom center if possible, or default
            x_coord: 100,
            y_coord: 100,
        });

        if (error) {
            toast.error(error);
        } else if (newTable) {
            toast.success('Table created!');
            setShowCreate(false);
            // 2. Add to store directly without full reload to preserve unsaved drags
            addTable({
                ...newTable,
                x_coord: Number(newTable.x_coord),
                y_coord: Number(newTable.y_coord),
                rotation: Number(newTable.rotation),
            } as any); // Cast to handle id mismatch if any

            setForm({ table_number: '', capacity: 2, shape: 'square', x_coord: 0, y_coord: 0, zone_name: 'Main', width: 60, height: 60 });
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this table?')) return;
        const { error } = await deleteAdminTable(id);
        if (error) toast.error(error);
        else {
            toast.success('Table deleted');
            deleteTable(id);
        }
    }

    async function handleSaveLayout() {
        const toastId = toast.loading('Saving layout...');
        // Save store tables + current background image to DB
        const { error } = await saveFloorPlan(
            selectedRestaurant,
            storeTables,
            backgroundImage
        );

        if (error) {
            toast.dismiss(toastId);
            toast.error(error);
        } else {
            toast.dismiss(toastId);
            toast.success('Floor plan saved successfully!');

            // Update local restaurants state to reflect new background image
            setRestaurants(prev => prev.map(r =>
                r.id === selectedRestaurant
                    ? { ...r, floor_plan_json: { ...r.floor_plan_json, backgroundImage } }
                    : r
            ));
        }
    }

    function handleUpdateBackground() {
        if (!bgImageUrl) return;
        setBackgroundImage(bgImageUrl);
        toast.info('Background set. Don\'t forget to Save Layout!');
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (result) {
                    setBgImageUrl(result); // Show in input
                    setBackgroundImage(result); // Set in store
                    toast.success('Image loaded locally. Save to persist.');
                }
            };
            reader.readAsDataURL(file);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const selectedRestaurantName = restaurants.find(r => r.id === selectedRestaurant)?.name || 'Select a restaurant';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Floor Plan Builder</h1>
                    <p className="text-muted-foreground">Design your restaurant layout</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-white border rounded-lg p-1 mr-2">
                        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.2, zoom - 0.1))} title="Zoom Out">
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))} title="Zoom In">
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" onClick={() => loadRestaurantTables()} title="Reset to last saved">
                        <Undo className="h-4 w-4 mr-2" />
                        Reset
                    </Button>
                    <Button onClick={handleSaveLayout} className="min-w-[120px]">
                        <Save className="h-4 w-4 mr-2" />
                        Save Layout
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <Card className="p-4 grid md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Select Restaurant</label>
                    <select
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        value={selectedRestaurant}
                        onChange={e => setSelectedRestaurant(e.target.value)}
                    >
                        {restaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name} ({r.city})</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Background Image (URL)</label>
                    <div className="flex gap-2">
                        <input
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                            placeholder="https://example.com/plan.jpg or Drop file below"
                            value={bgImageUrl}
                            onChange={(e) => setBgImageUrl(e.target.value)}
                        />
                        <Button variant="secondary" onClick={handleUpdateBackground}>
                            Update
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Quick Add Table */}
            {showCreate && (
                <Card className="p-6 border-primary/20 bg-primary/5 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add Table to {selectedRestaurantName}</h3>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Table No.</label>
                            <input className="w-full border rounded px-2 py-1.5 text-sm" value={form.table_number}
                                onChange={e => setForm({ ...form, table_number: e.target.value })} placeholder="T1" />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Shape</label>
                            <select className="w-full border rounded px-2 py-1.5 text-sm" value={form.shape}
                                onChange={e => setForm({ ...form, shape: e.target.value })}>
                                <option value="square">Square</option>
                                <option value="round">Round</option>
                                <option value="rectangle">Rectangle</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Capacity</label>
                            <input type="number" className="w-full border rounded px-2 py-1.5 text-sm"
                                value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 2 })} />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={handleCreate} size="sm">Add</Button>
                            <Button variant="ghost" onClick={() => setShowCreate(false)} size="sm">Cancel</Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="flex gap-6 h-[calc(100vh-250px)]">
                {/* Left: Toolbar */}
                <div className="w-64 flex flex-col gap-4">
                    <Button
                        onClick={() => setShowCreate(!showCreate)}
                        variant={showCreate ? "secondary" : "default"}
                        className="w-full"
                    >
                        {showCreate ? 'Close Form' : 'Add New Table'}
                    </Button>

                    <Card className="flex-1 p-4 overflow-y-auto">
                        <h3 className="font-medium text-sm text-muted-foreground mb-4">Table List</h3>
                        <div className="space-y-2">
                            {storeTables.map(table => (
                                <div key={table.id} className="flex items-center justify-between p-2 border rounded text-sm hover:bg-gray-50 group">
                                    <span className="font-medium">{table.table_number}</span>
                                    <span className="text-xs text-muted-foreground">{table.capacity}p</span>
                                    <button
                                        onClick={() => handleDelete(table.id)}
                                        className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                            {storeTables.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-4">No tables yet</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: Canvas */}
                <div
                    className="flex-1 bg-gray-100 rounded-xl overflow-hidden shadow-inner border relative group"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <div className="absolute inset-0 overflow-auto p-4 bg-gray-50/50">
                        <div style={{ width: '1200px', height: '800px', transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.1s ease-out', margin: '0 auto' }}>
                            <Canvas showGrid={true} zoom={zoom} />
                        </div>
                    </div>

                    {/* Drag overlay hint */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-primary font-medium flex items-center gap-2 bg-white/90 p-3 rounded-full shadow-sm">
                            <Upload className="h-4 w-4" />
                            Drop image to update background
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
