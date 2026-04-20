import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Setup ───────────────────────────────────────────────────────
// Call this once at app startup (outside of a component) to configure
// how notifications are displayed when the app is in the foreground.
export function setupNotificationHandler() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

// ── Get Expo Push Token ─────────────────────────────────────────
// Returns the device's Expo Push Token string, or null if unavailable.
export async function getExpoPushToken() {
    if (!Device.isDevice) {
        console.log('[Push] Must use physical device for push tokens');
        return null;
    }

    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId
            ?? Constants.easConfig?.projectId;

        const { data: token } = await Notifications.getExpoPushTokenAsync({
            ...(projectId ? { projectId } : {}),
        });
        console.log('[Push] Expo Push Token:', token);
        return token;
    } catch (err) {
        console.warn('[Push] Failed to get push token:', err.message);
        return null;
    }
}

// ── Permission ──────────────────────────────────────────────────
export async function registerForPushNotifications() {
    // Notifications only work on real devices
    if (!Device.isDevice) {
        console.log('[Notifications] Must use physical device for push notifications');
        return false;
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
            name: 'Medication Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        // Prevent spamming the user on every app launch if they've permanently denied permissions
        const hasPrompted = await AsyncStorage.getItem('medimind_notification_prompted');
        if (!hasPrompted) {
            Alert.alert(
                'Notifications Disabled',
                'MediMind needs notifications to remind you about your medications. Please enable them in your device settings.',
                [{ text: 'OK' }]
            );
            await AsyncStorage.setItem('medimind_notification_prompted', 'true');
        }
        return false;
    }

    return true;
}

// ── Schedule Medication Reminders ───────────────────────────────
// Cancels all existing reminders, then schedules a new daily repeating
// notification for each medication time.
export async function scheduleMedicationReminders(medications, soundEnabled = true) {
    // Cancel everything first to avoid duplicates
    await cancelAllReminders();

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
        console.log('[Notifications] No medications to schedule');
        return;
    }

    let scheduledCount = 0;

    for (const med of medications) {
        if (!med.times || !Array.isArray(med.times)) continue;

        for (const timeStr of med.times) {
            if (!timeStr || typeof timeStr !== 'string') continue;

            const parsed = parseTimeString(timeStr.trim());
            if (!parsed) {
                console.warn(`[Notifications] Could not parse time "${timeStr}" for ${med.name}`);
                continue;
            }

            try {
                const content = {
                    title: '💊 Time for your medication',
                    body: `${med.name} ${med.dosage || ''} — ${med.instructions || 'Take as directed'}`.trim(),
                    sound: soundEnabled ? 'default' : null,
                    data: { medicationId: med.id, medicationName: med.name },
                };

                const earlyContent = {
                    title: '⏳ Upcoming Medication',
                    body: `${med.name} is due in 5 minutes`,
                    sound: soundEnabled ? 'default' : null,
                    data: { medicationId: med.id, medicationName: med.name, isPreAlert: true },
                };

                // Helper to subtract 5 minutes and handle hour rollover
                const getEarlyTime = (h, m) => {
                    let newM = m - 5;
                    let newH = h;
                    if (newM < 0) {
                        newM += 60;
                        newH -= 1;
                        if (newH < 0) newH += 24;
                    }
                    return { hour: newH, minute: newM };
                };
                const earlyTime = getEarlyTime(parsed.hour, parsed.minute);

                if (med.frequency === 'Specific dates' && Array.isArray(med.specific_dates)) {
                    // Schedule a one-time notification for each specific date
                    for (const dateStr of med.specific_dates) {
                        const [year, month, day] = dateStr.split('-');
                        const triggerDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parsed.hour, parsed.minute, 0);
                        const earlyTriggerDate = new Date(triggerDate.getTime() - 5 * 60000);

                        // Only schedule if the date/time is in the future
                        if (triggerDate > new Date()) {
                            await Notifications.scheduleNotificationAsync({
                                content,
                                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
                            });
                            scheduledCount++;
                        }
                        
                        if (earlyTriggerDate > new Date()) {
                            await Notifications.scheduleNotificationAsync({
                                content: earlyContent,
                                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: earlyTriggerDate },
                            });
                            scheduledCount++;
                        }
                    }
                } else {
                    // Schedule daily repeating for all other frequencies
                    // On-time notification
                    await Notifications.scheduleNotificationAsync({
                        content,
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DAILY,
                            hour: parsed.hour,
                            minute: parsed.minute,
                            repeats: true,
                        },
                    });
                    
                    // 5 minutes before notification
                    await Notifications.scheduleNotificationAsync({
                        content: earlyContent,
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.DAILY,
                            hour: earlyTime.hour,
                            minute: earlyTime.minute,
                            repeats: true,
                        },
                    });
                    
                    scheduledCount += 2;
                    console.log(`[Notifications] Scheduled daily ${med.name} at ${parsed.hour}:${String(parsed.minute).padStart(2, '0')} (and 5 mins prior)`);
                }
            } catch (err) {
                console.error(`[Notifications] Failed to schedule ${med.name} at ${timeStr}:`, err);
            }
        }
    }

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`[Notifications] Total scheduled: ${scheduled.length} reminders (attempted ${scheduledCount})`);
}

// ── Instant Notification ────────────────────────────────────────
// Fires an immediate push notification with sound (e.g. when patient takes meds)
export async function sendInstantNotification(title, body, soundEnabled = true) {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: soundEnabled ? 'default' : null,
            },
            trigger: null, // null = fire immediately
        });
    } catch (err) {
        console.error('[Notifications] Failed to send instant notification:', err);
    }
}

// ── Cancel All ──────────────────────────────────────────────────
export async function cancelAllReminders() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All reminders cancelled');
}

// ── Helper: Parse "7:00 AM" → { hour: 7, minute: 0 } ───────────
function parseTimeString(timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    return { hour, minute };
}
