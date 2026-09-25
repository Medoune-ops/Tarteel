/**
 * Programmation des rappels de prière (notifications locales).
 */
const mockScheduled: { identifier: string; content: { sound?: string }; trigger: { date: Date; channelId?: string } }[] = [];
let mockPending: { identifier: string }[] = [];
let mockPermission = 'granted';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  requestPermissionsAsync: jest.fn(async () => ({ status: mockPermission })),
  setNotificationChannelAsync: jest.fn(async () => null),
  getAllScheduledNotificationsAsync: jest.fn(async () => mockPending),
  cancelScheduledNotificationAsync: jest.fn(async (id: string) => {
    mockPending = mockPending.filter((n) => n.identifier !== id);
  }),
  scheduleNotificationAsync: jest.fn(async (req: (typeof mockScheduled)[number]) => {
    mockScheduled.push(req);
    mockPending.push({ identifier: req.identifier });
    return req.identifier;
  }),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));
jest.mock('../lib/i18n', () => ({
  t: (key: string, vars?: { name?: string }) => (vars?.name ? `${key}:${vars.name}` : key),
}));

import * as Notifications from 'expo-notifications';
import { syncPrayerReminders, PRAYER_SOUND, type ReminderConfig } from '../lib/prayerReminders';

const ALL = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
const DAKAR: ReminderConfig = {
  enabled: true, latitude: 14.6928, longitude: -17.4467, method: 'muslimWorldLeague', prayers: ALL,
};
// Selon le fuseau de la machine de test, certaines prières d'aujourd'hui sont
// déjà passées à cette heure : on vérifie des propriétés, pas un compte exact.
const NOW = new Date(2026, 8, 25, 12, 0, 0);

beforeEach(() => {
  mockScheduled.length = 0;
  mockPending = [{ identifier: 'other-app-notification' }];
  mockPermission = 'granted';
  jest.clearAllMocks();
});

describe('syncPrayerReminders', () => {
  it('programme les prochains jours, jamais dans le passé, avec le son et le canal dédiés', async () => {
    await syncPrayerReminders(DAKAR, NOW);

    // 7 jours × 5 prières, moins celles d'aujourd'hui déjà passées (0 à 5).
    expect(mockScheduled.length).toBeGreaterThanOrEqual(30);
    expect(mockScheduled.length).toBeLessThanOrEqual(35);
    for (const n of mockScheduled) {
      expect(n.trigger.date.getTime()).toBeGreaterThan(NOW.getTime());
      expect(n.content.sound).toBe(PRAYER_SOUND);
      expect(n.trigger.channelId).toBe('prayer-reminder-v1');
      expect(n.identifier.startsWith('prayer-')).toBe(true);
    }
    // Identifiants uniques (pas de doublon).
    expect(new Set(mockScheduled.map((n) => n.identifier)).size).toBe(mockScheduled.length);
  });

  it('ne programme que les prières cochées', async () => {
    await syncPrayerReminders({ ...DAKAR, prayers: { ...ALL, dhuhr: false, asr: false, isha: false } }, NOW);
    const names = new Set(mockScheduled.map((n) => n.identifier.split('-')[1]));
    expect([...names].sort()).toEqual(['fajr', 'maghrib']);
  });

  it('reprogrammer remplace les rappels sans toucher aux autres notifications', async () => {
    await syncPrayerReminders(DAKAR, NOW);
    const first = mockPending.length;
    await syncPrayerReminders(DAKAR, NOW);
    expect(mockPending.length).toBe(first); // pas de doublons
    expect(mockPending.some((n) => n.identifier === 'other-app-notification')).toBe(true);
  });

  it('désactiver annule les rappels de prière uniquement', async () => {
    await syncPrayerReminders(DAKAR, NOW);
    await syncPrayerReminders({ ...DAKAR, enabled: false }, NOW);
    expect(mockPending).toEqual([{ identifier: 'other-app-notification' }]);
  });

  it('sans permission, rien n\'est programmé', async () => {
    mockPermission = 'denied';
    await syncPrayerReminders(DAKAR, NOW);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('sans position, rien n\'est programmé', async () => {
    await syncPrayerReminders({ ...DAKAR, latitude: null, longitude: null }, NOW);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
