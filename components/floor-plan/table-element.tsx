'use client';

import { useFloorPlanStore, TablePosition } from '@/lib/stores/floor-plan-store';
import { useState, useRef, MouseEvent } from 'react';
import { RotateCw, Trash2 } from 'lucide-react';

interface TableElementProps {
    table: TablePosition;
    isSelected: boolean;
    onSelect: () => void;
    onDragStart?: (e: MouseEvent<HTMLDivElement>) => void;
    readOnly?: boolean;
    status?: 'available' | 'booked' | 'disabled';
    bookingInfo?: {
        guestName: string;
        time: string;
        partySize: number;
        notes?: string;
    };
}

export function TableElement({ table, isSelected, onSelect, onDragStart, readOnly = false, status = 'available', bookingInfo }: TableElementProps) {
    const { rotateTable, deleteTable } = useFloorPlanStore();
    const [isHovered, setIsHovered] = useState(false);

    const getStatusColor = () => {
        if (isSelected) return 'stroke-primary fill-primary/20';
        if (readOnly) {
            switch (status) {
                case 'booked': return 'stroke-red-500 fill-red-100';
                case 'disabled': return 'stroke-gray-300 fill-gray-100';
                case 'available': return 'stroke-green-600 fill-green-100 hover:fill-green-200';
                default: return 'stroke-foreground';
            }
        }
        return 'stroke-foreground fill-background'; // Editor mode default
    };

    const renderShape = () => {
        const baseSize = 60;
        const commonProps = {
            className: `smooth-transition stroke-2 ${getStatusColor()}`,
            fill: "currentColor"
        };

        switch (table.shape) {
            case 'square':
                // ... (existing code)
                return (
                    <rect
                        x={0}
                        y={0}
                        width={baseSize}
                        height={baseSize}
                        rx={4}
                        {...commonProps}
                    />
                );
            case 'round':
                return (
                    <circle
                        cx={baseSize / 2}
                        cy={baseSize / 2}
                        r={baseSize / 2}
                        {...commonProps}
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
                        {...commonProps}
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
            className={`absolute ${readOnly ? (status === 'available' ? 'cursor-pointer' : 'cursor-not-allowed') : 'cursor-move'} group ${isSelected ? 'z-10' : 'z-0'}`}
            style={{
                left: `${table.x_coord}px`,
                top: `${table.y_coord}px`,
                transform: `rotate(${table.rotation}deg)`,
                transformOrigin: 'center',
            }}
            onMouseDown={readOnly ? undefined : onDragStart}
            onClick={(e) => {
                e.stopPropagation();
                if (readOnly && status !== 'available') return;
                onSelect();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
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

            {/* Booking Info Tooltip */}
            {isHovered && bookingInfo && (
                <div
                    className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-lg p-3 w-48 pointer-events-none"
                    style={{
                        bottom: '100%',
                        left: '50%',
                        transform: `translateX(-50%) rotate(${-table.rotation}deg) translateY(-10px)`,
                        transformOrigin: 'bottom center'
                    }}
                >
                    <div className="font-bold text-sm mb-1">{bookingInfo.guestName}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <span>🕒 {bookingInfo.time}</span>
                        <span>👥 {bookingInfo.partySize}p</span>
                    </div>
                    {bookingInfo.notes && (
                        <div className="text-xs italic text-gray-500 mt-1 border-t pt-1">
                            "{bookingInfo.notes}"
                        </div>
                    )}
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                </div>
            )}

            {/* Action Buttons (visible on hover or when selected) - Only in Edit Mode */}
            {isSelected && !readOnly && (
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
