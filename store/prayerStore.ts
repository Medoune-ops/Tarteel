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
import { DEFAULT_METHOD, type MethodId, type City } from '../constants/prayerTimes';

/** D'où vient la position affichée — sert à expliquer à l'utilisateur. */
export type LocationSource = 'gps' | 'city' | null;

interface PrayerState {
  latitude: number | null;
  longitude: number | null;
  /** Nom lisible ("Dakar", ou null si position GPS brute). */
  cityName: string | null;
  source: LocationSource;
  method: MethodId;

  setFromGps: (latitude: number, longitude: number) => void;
  setFromCity: (city: City) => void;
  setMethod: (method: MethodId) => void;
}

export const usePrayerStore = create<PrayerState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      cityName: null,
      source: null,
      method: DEFAULT_METHOD,

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
    }),
    {
      name: 'tarteel-prayer',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
