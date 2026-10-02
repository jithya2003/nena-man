/**
 * nena-man · frontend/notifications/scheduler.ts
 *
 * Schedules and cancels the daily reading reminder notification.
 *
 * Constraints:
 *   - No backend calls
 *   - No reading from sessionStore or any AI result
 *   - Notification text uses i18n key placeholders — not hardcoded strings
 *   - Android notification channel is created here (required by Expo SDK 54)
 *
 * Usage:
 *   await scheduleDailyReminder('17:00');
 *   await cancelDailyReminder();
 *   await syncReminderOnStartup();   // call once in root layout
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import { useSettingsStoreBase } from '@/store/settingsStore';

// ── Android notification channel ─────────────────────────────────────────────

const CHANNEL_ID = 'daily-reading-reminder';

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Reading Reminder',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0B7A44',
    sound: 'default',
  });
}

// ── Set default notification handler ─────────────────────────────────────────
// Show notification even when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ── Core functions ───────────────────────────────────────────────────────────

/**
 * Cancels any existing daily reminder and schedules a new one at the given time.
 *
 * @param time - "HH:mm" 24-hour format, e.g. "17:00"
 */
export async function scheduleDailyReminder(time: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    // Parse time string
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.warn('[Scheduler] Invalid time format:', time);
      return;
    }

    // Always cancel existing before scheduling new one
    await cancelDailyReminder();

    // Ensure Android channel exists
    await ensureAndroidChannel();

    // Schedule the daily repeating notification
    await Notifications.scheduleNotificationAsync({
      content: {
        // i18n key placeholders — NOT hardcoded text
        // Connect to your i18n system when localization is wired up
        title: 'notifications.dailyReminderTitle',
        body: 'notifications.dailyReminderBody',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    console.log(`[Scheduler] Daily reminder scheduled at ${hour}:${minute < 10 ? '0' + minute : minute}`);
  } catch (err) {
    console.warn('[Scheduler] scheduleDailyReminder error:', err);
  }
}

/**
 * Cancels all scheduled notifications.
 * Safe to call even if nothing is scheduled.
 */
export async function cancelDailyReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Scheduler] All scheduled notifications cancelled.');
  } catch (err) {
    console.warn('[Scheduler] cancelDailyReminder error:', err);
  }
}

/**
 * Called once on app startup (in root layout).
 *
 * Re-syncs the notification schedule from settingsStore state.
 * This covers cases where the OS cleared scheduled notifications
 * (e.g. after a device reboot on Android).
 */
export async function syncReminderOnStartup(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    // Read directly from store state — no hook needed (not inside a component)
    const { remindersEnabled, reminderTime } = useSettingsStoreBase.getState();

    if (remindersEnabled) {
      console.log('[Scheduler] Startup sync: re-scheduling reminder at', reminderTime);
      await scheduleDailyReminder(reminderTime);
    }
  } catch (err) {
    console.warn('[Scheduler] syncReminderOnStartup error:', err);
  }
}
