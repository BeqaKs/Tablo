'use client';

import { useFloorPlanStore } from '@/lib/stores/floor-plan-store';
import { TableElement } from './table-element';
import { useState, useRef, MouseEvent } from 'react';

interface CanvasProps {
    showGrid: boolean;
    zoom: number;
}

export function Canvas({ showGrid, zoom }: CanvasProps) {
    const { tables, selectedTableId, selectTable, updateTable, setDragging, clearSelection } = useFloorPlanStore();
    const [draggedTableId, setDraggedTableId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (tableId: string, e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const table = tables.find(t => t.id === tableId);
        if (!table) return;

        setDraggedTableId(tableId);
        setDragging(true);
        selectTable(tableId);

        // Calculate offset from table position to mouse position
        const rect = e.currentTarget.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!draggedTableId || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const newX = (e.clientX - canvasRect.left - dragOffset.x) / zoom;
        const newY = (e.clientY - canvasRect.top - dragOffset.y) / zoom;

        updateTable(draggedTableId, {
            x_coord: Math.max(0, Math.min(1200 - 100, newX)),
            y_coord: Math.max(0, Math.min(800 - 100, newY)),
        });
    };

    const handleMouseUp = () => {
        setDraggedTableId(null);
        setDragging(false);
    };

    const handleCanvasClick = () => {
        clearSelection();
    };

    return (
        <div
            ref={canvasRef}
            className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
            style={{
                width: '1200px',
                height: '800px',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
        >
            {/* Background Image */}
            {useFloorPlanStore.getState().backgroundImage && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `url(${useFloorPlanStore.getState().backgroundImage})`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: 0.5
                    }}
                />
            )}

            {/* Grid overlay */}
            {showGrid && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
                        backgroundSize: '20px 20px',
                    }}
                />
            )}

            {/* Empty state */}
            {tables.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
                    <div className="text-center">
                        <p className="text-lg font-medium">No tables yet</p>
                        <p className="text-sm">Click on a table shape to add it to the floor plan</p>
                    </div>
                </div>
            )}

            {/* Render tables */}
            {tables.map((table) => (
                <TableElement
                    key={table.id}
                    table={table}
                    isSelected={selectedTableId === table.id}
                    onSelect={() => selectTable(table.id)}
                    onDragStart={(e) => handleMouseDown(table.id, e)}
                />
            ))}
        </div>
    );
}
