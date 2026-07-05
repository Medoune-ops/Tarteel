/**
 * Préférences de notifications — persistées CÔTÉ SERVEUR (elles pilotent les
 * vrais push Expo envoyés par le backend, pas juste un réglage local).
 *
 * GET   /me/notifications/preferences  → état actuel
 * PATCH /me/notifications/preferences  → mise à jour partielle
 */
import { apiFetch } from './client';

export interface NotificationPrefs {
  /** Rappel quotidien d'apprentissage (push). */
  notifDailyReminder: boolean;
  /** Alerte avant de perdre la série. */
  notifStreakAlert: boolean;
  /** Heure locale (0–23) du rappel quotidien. */
  reminderHour: number;
}

export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  return apiFetch<NotificationPrefs>('/me/notifications/preferences');
}

export async function updateNotificationPrefs(
  input: Partial<NotificationPrefs>,
): Promise<NotificationPrefs> {
  return apiFetch<NotificationPrefs>('/me/notifications/preferences', {
    method: 'PATCH',
    json: input,
  });
}
