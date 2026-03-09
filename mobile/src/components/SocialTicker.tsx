import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions
} from 'react-native';
import { t } from '../localization/i18n';
import { Restaurant } from '../types/database';

const { width } = Dimensions.get('window');

interface SocialTickerProps {
    restaurants: Restaurant[];
}

export const SocialTicker: React.FC<SocialTickerProps> = ({ restaurants }) => {
    const scrollX = useRef(new Animated.Value(0));

    const NAMES = ['Nino', 'Giorgi', 'Ana', 'Luka', 'Mari', 'David', 'Tamar', 'Sandro', 'Keti', 'Nika', 'Salome', 'Beka', 'Elene', 'Levan'];
    const ACTIONS = ['just booked', 'reserved a table at', 'made a reservation at'];
    const TIMES = ['just now', '1 min ago', '2 min ago', '3 min ago', '5 min ago', '8 min ago', '12 min ago'];

    const items = restaurants.length > 0 ? restaurants.flatMap((r, i) => [
        { text: `${NAMES[i % NAMES.length]} ${ACTIONS[i % 3]} ${r.name}`, time: TIMES[i % TIMES.length] },
        { text: `${5 + (i * 7) % 19} people viewing ${r.name} right now`, time: '' },
    ]).slice(0, 12) : [];

    const ITEM_WIDTH = 250;
    const totalWidth = items.length * ITEM_WIDTH;

    useEffect(() => {
        if (restaurants.length === 0 || items.length === 0) return;

        const startAnimation = () => {
            scrollX.current.setValue(0);
            Animated.timing(scrollX.current, {
                toValue: -totalWidth,
                duration: items.length * 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(() => startAnimation());
        };

        startAnimation();
    }, [totalWidth, restaurants.length, items.length]);

    if (restaurants.length === 0 || items.length === 0) {
        return <View style={{ height: 40, backgroundColor: '#F9FAFB' }} />;
    }

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.tickerWrapper, { transform: [{ translateX: scrollX.current }] }]}>
                {/* Duplicate items for seamless loop */}
                {[...items, ...items].map((item, i) => (
                    <View key={i} style={[styles.tickerItem, { width: ITEM_WIDTH }]}>
                        <View style={styles.dot} />
                        <Text style={styles.itemText}>
                            {item.text}
                            {item.time ? <Text style={styles.timeText}> · {item.time}</Text> : null}
                        </Text>
                        <Text style={styles.separator}>·</Text>
                    </View>
                ))}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 40,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    tickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 8,
    },
    itemText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    timeText: {
        color: '#9CA3AF',
        fontWeight: '400',
    },
    separator: {
        color: '#D1D5DB',
        marginLeft: 15,
    }
});
