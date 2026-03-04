import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions
} from 'react-native';
import { Clock, Star, MapPin, ChevronRight } from 'lucide-react-native';
import { Restaurant } from '../types/database';
import { t } from '../localization/i18n';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';

interface TonightsHitlistProps {
    restaurants: Restaurant[];
}

export const TonightsHitlist: React.FC<TonightsHitlistProps> = ({ restaurants }) => {
    const navigation = useNavigation<any>();

    // Only show up to 3 for urgency
    const hitlist = restaurants.slice(0, 3);

    if (hitlist.length === 0) return null;

    // Pseudo-random available time for tonight (same as web)
    const getUrgentTime = (id: string) => {
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hours = [19, 19, 20, 20, 21][hash % 5];
        const mins = [0, 15, 30, 45][hash % 4];
        return `${hours}:${mins === 0 ? '00' : mins}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={styles.badgeContainer}>
                        <View style={styles.dot} />
                        <View style={styles.dotPing} />
                    </View>
                    <Text style={styles.title}>{t('hitlist.title')}</Text>
                </View>
                <Text style={styles.subtitle}>{t('hitlist.subtitle')}</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={280 + 16} // card width + gap
                decelerationRate="fast"
            >
                {hitlist.map((restaurant) => {
                    const time = getUrgentTime(restaurant.id);
                    return (
                        <TouchableOpacity
                            key={restaurant.id}
                            style={styles.card}
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('restaurants/[slug]', { slug: restaurant.slug, id: restaurant.id })}
                        >
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&fit=crop' }}
                                    style={styles.image}
                                />
                                <View style={styles.overlay} />

                                <View style={styles.urgentBadge}>
                                    <Clock size={12} color="#F87171" style={styles.urgentIcon} />
                                    <Text style={styles.urgentText}>
                                        {t('hitlist.tablesLeft', { count: 1, time })}
                                    </Text>
                                </View>

                                <View style={styles.ratingBadge}>
                                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                    <Text style={styles.ratingText}>{restaurant.rating?.toFixed(1) || '4.9'}</Text>
                                </View>
                            </View>

                            <View style={styles.cardBody}>
                                <Text style={styles.restaurantName} numberOfLines={1}>
                                    {restaurant.name}
                                </Text>

                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <MapPin size={12} color="#9CA3AF" />
                                        <Text style={styles.metaText}>{restaurant.city}</Text>
                                    </View>
                                    <View style={styles.metaDivider} />
                                    <Text style={styles.metaText}>{restaurant.cuisine_type}</Text>
                                    <View style={styles.metaDivider} />
                                    <Text style={styles.priceText}>{restaurant.price_range}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.bookButton}
                                    onPress={() => navigation.navigate('restaurants/[slug]', { slug: restaurant.slug, id: restaurant.id })}
                                >
                                    <Text style={styles.bookButtonText}>{t('hitlist.bookNow')}</Text>
                                    <ChevronRight size={14} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 32,
        backgroundColor: '#0A0C10',
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    badgeContainer: {
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        zIndex: 2,
    },
    dotPing: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#F87171',
        opacity: 0.5,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFF',
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 8,
        gap: 16,
    },
    card: {
        width: 280,
        backgroundColor: '#1A1C23',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    imageContainer: {
        height: 160,
        width: '100%',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 28, 35, 0.4)',
    },
    urgentBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    urgentIcon: {
        marginRight: 6,
    },
    urgentText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    ratingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    ratingText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
    cardBody: {
        padding: 16,
    },
    restaurantName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    metaDivider: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#4B5563',
    },
    priceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    bookButton: {
        width: '100%',
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    }
});
