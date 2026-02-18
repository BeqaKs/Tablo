'use client';

import { useFloorPlanStore, TablePosition } from '@/lib/stores/floor-plan-store';
import { useState, useRef, MouseEvent } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

interface TableElementProps {
    table: TablePosition;
    isSelected: boolean;
    onSelect: () => void;
    onDragStart: (e: MouseEvent<HTMLDivElement>) => void;
}

export function TableElement({ table, isSelected, onSelect, onDragStart }: TableElementProps) {
    const { rotateTable, deleteTable } = useFloorPlanStore();

    const renderShape = () => {
        const baseSize = 60;
        const shapeProps = {
            className: `smooth-transition ${isSelected ? 'fill-primary/30 stroke-primary' : 'fill-white stroke-gray-400'}`,
            strokeWidth: 2,
        };

        switch (table.shape) {
            case 'square':
                return (
                    <rect
                        x={0}
                        y={0}
                        width={baseSize}
                        height={baseSize}
                        rx={4}
                        {...shapeProps}
                    />
                );
            case 'round':
                return (
                    <circle
                        cx={baseSize / 2}
                        cy={baseSize / 2}
                        r={baseSize / 2}
                        {...shapeProps}
                    />
                );
            case 'rectangle':
                return (
                    <rect
                        x={0}
                        y={0}
                        width={table.width || 100}
                        height={table.height || 60}
                        rx={4}
                        {...shapeProps}
                    />
                );
            default:
                return null;
        }
    };

    const getSize = () => {
        if (table.shape === 'rectangle') {
            return { width: table.width || 100, height: table.height || 60 };
        }
        return { width: 60, height: 60 };
    };

    const size = getSize();

    return (
        <div
            className={`absolute cursor-move group ${isSelected ? 'z-10' : 'z-0'}`}
            style={{
                left: `${table.x_coord}px`,
                top: `${table.y_coord}px`,
                transform: `rotate(${table.rotation}deg)`,
                transformOrigin: 'center',
            }}
            onMouseDown={onDragStart}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Table Shape */}
            <svg width={size.width} height={size.height} className="overflow-visible">
                {renderShape()}

                {/* Table Number */}
                <text
                    x={size.width / 2}
                    y={size.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-bold fill-foreground pointer-events-none"
                    style={{ transform: `rotate(${-table.rotation}deg)`, transformOrigin: 'center' }}
                >
                    {table.table_number}
                </text>

                {/* Capacity Badge */}
                <text
                    x={size.width / 2}
                    y={size.height / 2 + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs fill-muted-foreground pointer-events-none"
                    style={{ transform: `rotate(${-table.rotation}deg)`, transformOrigin: 'center' }}
                >
                    {table.capacity}p
                </text>
            </svg>

            {/* Selection Indicator */}
            {isSelected && (
                <div
                    className="absolute inset-0 border-2 border-primary rounded pointer-events-none"
                    style={{
                        width: `${size.width}px`,
                        height: `${size.height}px`,
                    }}
                />
            )}

            {/* Action Buttons (visible on hover or when selected) */}
            {isSelected && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 bg-white border rounded-lg shadow-lg p-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            rotateTable(table.id);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded smooth-transition"
                        title="Rotate 90°"
                    >
                        <RotateCw className="h-4 w-4 text-foreground" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteTable(table.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded smooth-transition"
                        title="Delete table"
                    >
                        <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                </div>
            )}
        </div>
    );
}
