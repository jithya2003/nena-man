/**
 * nena-man · frontend/hooks/useReminderSettings.ts
 *
 * Hook for the settings screen to manage daily reading reminders.
 * Handles the full permission → schedule → store update flow.
 *
 * Usage in settings screen:
 *   const {
 *     remindersEnabled,
 *     reminderTime,
 *     permissionBlocked,
 *     toggleReminders,
 *     updateReminderTime,
 *   } = useReminderSettings();
 */

import { useState, useCallback } from 'react';
import { useSettingsStoreBase } from '@/store/settingsStore';
import { requestNotificationPermission } from '@/notifications/permissions';
import { scheduleDailyReminder, cancelDailyReminder, scheduleTestNotification } from '@/notifications/scheduler';

interface ReminderSettingsHook {
  /** Whether reminders are currently enabled. */
  remindersEnabled: boolean;
  /** Scheduled time in "HH:mm" 24-hour format. */
  reminderTime: string;
  /**
   * True if the user has previously blocked notifications in device settings.
   * When true, show a message like "Please enable notifications in device Settings."
   */
  permissionBlocked: boolean;
  /** Whether the toggle action is in progress (prevents double-tap). */
  isTogglingReminder: boolean;
  /**
   * Toggle reminders on or off.
   * - Turning ON: requests permission first. If denied/blocked, reverts toggle.
   * - Turning OFF: cancels scheduled notification and updates store.
   */
  toggleReminders: (enabled: boolean) => Promise<void>;
  /**
   * Update the reminder time.
   * If reminders are enabled, automatically reschedules the notification.
   */
  updateReminderTime: (time: string) => Promise<void>;
  /**
   * Send a test notification that arrives in 3 seconds.
   */
  sendTestNotification: () => Promise<void>;
}

export function useReminderSettings(): ReminderSettingsHook {
  const remindersEnabled = useSettingsStoreBase((s) => s.remindersEnabled);
  const reminderTime = useSettingsStoreBase((s) => s.reminderTime);
  const setRemindersEnabled = useSettingsStoreBase((s) => s.setRemindersEnabled);
  const setReminderTime = useSettingsStoreBase((s) => s.setReminderTime);

  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [isTogglingReminder, setIsTogglingReminder] = useState(false);

  /**
   * Toggle reminders ON or OFF.
   * ON flow: request permission → if granted, enable + schedule → if blocked, show message
   * OFF flow: disable in store + cancel notification
   */
  const toggleReminders = useCallback(async (enabled: boolean) => {
    if (isTogglingReminder) return;
    setIsTogglingReminder(true);

    try {
      if (enabled) {
        // Request permission first — only when turning ON
        const permissionStatus = await requestNotificationPermission();

        if (permissionStatus === 'granted') {
          // Permission granted — enable and schedule
          setPermissionBlocked(false);
          setRemindersEnabled(true);
          await scheduleDailyReminder(reminderTime);
        } else if (permissionStatus === 'blocked') {
          // Previously denied — OS won't show prompt again
          // Do NOT enable. Show "go to device Settings" message in UI.
          setPermissionBlocked(true);
          setRemindersEnabled(false); // keep disabled
        } else {
          // 'denied' — user just declined the prompt this time
          setPermissionBlocked(false);
          setRemindersEnabled(false); // keep disabled
        }
      } else {
        // Turning OFF — cancel notification and update store
        setPermissionBlocked(false);
        setRemindersEnabled(false);
        await cancelDailyReminder();
      }
    } catch (err) {
      console.warn('[useReminderSettings] toggleReminders error:', err);
    } finally {
      setIsTogglingReminder(false);
    }
  }, [isTogglingReminder, reminderTime, setRemindersEnabled]);

  /**
   * Update the scheduled time.
   * If reminders are currently enabled, reschedules immediately.
   */
  const updateReminderTime = useCallback(async (time: string) => {
    try {
      setReminderTime(time);
      if (remindersEnabled) {
        await scheduleDailyReminder(time);
      }
    } catch (err) {
      console.warn('[useReminderSettings] updateReminderTime error:', err);
    }
  }, [remindersEnabled, setReminderTime]);

  /**
   * Send a test notification in 3 seconds.
   * Also ensures permissions are requested if not already granted.
   */
  const sendTestNotification = useCallback(async () => {
    try {
      const permissionStatus = await requestNotificationPermission();
      if (permissionStatus === 'blocked') {
        setPermissionBlocked(true);
        return;
      }
      setPermissionBlocked(false);
      await scheduleTestNotification();
    } catch (err) {
      console.warn('[useReminderSettings] sendTestNotification error:', err);
    }
  }, []);

  return {
    remindersEnabled,
    reminderTime,
    permissionBlocked,
    isTogglingReminder,
    toggleReminders,
    updateReminderTime,
    sendTestNotification,
  };
}
