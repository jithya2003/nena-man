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
    importance: AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0B7A44',
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

// ── Set default notification handler ─────────────────────────────────────────
// Show notification even when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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

    const { language } = useSettingsStoreBase.getState();
    const title = language === 'en' ? '📖 Time to Read!' : '📖 කියවීමේ වේලාවයි!';
    const body =
      language === 'en'
        ? 'Start your daily reading practice today and earn stars!'
        : 'අද දවසේ කියවීමේ පුහුණුව ආරම්භ කර තරු දිනා ගන්න!';

    // Schedule the daily repeating notification
    const trigger = {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    } as const;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger,
    });

    const nextDate = await Notifications.getNextTriggerDateAsync(trigger);
    const nextDateStr = nextDate ? new Date(nextDate).toLocaleString() : 'tomorrow';
    console.log(`[Scheduler] Daily reminder (ID: ${id}) scheduled for ${hour}:${minute < 10 ? '0' + minute : minute}. Next fire: ${nextDateStr}`);
  } catch (err) {
    console.warn('[Scheduler] scheduleDailyReminder error:', err);
  }
}

/**
 * Triggers a test notification after 3 seconds so the user can verify
 * immediately that sound, vibration, channel, and permissions work on device.
 */
export async function scheduleTestNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await ensureAndroidChannel();

    const { language } = useSettingsStoreBase.getState();
    const title = language === 'en' ? '🔔 Test Notification' : '🔔 පරීක්ෂණ දැනුම්දීම';
    const body =
      language === 'en'
        ? 'Nena Man reminders are working successfully on your phone! 🎉'
        : 'නෙන මං දැනුම්දීම් ඔබේ දුරකතනයේ සාර්ථකව ක්‍රියාත්මක වේ! 🎉';

    const trigger = {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 3,
      channelId: CHANNEL_ID,
    } as const;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger,
    });

    console.log('[Scheduler] Test notification scheduled in 3 seconds');
  } catch (err) {
    console.warn('[Scheduler] scheduleTestNotification error:', err);
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
