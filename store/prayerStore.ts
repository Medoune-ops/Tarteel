/**
 * Position et méthode de calcul pour les heures de prière.
 *
 * Persisté : la position ne change pas d'un lancement à l'autre, et redemander
 * le GPS à chaque ouverture serait inutile (et lent). Le calcul lui-même est
 * local (`constants/prayerTimes.ts`), donc une fois la position connue les
 * horaires s'affichent même sans réseau.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_METHOD, type MethodId, type City, type PrayerName } from '../constants/prayerTimes';

/** D'où vient la position affichée — sert à expliquer à l'utilisateur. */
export type LocationSource = 'gps' | 'city' | null;

interface PrayerState {
  latitude: number | null;
  longitude: number | null;
  /** Nom lisible ("Dakar", ou null si position GPS brute). */
  cityName: string | null;
  source: LocationSource;
  method: MethodId;
  /** Rappel sonore à l'heure de la prière (lib/prayerReminders). Désactivé par défaut. */
  remindersEnabled: boolean;
  /** Prières pour lesquelles le rappel sonne (toutes par défaut). */
  reminderPrayers: Record<PrayerName, boolean>;

  setFromGps: (latitude: number, longitude: number) => void;
  setFromCity: (city: City) => void;
  setMethod: (method: MethodId) => void;
  setRemindersEnabled: (enabled: boolean) => void;
  toggleReminderPrayer: (name: PrayerName) => void;
}

export const usePrayerStore = create<PrayerState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      cityName: null,
      source: null,
      method: DEFAULT_METHOD,
      remindersEnabled: false,
      reminderPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },

      setFromGps: (latitude, longitude) =>
        set({ latitude, longitude, cityName: null, source: 'gps' }),

      setFromCity: (city) =>
        set({
          latitude: city.latitude,
          longitude: city.longitude,
          cityName: city.nom,
          source: 'city',
        }),

      setMethod: (method) => set({ method }),

      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),

      toggleReminderPrayer: (name) =>
        set((s) => ({ reminderPrayers: { ...s.reminderPrayers, [name]: !s.reminderPrayers[name] } })),
    }),
    {
      name: 'tarteel-prayer',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
