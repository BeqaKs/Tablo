import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const notificationService = {
    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.warn('Failed to get push token for push notification!');
                return;
            }
            const projectId =
                Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

            try {
                const pushtokenString = (
                    await Notifications.getExpoPushTokenAsync({
                        projectId,
                    })
                ).data;
                return pushtokenString;
            } catch (e) {
                console.warn(`Error getting push token:`, e);
            }
        } else {
            console.warn('Must use physical device for Push Notifications');
        }
        return undefined;
    },

    async updatePushToken(userId: string, token: string) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', userId);

            if (error) throw error;
            console.log('Push token saved to profile');
        } catch (e) {
            console.error('Failed to update push token in supabase:', e);
        }
    }
};
