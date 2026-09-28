/**
 * Le rendez-vous quotidien du hadith : activation et heure.
 *
 * Distinct du `reminderHour` de `userStore`, qui est le rappel du parcours
 * Coran (19 h par défaut, « viens réviser »). Celui-ci est un rendez-vous de
 * LECTURE, le matin : on ouvre, on lit une carte, c'est fini. Deux intentions
 * différentes méritent deux réglages différents — quelqu'un peut vouloir son
 * hadith au réveil sans vouloir de rappel de leçon le soir.
 *
 * NOTIFICATION LOCALE, pas push. Le hadith du jour se calcule sur l'appareil
 * (voir `lib/hadithDuJour.ts`) : aucun serveur n'est nécessaire, donc aucune
 * raison de dépendre du réseau ni d'un token. Ça marche hors ligne, et sur un
 * appareil qui n'a jamais ouvert de session.
 *
 * ⚠️ Les notifications locales programmées ne fonctionnent PAS dans Expo Go
 * depuis le SDK 53 : il faut un development build. Les appels sont donc
 * enveloppés et échouent silencieusement — le réglage se garde, il
 * s'appliquera dans un vrai build.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleDaily } from '../lib/localNotifications';

/** Heure par défaut : le matin, pour ouvrir la journée sur une lecture. */
const DEFAULT_HOUR = 8;

interface HadithDailyState {
  /** Le rendez-vous est-il actif ? */
  enabled: boolean;
  /** Heure locale du rappel (0–23). */
  hour: number;
  /** Jour (YYYY-MM-DD) du dernier hadith ouvert, pour le marquer comme lu. */
  lastOpenedDay: string | null;

  setEnabled: (on: boolean) => void;
  setHour: (hour: number) => void;
  markOpened: (day: string) => void;
  /** Le hadith du jour a-t-il déjà été ouvert aujourd'hui ? */
  openedToday: (day: string) => boolean;
  reset: () => void;
}

export const useHadithDaily = create<HadithDailyState>()(
  persist(
    (set, get) => ({
      enabled: false,
      hour: DEFAULT_HOUR,
      lastOpenedDay: null,

      setEnabled: (on) => set({ enabled: on }),
      setHour: (hour) => set({ hour: Math.min(Math.max(Math.trunc(hour), 0), 23) }),
      markOpened: (day) => set({ lastOpenedDay: day }),
      openedToday: (day) => get().lastOpenedDay === day,

      reset: () => set({ enabled: false, hour: DEFAULT_HOUR, lastOpenedDay: null }),
    }),
    {
      name: 'tarteel-hadith-daily',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/**
 * (Re)programme le rappel du hadith du jour, ou l'annule.
 *
 * Simple relais vers `lib/localNotifications.ts`, qui porte la mécanique
 * commune à toutes les notifications locales de l'app — le rappel quotidien
 * du parcours passe par le même chemin.
 */
export async function scheduleDailyHadith(
  enabled: boolean,
  hour: number,
  texts: { title: string; body: string },
): Promise<void> {
  return scheduleDaily('hadith-du-jour', enabled, hour, texts);
}
