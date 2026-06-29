import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Constantes du système de cœurs ─────────────────────────────────────────
export const MAX_HEARTS = 5;
/** Temps de régénération d'UN cœur (4h, comme Duolingo). */
export const HEART_REGEN_MS = 4 * 60 * 60 * 1000;

interface UserState {
  streak: number;
  xp: number;
  hearts: number;
  /** Timestamp (ms) de la dernière perte de cœur — base de la régénération. null si plein. */
  lastHeartLossAt: number | null;
  isPremium: boolean;
  level: 'debutant' | 'alphabet' | 'lent' | 'fluent';
  objectif: 'lire' | 'hifz' | 'tafsir' | 'complet';
  /** Langue de l'interface (code ISO). */
  language: 'fr' | 'en' | 'ar';
  dailyMinutes: number;
  currentLesson: number;
  onboardingDone: boolean;

  setLevel: (v: UserState['level']) => void;
  setObjectif: (v: UserState['objectif']) => void;
  setLanguage: (v: UserState['language']) => void;
  setDailyMinutes: (v: number) => void;
  completeOnboarding: () => void;
  /** Ajoute des XP (×2 si premium). */
  addXP: (amount: number) => void;
  /** Perd 1 cœur (sans effet si premium). Renvoie le nb de cœurs restants. */
  loseHeart: () => number;
  /** Recalcule les cœurs régénérés depuis lastHeartLossAt. À appeler à l'ouverture. */
  syncHearts: () => void;
  /** ms avant le prochain cœur régénéré, ou 0 si plein / premium. */
  msUntilNextHeart: () => number;
  /** Recharge tous les cœurs (achat, pub récompensée, premium…). */
  refillHearts: () => void;
  setPremium: (v: boolean) => void;
  logout: () => void;
}

const initialState = {
  streak: 15,
  xp: 1240,
  hearts: MAX_HEARTS,
  lastHeartLossAt: null as number | null,
  isPremium: false,
  level: 'debutant' as const,
  objectif: 'hifz' as const,
  language: 'fr' as const,
  dailyMinutes: 10,
  currentLesson: 4,
  onboardingDone: false,
};

/**
 * Calcule l'état des cœurs à l'instant présent à partir de l'état persisté.
 * Pure → réutilisable par syncHearts et msUntilNextHeart.
 */
function computeHearts(hearts: number, lastLoss: number | null, isPremium: boolean) {
  if (isPremium) return { hearts: MAX_HEARTS, lastHeartLossAt: null };
  if (hearts >= MAX_HEARTS || lastLoss == null) {
    return { hearts: Math.min(hearts, MAX_HEARTS), lastHeartLossAt: hearts >= MAX_HEARTS ? null : lastLoss };
  }
  const elapsed = Date.now() - lastLoss;
  const regened = Math.floor(elapsed / HEART_REGEN_MS);
  if (regened <= 0) return { hearts, lastHeartLossAt: lastLoss };

  const newHearts = Math.min(MAX_HEARTS, hearts + regened);
  if (newHearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, lastHeartLossAt: null };
  // On a régénéré quelques cœurs mais pas tous : on avance le point de départ.
  return { hearts: newHearts, lastHeartLossAt: lastLoss + regened * HEART_REGEN_MS };
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLevel: (level) => set({ level }),
      setObjectif: (objectif) => set({ objectif }),
      setLanguage: (language) => set({ language }),
      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      completeOnboarding: () => set({ onboardingDone: true }),

      addXP: (amount) =>
        set((s) => ({ xp: s.xp + (s.isPremium ? amount * 2 : amount) })),

      loseHeart: () => {
        const s = get();
        if (s.isPremium) return s.hearts; // premium : cœurs illimités
        const hearts = Math.max(0, s.hearts - 1);
        // On démarre/maintient la régénération à partir de maintenant.
        set({ hearts, lastHeartLossAt: s.lastHeartLossAt ?? Date.now() });
        // Si on était plein avant cette perte, le compteur démarre maintenant.
        if (s.hearts === MAX_HEARTS) set({ lastHeartLossAt: Date.now() });
        return hearts;
      },

      syncHearts: () => {
        const s = get();
        const next = computeHearts(s.hearts, s.lastHeartLossAt, s.isPremium);
        if (next.hearts !== s.hearts || next.lastHeartLossAt !== s.lastHeartLossAt) {
          set(next);
        }
      },

      msUntilNextHeart: () => {
        const s = get();
        if (s.isPremium || s.hearts >= MAX_HEARTS || s.lastHeartLossAt == null) return 0;
        const elapsedInCurrent = (Date.now() - s.lastHeartLossAt) % HEART_REGEN_MS;
        return HEART_REGEN_MS - elapsedInCurrent;
      },

      refillHearts: () => set({ hearts: MAX_HEARTS, lastHeartLossAt: null }),

      setPremium: (v) =>
        set(v ? { isPremium: true, hearts: MAX_HEARTS, lastHeartLossAt: null } : { isPremium: false }),

      logout: () => set({ ...initialState }),
    }),
    {
      name: 'tarteel-user',
      storage: createJSONStorage(() => AsyncStorage),
      // Au rechargement de l'app, on recalcule immédiatement les cœurs régénérés.
      onRehydrateStorage: () => (state) => {
        state?.syncHearts();
      },
    }
  )
);
