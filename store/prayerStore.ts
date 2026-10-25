/**
 * Position et rappels pour les heures de prière.
 *
 * Persisté : la position ne change pas d'un lancement à l'autre, et redemander
 * le GPS à chaque ouverture serait inutile (et lent). Le calcul lui-même est
 * local (`constants/prayerTimes.ts`), donc une fois la position connue les
 * horaires s'affichent même sans réseau.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type City, type PrayerName } from '../constants/prayerTimes';

/** D'où vient la position affichée — sert à expliquer à l'utilisateur. */
export type LocationSource = 'gps' | 'city' | null;

/**
 * Voix de l'adhan choisie pour les rappels.
 *
 * TODO(backend) : seul `assets/sounds/prayer_reminder.wav` est embarqué pour
 * l'instant ; les trois choix l'utilisent tous en attendant les fichiers
 * d'adhan (La Mecque, Médine, takbir court) servis par le backend / CDN, puis
 * embarqués pour la notification (iOS : ≤ 30 s, .wav/.caf).
 */
export type AdhanSound = 'makkah' | 'madina' | 'soft';
export const ADHAN_SOUNDS: AdhanSound[] = ['makkah', 'madina', 'soft'];

/** Notification discrète avant la prière, en minutes (0 = aucune). */
export type ReminderBefore = 0 | 10 | 15;
export const REMINDER_BEFORE_OPTIONS: ReminderBefore[] = [0, 10, 15];

interface PrayerState {
  latitude: number | null;
  longitude: number | null;
  /** Nom lisible ("Dakar", ou null si position GPS brute). */
  cityName: string | null;
  source: LocationSource;
  /** Rappel sonore à l'heure de la prière (lib/prayerReminders). Désactivé par défaut. */
  remindersEnabled: boolean;
  /** Prières pour lesquelles le rappel sonne (toutes par défaut). */
  reminderPrayers: Record<PrayerName, boolean>;
  adhanSound: AdhanSound;
  reminderBefore: ReminderBefore;

  setFromGps: (latitude: number, longitude: number) => void;
  setFromCity: (city: City) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  toggleReminderPrayer: (name: PrayerName) => void;
  setAdhanSound: (sound: AdhanSound) => void;
  setReminderBefore: (minutes: ReminderBefore) => void;
}

export const usePrayerStore = create<PrayerState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      cityName: null,
      source: null,
      remindersEnabled: false,
      reminderPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
      adhanSound: 'makkah',
      reminderBefore: 10,

      setFromGps: (latitude, longitude) =>
        set({ latitude, longitude, cityName: null, source: 'gps' }),

      setFromCity: (city) =>
        set({
          latitude: city.latitude,
          longitude: city.longitude,
          cityName: city.nom,
          source: 'city',
        }),

      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),

      toggleReminderPrayer: (name) =>
        set((s) => ({ reminderPrayers: { ...s.reminderPrayers, [name]: !s.reminderPrayers[name] } })),

      setAdhanSound: (adhanSound) => set({ adhanSound }),
      setReminderBefore: (reminderBefore) => set({ reminderBefore }),
    }),
    {
      // TODO(backend) : synchroniser les préférences (prières sonnées, voix,
      // délai « avant ») entre appareils, ex. `GET/PUT /me/prieres`. La position
      // reste locale (donnée sensible, et le calcul se fait sur l'appareil).
      name: 'tarteel-prayer',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
