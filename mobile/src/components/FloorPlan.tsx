import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView
} from 'react-native';
import { Shadows } from '../constants/Colors';
import { Table, FloorPlanSchema } from '../types/database';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloorPlanProps {
    tables: Table[];
    floorPlanJson?: FloorPlanSchema | null;
    selectedTableId?: string;
    onSelect: (tableId: string) => void;
}

export const FloorPlan: React.FC<FloorPlanProps> = ({
    tables,
    floorPlanJson,
    selectedTableId,
    onSelect
}) => {
    const { colors, isDark } = useTheme();
    const styles = getStyles(colors, isDark);
    // If we have floorPlanJson, we use its canvas dimensions, otherwise we infer
    const canvasWidth = floorPlanJson?.canvasWidth || 1000;
    const canvasHeight = floorPlanJson?.canvasHeight || 800;

    // Scale factor to fit the floor plan into the container width
    const containerWidth = SCREEN_WIDTH - 48; // padding
    const scale = containerWidth / canvasWidth;

    // Grid layout fallback for tables without coordinates
    const tablesWithoutCoords = tables.filter(t => t.x_coord === null || t.y_coord === null);
    const gridCols = Math.ceil(Math.sqrt(tablesWithoutCoords.length || 1));
    const cellWidth = containerWidth / gridCols;
    const cellHeight = 80; // Reasonable default height for grid rows

    const numRows = Math.ceil(tablesWithoutCoords.length / gridCols);
    const gridHeight = numRows > 0 ? numRows * cellHeight + 40 : 0;
    const containerHeight = Math.max(canvasHeight * scale, gridHeight);

    const renderTable = (table: Table, index: number) => {
        const isSelected = selectedTableId === table.id;

        let left = 0;
        let top = 0;

        if (table.x_coord !== null && table.y_coord !== null) {
            // Convert coords (which are likely 0-1000) to actual pixels
            left = (table.x_coord || 0) * scale;
            top = (table.y_coord || 0) * scale;
        } else {
            // Find our index in the "no coords" list
            const noCoordIndex = tablesWithoutCoords.findIndex(t => t.id === table.id);
            if (noCoordIndex !== -1) {
                const row = Math.floor(noCoordIndex / gridCols);
                const col = noCoordIndex % gridCols;
                left = col * cellWidth + (cellWidth - ((table.width || 60) * scale)) / 2;
                top = row * cellHeight + 20;
            }
        }

        // Default sizes if not specified
        const tableWidth = (table.width || 60) * scale;
        const tableHeight = (table.height || 60) * scale;

        return (
            <TouchableOpacity
                key={table.id}
                activeOpacity={0.8}
                onPress={() => onSelect(table.id)}
                style={[
                    styles.table,
                    isSelected && styles.selectedTable,
                    {
                        left,
                        top,
                        width: tableWidth,
                        height: tableHeight,
                        borderRadius: table.shape === 'round' ? tableWidth / 2 : 4,
                        transform: [{ rotate: `${table.rotation || 0}deg` }]
                    }
                ]}
            >
                <Text style={[
                    styles.tableNumber,
                    isSelected && styles.selectedTableText
                ]}>
                    {table.table_number}
                </Text>
                <Text style={[
                    styles.tableCapacity,
                    isSelected && styles.selectedTableText
                ]}>
                    {table.capacity}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.canvas, { width: containerWidth, height: containerHeight }]}>
                {/* Zones could be rendered here if floorPlanJson exists */}
                {floorPlanJson?.zones?.map((zone: any) => (
                    <View key={zone.id} style={styles.zoneOverlay}>
                        {/* Zone rendering logic if needed */}
                    </View>
                ))}

                {/* Render Tables */}
                {tables.map((t, i) => renderTable(t, i))}
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.legendText}>Selected</Text>
                </View>
            </View>
        </View>
    );
};

function getStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        outerContainer: {
            alignItems: 'center',
        },
        canvas: {
            backgroundColor: colors.surfaceElevated || colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            position: 'relative',
            ...Shadows.sm,
        },
        table: {
            position: 'absolute',
            backgroundColor: colors.surfaceElevated || colors.surface,
            borderWidth: 2,
            borderColor: colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            ...Shadows.sm,
        },
        selectedTable: {
            backgroundColor: isDark ? 'rgba(212, 72, 62, 0.2)' : colors.primarySoft,
            borderColor: colors.primary,
        },
        tableNumber: {
            fontSize: 12,
            fontWeight: '800',
            color: colors.text,
        },
        tableCapacity: {
            fontSize: 9,
            fontWeight: '600',
            color: colors.textMuted,
        },
        selectedTableText: {
            color: colors.primary,
        },
        zoneOverlay: {
            position: 'absolute',
            // In a real app, zones would have boundaries
        },
        legend: {
            flexDirection: 'row',
            gap: 20,
            marginTop: 16,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        legendDot: {
            width: 12,
            height: 12,
            borderRadius: 6,
        },
        legendText: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textMuted,
        },
    });
}
