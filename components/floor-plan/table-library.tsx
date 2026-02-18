'use client';

import { useFloorPlanStore } from '@/lib/stores/floor-plan-store';
import { TableShape } from '@/types/database';
import { Square, Circle, RectangleHorizontal } from 'lucide-react';

export function TableLibrary() {
    const { addTable } = useFloorPlanStore();

    const handleAddTable = (shape: TableShape) => {
        const tableCount = useFloorPlanStore.getState().tables.length;

        addTable({
            table_number: `T${tableCount + 1}`,
            capacity: shape === 'rectangle' ? 6 : 4,
            shape,
            x_coord: 100 + (tableCount * 20), // Offset each new table
            y_coord: 100 + (tableCount * 20),
            rotation: 0,
            zone_name: 'Main Hall',
            width: shape === 'rectangle' ? 100 : undefined,
            height: shape === 'rectangle' ? 60 : undefined,
        });
    };

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Add Tables
            </h3>

            <div className="grid grid-cols-2 gap-2">
                {/* Square Table */}
                <button
                    onClick={() => handleAddTable('square')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 smooth-transition group"
                >
                    <div className="w-12 h-12 mx-auto bg-primary/10 group-hover:bg-primary/20 rounded-lg flex items-center justify-center smooth-transition">
                        <Square className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs mt-2 font-medium">Square</p>
                    <p className="text-xs text-muted-foreground">4 seats</p>
                </button>

                {/* Round Table */}
                <button
                    onClick={() => handleAddTable('round')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 smooth-transition group"
                >
                    <div className="w-12 h-12 mx-auto bg-primary/10 group-hover:bg-primary/20 rounded-full flex items-center justify-center smooth-transition">
                        <Circle className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs mt-2 font-medium">Round</p>
                    <p className="text-xs text-muted-foreground">4 seats</p>
                </button>

                {/* Rectangle Table */}
                <button
                    onClick={() => handleAddTable('rectangle')}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 smooth-transition group col-span-2"
                >
                    <div className="w-full h-10 bg-primary/10 group-hover:bg-primary/20 rounded-lg flex items-center justify-center smooth-transition">
                        <RectangleHorizontal className="h-6 w-8 text-primary" />
                    </div>
                    <p className="text-xs mt-2 font-medium">Rectangle</p>
                    <p className="text-xs text-muted-foreground">6 seats</p>
                </button>
            </div>

            <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                    Click to add a table to the floor plan. Drag to position, click to select, and use the toolbar to rotate or delete.
                </p>
            </div>
        </div>
    );
}
