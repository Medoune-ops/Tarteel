import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  streakReward, PODIUM_REWARD, rollDailyChest, type DailyChestReward,
} from '../constants/rewards';
import { syncWidgetData } from '../utils/widgetData';

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
  /** Objectif de série fixé par l'utilisateur (null = aucun objectif en cours). */
  streakGoal: number | null;
  /** Date (YYYY-MM-DD) du dernier coffre quotidien réclamé (null = jamais). */
  lastChestDay: string | null;
  /** Ids des podiums dont la récompense a déjà été réclamée. */
  claimedPodiums: string[];
  dailyMinutes: number;
  currentLesson: number;
  onboardingDone: boolean;

  setLevel: (v: UserState['level']) => void;
  setObjectif: (v: UserState['objectif']) => void;
  setLanguage: (v: UserState['language']) => void;
  /** Fixe (ou remplace) l'objectif de série. */
  setStreakGoal: (days: number) => void;
  /**
   * Réclame le cadeau quand l'objectif est atteint : crédite des XP bonus
   * et efface l'objectif (l'utilisateur pourra en fixer un nouveau).
   * Renvoie le nb d'XP offerts (0 si objectif non atteint / inexistant).
   */
  claimStreakReward: () => number;
  /**
   * Crédite la récompense d'un podium (1er/2e/3e d'une ligue), une seule fois.
   * Renvoie le nb d'XP offerts (0 si déjà réclamé).
   */
  claimPodiumReward: (id: string, rang: 1 | 2 | 3) => number;
  /** true si la récompense de ce podium n'a pas encore été réclamée. */
  isPodiumClaimed: (id: string) => boolean;
  /** true si le coffre quotidien n'a pas encore été réclamé aujourd'hui. */
  canClaimDailyChest: () => boolean;
  /**
   * Réclame le coffre quotidien (1×/jour). Applique la récompense (XP ou cœurs)
   * et renvoie ce qui a été gagné, ou null si déjà réclamé aujourd'hui.
   */
  claimDailyChest: () => DailyChestReward | null;
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
  /** Met à jour la série (appelé par le backend après validation d'une leçon). */
  setStreak: (streak: number) => void;
  /** Met à jour la leçon courante (appelé par le backend). */
  setCurrentLesson: (lesson: number) => void;
  /**
   * Hydrate l'état complet depuis la réponse du backend (GET /me ou POST /lesson/complete).
   * À appeler après chaque fetch réussi — remplace les valeurs locales par la source de vérité serveur.
   */
  hydrateFromBackend: (data: {
    streak: number;
    xp: number;
    hearts: number;
    isPremium: boolean;
    currentLesson: number;
    lastHeartLossAt: number | null;
  }) => void;
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
  streakGoal: 30 as number | null,
  lastChestDay: null as string | null,
  claimedPodiums: [] as string[],
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

      setStreakGoal: (days) => set({ streakGoal: days }),

      claimStreakReward: () => {
        const s = get();
        // Objectif atteint ? (objectif défini ET série >= objectif)
        if (s.streakGoal == null || s.streak < s.streakGoal) return 0;
        // Cadeau selon le barème non-linéaire (×2 si premium, via addXP).
        const reward = streakReward(s.streakGoal);
        get().addXP(reward);
        // On efface l'objectif : l'utilisateur pourra en fixer un nouveau (non forcé).
        set({ streakGoal: null });
        return s.isPremium ? reward * 2 : reward;
      },

      claimPodiumReward: (id, rang) => {
        if (get().claimedPodiums.includes(id)) return 0; // déjà réclamé
        const reward = PODIUM_REWARD[rang];
        get().addXP(reward);
        set((s) => ({ claimedPodiums: [...s.claimedPodiums, id] }));
        return get().isPremium ? reward * 2 : reward;
      },

      isPodiumClaimed: (id) => get().claimedPodiums.includes(id),

      canClaimDailyChest: () => {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        return get().lastChestDay !== today;
      },

      claimDailyChest: () => {
        const today = new Date().toISOString().slice(0, 10);
        if (get().lastChestDay === today) return null; // déjà réclamé aujourd'hui
        const reward = rollDailyChest();
        if (reward.type === 'xp') get().addXP(reward.amount);
        else set((s) => ({ hearts: Math.min(MAX_HEARTS, s.hearts + reward.amount) }));
        set({ lastChestDay: today });
        return reward;
      },

      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      completeOnboarding: () => set({ onboardingDone: true }),

      addXP: (amount) =>
        set((s) => {
          const xp = s.xp + (s.isPremium ? amount * 2 : amount);
          syncWidgetData({ streak: s.streak, xp, currentLesson: s.currentLesson });
          return { xp };
        }),

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
        syncWidgetData({ streak: s.streak, xp: s.xp, currentLesson: s.currentLesson });
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

      setStreak: (streak) => {
        const s = get();
        set({ streak });
        syncWidgetData({ streak, xp: s.xp, currentLesson: s.currentLesson });
      },

      setCurrentLesson: (currentLesson) => {
        const s = get();
        set({ currentLesson });
        syncWidgetData({ streak: s.streak, xp: s.xp, currentLesson });
      },

      hydrateFromBackend: (data) => {
        const next = computeHearts(data.hearts, data.lastHeartLossAt, data.isPremium);
        set({
          streak: data.streak,
          xp: data.xp,
          hearts: next.hearts,
          lastHeartLossAt: next.lastHeartLossAt,
          isPremium: data.isPremium,
          currentLesson: data.currentLesson,
        });
        syncWidgetData({
          streak: data.streak,
          xp: data.xp,
          currentLesson: data.currentLesson,
        });
      },

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
