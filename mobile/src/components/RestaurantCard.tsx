import React, { useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Star, MapPin, Clock } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { Restaurant } from '../types/database';

const { width } = Dimensions.get('window');

interface RestaurantCardProps {
    restaurant: Restaurant;
    onPress: (slug: string) => void;
    index?: number;
    style?: any;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onPress, index = 0, style }) => {
    const imageUrl = restaurant.gallery_images?.[0] || restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop';

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={() => onPress(restaurant.slug)}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
        >
            <Animated.View
                style={[
                    styles.container,
                    style,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { scale: scaleAnim },
                            { translateY: slideAnim },
                        ],
                    },
                ]}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                    {/* Gradient overlay */}
                    <View style={styles.imageGradient} />

                    <View style={styles.badgeContainer}>
                        <Text style={styles.cuisineBadge}>{restaurant.cuisine_type}</Text>
                    </View>
                    <View style={styles.ratingOverlay}>
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text style={styles.ratingText}>{restaurant.rating || '4.8'}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                        <Text style={styles.price}>{'$'.repeat(restaurant.price_range?.length || 3)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoChip}>
                            <MapPin size={13} color={Colors.textMuted} />
                            <Text style={styles.infoText} numberOfLines={1}>
                                {restaurant.city || 'Tbilisi'}
                            </Text>
                        </View>
                        <View style={styles.dot} />
                        <View style={styles.infoChip}>
                            <Clock size={13} color={Colors.textMuted} />
                            <Text style={styles.infoText}>Open Now</Text>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
        width: width - 32,
        alignSelf: 'center',
    },
    imageContainer: {
        height: 180,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // Subtle dark gradient at the bottom for text readability
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cuisineBadge: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    ratingOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
    },
    content: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    name: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        flex: 1,
        marginRight: 8,
        letterSpacing: -0.3,
    },
    price: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.textMuted,
        marginHorizontal: 8,
    },
    infoText: {
        fontSize: 13,
        color: Colors.textMuted,
        fontWeight: '500',
    },
});
