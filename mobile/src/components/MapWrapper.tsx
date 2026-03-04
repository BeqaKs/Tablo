import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

export function MapWrapper({
    initialRegion,
    markers = [],
    scrollEnabled = true,
    zoomEnabled = true,
    style,
    mapRef,
}: MapWrapperProps) {
    return (
        <MapView
            ref={mapRef}
            style={[StyleSheet.absoluteFillObject, style]}
            initialRegion={initialRegion || {
                latitude: 41.7151,
                longitude: 44.8271,
                latitudeDelta: 0.06,
                longitudeDelta: 0.06,
            }}
            scrollEnabled={scrollEnabled}
            zoomEnabled={zoomEnabled}
        >
            {markers.map((marker) => (
                <Marker
                    key={marker.id}
                    coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                    title={marker.title}
                    description={marker.description}
                    onCalloutPress={marker.onPress}
                >
                    <View style={styles.markerContainer}>
                        <View style={styles.markerDot} />
                    </View>
                </Marker>
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    markerContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    markerDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    }
});
