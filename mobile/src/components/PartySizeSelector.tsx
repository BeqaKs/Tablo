import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';

interface PartySizeSelectorProps {
    selectedSize: number;
    onSelect: (size: number) => void;
    maxSize?: number;
}

export const PartySizeSelector: React.FC<PartySizeSelectorProps> = ({
    selectedSize,
    onSelect,
    maxSize = 12
}) => {
    const sizes = Array.from({ length: maxSize }, (_, i) => i + 1);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {sizes.map((size) => (
                    <TouchableOpacity
                        key={size}
                        activeOpacity={0.7}
                        onPress={() => onSelect(size)}
                        style={[
                            styles.sizeButton,
                            selectedSize === size && styles.selectedButton
                        ]}
                    >
                        <Text style={[
                            styles.sizeText,
                            selectedSize === size && styles.selectedText
                        ]}>
                            {size}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    sizeButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedButton: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    sizeText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    selectedText: {
        color: '#FFFFFF',
    },
});
