/**
 * Rappels des heures de prière — notifications LOCALES, programmées sur
 * l'appareil à partir du calcul local des horaires (`constants/prayerTimes`).
 *
 * Aucun serveur : les horaires dépendent de la position et de la méthode
 * choisies sur le téléphone, et le rappel doit sonner même hors-ligne.
 *
 * Contraintes plateformes :
 *   - iOS garde au plus 64 notifications locales en attente. On programme
 *     DAYS_AHEAD jours (5 × 7 = 35) et on complète la fenêtre à chaque
 *     ouverture de l'app (usePrayerRemindersSync). Sans ouverture pendant
 *     7 jours, les rappels s'arrêtent : c'est la limite du local.
 *   - iOS refuse un son de notification de plus de 30 s (il joue alors le son
 *     par défaut) et n'accepte pas le .m4a : prayer_reminder.wav fait 29,4 s.
 *   - Android fige le son d'un canal à sa création : changer de son impose un
 *     NOUVEL identifiant de canal (d'où le suffixe -v1).
 *   - Un son personnalisé exige un build natif (dev build / store) : Expo Go
 *     joue le son par défaut.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { computePrayerTimes, type MethodId, type PrayerName } from '../constants/prayerTimes';
import { t } from './i18n';

/** Nom du fichier embarqué via le plugin expo-notifications (app.json). */
export const PRAYER_SOUND = 'prayer_reminder.wav';
const CHANNEL_ID = 'prayer-reminder-v1';
const ID_PREFIX = 'prayer-';
const DAYS_AHEAD = 7;

export interface ReminderConfig {
  enabled: boolean;
  latitude: number | null;
  longitude: number | null;
  method: MethodId;
  prayers: Record<PrayerName, boolean>;
}

/** Demande la permission de notifier. true si accordée. */
export async function requestReminderPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: t('prayer.reminder.channelName'),
    importance: Notifications.AndroidImportance.HIGH,
    sound: PRAYER_SOUND,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function cancelAll(): Promise<void> {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

async function reschedule(cfg: ReminderConfig, now: Date): Promise<void> {
  // Toujours repartir de zéro : position, méthode ou langue ont pu changer.
  await cancelAll();
  if (!cfg.enabled || cfg.latitude == null || cfg.longitude == null) return;
  if (!Object.values(cfg.prayers).some(Boolean)) return;

  // Pas de demande de permission ici (ce code tourne au démarrage) : elle est
  // demandée quand l'utilisateur active les rappels.
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await ensureAndroidChannel();

  for (let d = 0; d < DAYS_AHEAD; d++) {
    // Pas de +24 h : setDate avance d'un jour CALENDAIRE (sûr aux changements d'heure).
    const day = new Date(now);
    day.setDate(now.getDate() + d);
    for (const slot of computePrayerTimes(cfg.latitude, cfg.longitude, cfg.method, day)) {
      if (!cfg.prayers[slot.name] || slot.time.getTime() <= now.getTime()) continue;
      const name = t(`prayer.name.${slot.name}`);
      await Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${slot.name}-${slot.time.getTime()}`,
        content: {
          title: t('prayer.reminder.title', { name }),
          body: t('prayer.reminder.body', { name }),
          sound: PRAYER_SOUND,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: slot.time,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

// Les reprogrammations sont mises en file : deux appels rapprochés (réglage
// modifié pendant une reprogrammation) ne doivent pas s'entrelacer et laisser
// des doublons.
let queue: Promise<void> = Promise.resolve();

/**
 * Remplace tous les rappels de prière programmés par ceux de `cfg`
 * (annule seulement si désactivé). Best-effort : n'échoue jamais.
 */
export function syncPrayerReminders(cfg: ReminderConfig, now: Date = new Date()): Promise<void> {
  queue = queue
    .then(() => reschedule(cfg, now))
    .catch((e) => console.warn('[prayer] programmation des rappels échouée:', e));
  return queue;
}
