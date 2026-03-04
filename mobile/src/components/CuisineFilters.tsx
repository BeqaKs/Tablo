import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface CuisineFiltersProps {
    selectedCuisine: string | null;
    onSelectCuisine: (cuisine: string | null) => void;
}

const CUISINES = [
    { id: 'all', label: '✨ All', value: null },
    { id: 'georgian', label: '🇬🇪 Georgian', value: 'Georgian' },
    { id: 'italian', label: '🇮🇹 Italian', value: 'Italian' },
    { id: 'japanese', label: '🇯🇵 Japanese', value: 'Japanese' },
    { id: 'european', label: '🇪🇺 European', value: 'European' },
    { id: 'steakhouse', label: '🥩 Steakhouse', value: 'Steakhouse' },
    { id: 'fusion', label: '🍜 Fusion', value: 'Fusion' },
    { id: 'middle_eastern', label: '🧆 Middle Eastern', value: 'Middle Eastern' },
    { id: 'asian', label: '🥢 Asian', value: 'Asian' },
];

export const CuisineFilters: React.FC<CuisineFiltersProps> = ({
    selectedCuisine,
    onSelectCuisine,
}) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {CUISINES.map((cuisine) => {
                    const isSelected = selectedCuisine === cuisine.value;
                    return (
                        <TouchableOpacity
                            key={cuisine.id}
                            activeOpacity={0.7}
                            onPress={() => onSelectCuisine(cuisine.value)}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected,
                                ]}
                            >
                                {cuisine.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
});
