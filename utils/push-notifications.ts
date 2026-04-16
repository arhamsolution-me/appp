import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Check if running in Expo Go (where push notifications are not supported in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally require expo-notifications to avoid load-time side effects in Expo Go
let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.log('expo-notifications not available');
  }
}

// Basic configuration for how notifications should appear
if (Notifications) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.log('Notification handler setup skipped.');
  }
}

/**
 * Requests push notification permissions and retrieves the Expo push token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  // Skip push token registration entirely in Expo Go
  if (isExpoGo || !Notifications) {
    console.log('Push notifications are not supported in Expo Go (SDK 53+). Use a development build.');
    return undefined;
  }

  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'EduAI Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });
    } catch (e) {
      console.log('Could not set notification channel:', e);
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '00000000-0000-0000-0000-000000000000',
      })).data;
      console.log('FCM Expo Push Token:', token);
    } catch (e) {
      console.log('Warning: Could not get push token in development environment.');
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedule a local push notification
 */
export async function scheduleLocalNotification(title: string, body: string, seconds: number = 2) {
  if (isExpoGo || !Notifications) {
    console.log('Local notifications might be limited in Expo Go.');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: { seconds } as any,
    });
  } catch (e) {
    console.log('Could not schedule notification.');
  }
}

