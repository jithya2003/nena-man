/**
 * nena-man · frontend/notifications/permissions.ts
 *
 * Handles notification permission requests for daily reading reminders.
 *
 * Rules:
 *   - Call requestNotificationPermission() ONLY when the user enables reminders.
 *   - Never call on app launch.
 *   - If the user previously denied, OS will not re-prompt — detect this and
 *     return 'blocked' so the UI can tell them to enable in device Settings.
 *
 * Usage:
 *   const status = await requestNotificationPermission();
 *   if (status === 'granted') { ... }
 *   if (status === 'blocked') { showGoToSettingsMessage(); }
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'blocked';

/**
 * Requests notification permission if not already granted.
 *
 * Returns:
 *   'granted' — permission is active, safe to schedule
 *   'denied'  — user just declined the prompt this time
 *   'blocked' — user previously denied; OS won't show prompt again;
 *               UI should show "enable in device Settings" message
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  // Web: notifications not supported via expo-notifications (no-op)
  if (Platform.OS === 'web') {
    return 'blocked';
  }

  try {
    // Step 1: check current permission status without prompting
    const existing = await Notifications.getPermissionsAsync();

    if (existing.granted) {
      return 'granted';
    }

    // Step 2: if canAskAgain = false means OS will not show the prompt → blocked
    if (!existing.canAskAgain) {
      return 'blocked';
    }

    // Step 3: actually request permission (shows system dialog)
    const result = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (result.granted) {
      return 'granted';
    }

    // Check again if we can ask in the future
    return result.canAskAgain ? 'denied' : 'blocked';
  } catch (err) {
    console.warn('[Notifications] Permission request error:', err);
    return 'blocked';
  }
}
