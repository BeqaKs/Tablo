import React from 'react';
import { Platform, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Search, Heart, Calendar, User, LayoutDashboard, Map, Menu } from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { useAuth } from '../../src/context/AuthContext';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
    const { profile } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarShowLabel: false, // Hide labels for a cleaner, modern look
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 32 : 16,
                    left: 20,
                    right: 20,
                    height: 64,
                    borderRadius: 32,
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.95)',
                },
                tabBarBackground: () =>
                    Platform.OS === 'ios' ? (
                        <BlurView
                            tint="light"
                            intensity={80}
                            style={StyleSheet.absoluteFillObject}
                        />
                    ) : undefined,
                tabBarItemStyle: {
                    paddingTop: 0,
                    paddingBottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                headerShown: false,
                tabBarButton: (props) => (
                    <TouchableOpacity
                        {...(props as any)}
                        activeOpacity={0.7}
                        onPress={(e) => {
                            if (Platform.OS === 'ios') {
                                Haptics.selectionAsync();
                            }
                            props.onPress?.(e);
                        }}
                    />
                )
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t('navigation.home') || 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Home size={22} color={focused ? '#FFF' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: t('navigation.myBookings') || 'Bookings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Calendar size={22} color={focused ? '#FFF' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: t('navigation.explore') || 'Map',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <Map size={22} color={focused ? '#FFF' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    href: null,
                    title: t('navigation.dashboard') || 'Dashboard',
                    tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('navigation.profile') || 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
                            <User size={22} color={focused ? '#FFF' : color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerActive: {
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    }
});
