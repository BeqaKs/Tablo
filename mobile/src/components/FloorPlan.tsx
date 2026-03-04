import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView
} from 'react-native';
import { Colors, Shadows } from '../constants/Colors';
import { Table, FloorPlanSchema } from '../types/database';

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
    // If we have floorPlanJson, we use its canvas dimensions, otherwise we infer
    const canvasWidth = floorPlanJson?.canvasWidth || 1000;
    const canvasHeight = floorPlanJson?.canvasHeight || 800;

    // Scale factor to fit the floor plan into the container width
    const containerWidth = SCREEN_WIDTH - 48; // padding
    const scale = containerWidth / canvasWidth;
    const containerHeight = canvasHeight * scale;

    const renderTable = (table: Table) => {
        const isSelected = selectedTableId === table.id;

        // Convert coords (which are likely 0-1000) to actual pixels
        const left = table.x_coord * scale;
        const top = table.y_coord * scale;

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
                {floorPlanJson?.zones?.map(zone => (
                    <View key={zone.id} style={styles.zoneOverlay}>
                        {/* Zone rendering logic if needed */}
                    </View>
                ))}

                {/* Render Tables */}
                {tables.map(renderTable)}
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.border }]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                    <Text style={styles.legendText}>Selected</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        alignItems: 'center',
    },
    canvas: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        position: 'relative',
        ...Shadows.sm,
    },
    table: {
        position: 'absolute',
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    selectedTable: {
        backgroundColor: Colors.primarySoft,
        borderColor: Colors.primary,
    },
    tableNumber: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.text,
    },
    tableCapacity: {
        fontSize: 9,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    selectedTableText: {
        color: Colors.primary,
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
        color: Colors.textMuted,
    },
});
