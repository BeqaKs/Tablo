'use client';

import { useState, useRef, useEffect } from 'react';
import { TableElement } from './table-element';
import { TablePosition } from '@/lib/stores/floor-plan-store';

interface FloorPlanViewerProps {
    tables: TablePosition[];
    backgroundImage?: string | null;
    selectedTableId?: string | null;
    onTableSelect?: (tableId: string) => void;
    getTableStatus?: (table: TablePosition) => 'available' | 'booked' | 'disabled';
    getBookingInfo?: (table: TablePosition) => {
        guestName: string;
        time: string;
        partySize: number;
        notes?: string;
    } | undefined;
    className?: string;
}

export function FloorPlanViewer({
    tables,
    backgroundImage,
    selectedTableId,
    onTableSelect,
    getTableStatus,
    getBookingInfo,
    className = ""
}: FloorPlanViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Auto-scale to fit container
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                // Base width is 1200px from Canvas default
                const newScale = Math.min(width / 1200, 1);
                setScale(newScale);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden bg-white border rounded-lg ${className}`}
            style={{ height: `${800 * scale}px` }} // Maintain aspect ratio
        >
            <div
                className="absolute origin-top-left"
                style={{
                    width: '1200px',
                    height: '800px',
                    transform: `scale(${scale})`
                }}
            >
                {/* Background Image */}
                {backgroundImage && (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            backgroundImage: `url(${backgroundImage})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.8
                        }}
                    />
                )}

                {/* Empty State */}
                {!backgroundImage && tables.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-50">
                        <p>No floor plan available</p>
                    </div>
                )}

                {/* Tables */}
                {tables.map((table) => {
                    const status = getTableStatus ? getTableStatus(table) : 'available';
                    const bookingInfo = getBookingInfo ? getBookingInfo(table) : undefined;
                    return (
                        <TableElement
                            key={table.id}
                            table={table}
                            isSelected={selectedTableId === table.id}
                            onSelect={() => onTableSelect?.(table.id)}
                            readOnly={true}
                            status={status}
                            bookingInfo={bookingInfo}
                        />
                    );
                })}
            </div>
        </div>
    );
}
