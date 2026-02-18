'use client';

import { useState } from 'react';
import { useFloorPlanStore } from '@/lib/stores/floor-plan-store';
import { Save, Grid3x3, ZoomIn, ZoomOut, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Canvas } from '@/components/floor-plan/canvas';
import { TableLibrary } from '@/components/floor-plan/table-library';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function FloorPlanPage() {
    const { tables, selectedTableId, updateTable, selectTable } = useFloorPlanStore();
    const [showGrid, setShowGrid] = useState(true);
    const [zoom, setZoom] = useState(1);

    const selectedTable = tables.find(t => t.id === selectedTableId);

    const handleSave = async () => {
        // TODO: Save to Supabase
        console.log('Saving floor plan...', tables);
        alert('Floor plan saved! (Mock - will integrate with Supabase)');
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
            {/* Toolbar */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">Floor Plan Editor</h2>
                        <span className="text-sm text-muted-foreground">
                            {tables.length} table{tables.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowGrid(!showGrid)}
                            className={showGrid ? 'bg-primary/10' : ''}
                        >
                            <Grid3x3 className="h-4 w-4 mr-2" />
                            Grid
                        </Button>

                        <div className="flex items-center gap-1 border rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                                disabled={zoom <= 0.5}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                                disabled={zoom >= 2}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-border" />

                        <Button variant="outline" size="sm" disabled>
                            <Undo className="h-4 w-4 mr-2" />
                            Undo
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            <Redo className="h-4 w-4 mr-2" />
                            Redo
                        </Button>

                        <div className="h-6 w-px bg-border" />

                        <Button onClick={handleSave} size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save Floor Plan
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Main Editor Area */}
            <div className="flex-1 grid grid-cols-[1fr_300px] gap-4">
                {/* Canvas Area */}
                <Card className="p-4 bg-gray-50 overflow-auto">
                    <div className="w-full h-full flex items-center justify-center">
                        <div
                            style={{
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center',
                            }}
                        >
                            <Canvas showGrid={showGrid} zoom={zoom} />
                        </div>
                    </div>
                </Card>

                {/* Sidebar */}
                <div className="space-y-4 overflow-auto">
                    {/* Table Library */}
                    <Card className="p-4">
                        <TableLibrary />
                    </Card>

                    {/* Properties Panel */}
                    {selectedTable && (
                        <Card className="p-4">
                            <h3 className="font-semibold mb-4">Table Properties</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="table-number" className="text-sm font-medium">
                                        Table Number
                                    </Label>
                                    <Input
                                        id="table-number"
                                        type="text"
                                        value={selectedTable.table_number}
                                        onChange={(e) => updateTable(selectedTable.id, { table_number: e.target.value })}
                                        className="mt-1"
                                        placeholder="e.g., T1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="capacity" className="text-sm font-medium">
                                        Capacity
                                    </Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        value={selectedTable.capacity}
                                        onChange={(e) => updateTable(selectedTable.id, { capacity: parseInt(e.target.value) || 1 })}
                                        className="mt-1"
                                        placeholder="e.g., 4"
                                        min="1"
                                        max="20"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="zone" className="text-sm font-medium">
                                        Zone
                                    </Label>
                                    <Input
                                        id="zone"
                                        type="text"
                                        value={selectedTable.zone_name}
                                        onChange={(e) => updateTable(selectedTable.id, { zone_name: e.target.value })}
                                        className="mt-1"
                                        placeholder="e.g., Main Hall"
                                    />
                                </div>

                                <div className="pt-2 border-t">
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p>Position: ({selectedTable.x_coord}, {selectedTable.y_coord})</p>
                                        <p>Rotation: {selectedTable.rotation}°</p>
                                        <p>Shape: {selectedTable.shape}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {!selectedTable && (
                        <Card className="p-4 bg-gray-50">
                            <p className="text-sm text-muted-foreground text-center">
                                Select a table to edit its properties
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
