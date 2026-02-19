import { create } from 'zustand';
import { Table, TableShape } from '@/types/database';

export interface TablePosition extends Omit<Table, 'id' | 'restaurant_id'> {
    id: string;
    x_coord: number;
    y_coord: number;
    rotation: number; // degrees: 0, 90, 180, 270
    width?: number; // for rectangles
    height?: number; // for rectangles
}

interface FloorPlanState {
    tables: TablePosition[];
    selectedTableId: string | null;
    isDragging: boolean;
    backgroundImage: string | null;
    gridSize: number;
    canvasWidth: number;
    canvasHeight: number;

    // Actions
    addTable: (table: Omit<TablePosition, 'id'>) => void;
    updateTable: (id: string, updates: Partial<TablePosition>) => void;
    deleteTable: (id: string) => void;
    selectTable: (id: string | null) => void;
    setDragging: (isDragging: boolean) => void;
    rotateTable: (id: string) => void;
    duplicateTable: (id: string) => void;
    clearSelection: () => void;

    // Snap to grid utility
    snapToGrid: (value: number) => number;

    // Load/Save
    loadTables: (tables: TablePosition[]) => void;
    setBackgroundImage: (url: string | null) => void;
    reset: () => void;
}

export const useFloorPlanStore = create<FloorPlanState>((set, get) => ({
    tables: [],
    selectedTableId: null,
    isDragging: false,
    backgroundImage: null,
    gridSize: 20, // 20px grid
    canvasWidth: 1200,
    canvasHeight: 800,

    addTable: (table) => {
        const newTable: TablePosition = {
            ...table,
            id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x_coord: get().snapToGrid(table.x_coord),
            y_coord: get().snapToGrid(table.y_coord),
        };

        set((state) => ({
            tables: [...state.tables, newTable],
            selectedTableId: newTable.id,
        }));
    },

    updateTable: (id, updates) => {
        set((state) => ({
            tables: state.tables.map((table) =>
                table.id === id
                    ? {
                        ...table,
                        ...updates,
                        x_coord: updates.x_coord !== undefined ? get().snapToGrid(updates.x_coord) : table.x_coord,
                        y_coord: updates.y_coord !== undefined ? get().snapToGrid(updates.y_coord) : table.y_coord,
                    }
                    : table
            ),
        }));
    },

    deleteTable: (id) => {
        set((state) => ({
            tables: state.tables.filter((table) => table.id !== id),
            selectedTableId: state.selectedTableId === id ? null : state.selectedTableId,
        }));
    },

    selectTable: (id) => {
        set({ selectedTableId: id });
    },

    setDragging: (isDragging) => {
        set({ isDragging });
    },

    rotateTable: (id) => {
        set((state) => ({
            tables: state.tables.map((table) =>
                table.id === id
                    ? { ...table, rotation: (table.rotation + 90) % 360 }
                    : table
            ),
        }));
    },

    duplicateTable: (id) => {
        const table = get().tables.find((t) => t.id === id);
        if (!table) return;

        const newTable: TablePosition = {
            ...table,
            id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x_coord: table.x_coord + 40, // Offset by 40px
            y_coord: table.y_coord + 40,
            table_number: `${table.table_number}-copy`,
        };

        set((state) => ({
            tables: [...state.tables, newTable],
            selectedTableId: newTable.id,
        }));
    },

    clearSelection: () => {
        set({ selectedTableId: null });
    },

    snapToGrid: (value) => {
        const gridSize = get().gridSize;
        return Math.round(value / gridSize) * gridSize;
    },

    loadTables: (tables) => {
        set({ tables, selectedTableId: null });
    },

    setBackgroundImage: (url) => {
        set({ backgroundImage: url });
    },

    reset: () => {
        set({
            tables: [],
            selectedTableId: null,
            isDragging: false,
            backgroundImage: null,
        });
    },
}));
