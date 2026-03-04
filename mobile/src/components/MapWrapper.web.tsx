import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface MapWrapperProps {
    initialRegion?: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    markers?: Array<{
        id: string;
        latitude: number;
        longitude: number;
        title: string;
        description?: string;
        onPress?: () => void;
    }>;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    style?: any;
    mapRef?: any;
}

export function MapWrapper({ style }: MapWrapperProps) {
    return (
        <View style={[styles.webFallback, style]}>
            <Text style={styles.emoji}>🗺️</Text>
            <Text style={styles.text}>Map View</Text>
            <Text style={styles.subtext}>Available on mobile</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    webFallback: {
        backgroundColor: '#F0F4F8',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        minHeight: 200,
    },
    emoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    subtext: {
        fontSize: 12,
        color: Colors.textMuted,
        fontWeight: '500',
    },
});
