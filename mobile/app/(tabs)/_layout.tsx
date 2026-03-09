import React from 'react';
import { Platform, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Calendar, User, LayoutDashboard, Map, Users } from 'lucide-react-native';
import { Colors } from '../../src/constants/Colors';
import { t } from '../../src/localization/i18n';
import { useAuth } from '../../src/context/AuthContext';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const CustomTabBarButton = ({ children, onPress }: any) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={styles.customButtonContainer}
        >
            <View style={styles.customButton}>
                {children}
            </View>
        </TouchableOpacity>
    );
};

export default function TabLayout() {
    const { profile } = useAuth();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: Platform.OS === 'ios' ? 88 : 64,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
                    paddingTop: 8,
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#FFFFFF',
                },
                tabBarBackground: () =>
                    Platform.OS === 'ios' ? (
                        <BlurView
                            tint="systemChromeMaterial"
                            intensity={100}
                            style={[StyleSheet.absoluteFillObject, { borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.05)' }]}
                        />
                    ) : undefined,
                tabBarItemStyle: {
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
                        <View style={styles.iconContainer}>
                            <Home size={24} color={focused ? Colors.primary : color} strokeWidth={focused ? 2.5 : 1.8} />
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: t('navigation.myBookings') || 'Bookings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Calendar size={24} color={focused ? Colors.primary : color} strokeWidth={focused ? 2.5 : 1.8} />
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: t('navigation.explore') || 'Map',
                    tabBarButton: (props) => <CustomTabBarButton {...props} />,
                    tabBarIcon: ({ color, focused }) => (
                        <Map size={30} color="#FFFFFF" strokeWidth={2.5} />
                    ),
                }}
            />
            <Tabs.Screen
                name="friends"
                options={{
                    title: t('navigation.friends') || 'Friends',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <Users size={24} color={focused ? Colors.primary : color} strokeWidth={focused ? 2.5 : 1.8} />
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    href: null,
                    title: t('navigation.dashboard') || 'Dashboard',
                    tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="waitlist"
                options={{
                    href: null,
                    title: t('navigation.waitlist') || 'Waitlist',
                    tabBarIcon: ({ color }) => <Users size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: t('navigation.profile') || 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={styles.iconContainer}>
                            <User size={24} color={focused ? Colors.primary : color} strokeWidth={focused ? 2.5 : 1.8} />
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.primary,
        marginTop: 4,
    },
    customButtonContainer: {
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    customButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
});
