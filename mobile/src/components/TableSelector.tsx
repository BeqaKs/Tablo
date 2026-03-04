import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Table } from '../types/database';
import { Armchair, Users } from 'lucide-react-native';

interface TableSelectorProps {
    tables: Table[];
    selectedTableId?: string;
    onSelect: (tableId: string) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({
    tables,
    selectedTableId,
    onSelect
}) => {
    const renderTable = ({ item }: { item: Table }) => {
        const isSelected = selectedTableId === item.id;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelect(item.id)}
                style={[
                    styles.tableCard,
                    isSelected && styles.selectedCard
                ]}
            >
                <View style={[
                    styles.iconContainer,
                    isSelected && styles.selectedIconContainer
                ]}>
                    <Armchair size={24} color={isSelected ? '#FFF' : Colors.text} />
                </View>

                <View style={styles.tableInfo}>
                    <Text style={[
                        styles.tableNumber,
                        isSelected && styles.selectedText
                    ]}>
                        Table {item.table_number}
                    </Text>
                    <View style={styles.capacityRow}>
                        <Users size={12} color={isSelected ? 'rgba(255,255,255,0.7)' : Colors.textMuted} />
                        <Text style={[
                            styles.capacityText,
                            isSelected && styles.selectedTextMuted
                        ]}>
                            Up to {item.capacity} guests
                        </Text>
                    </View>
                </View>

                <View style={styles.zoneBadge}>
                    <Text style={styles.zoneText}>{item.location_type}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={tables}
                renderItem={renderTable}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                scrollEnabled={false} // Since it will be inside another ScrollView in the Modal
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    row: {
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
    },
    listContent: {
        paddingHorizontal: 4,
    },
    tableCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        maxWidth: '48%',
    },
    selectedCard: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    selectedIconContainer: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    tableInfo: {
        alignItems: 'center',
        marginBottom: 12,
    },
    tableNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    capacityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    capacityText: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    selectedText: {
        color: '#FFFFFF',
    },
    selectedTextMuted: {
        color: 'rgba(255,255,255,0.7)',
    },
    zoneBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
    },
    zoneText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
    },
});
