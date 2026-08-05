import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { syncWidgetData } from '../utils/widgetData';
import { clearSwrCache } from '../lib/api/swr';

// ─── Constantes du système de cœurs ─────────────────────────────────────────
export const MAX_HEARTS = 5;
/** Temps de régénération d'UN cœur (1h — aligné sur le backend). */
export const HEART_REGEN_MS = 60 * 60 * 1000;

interface UserState {
  /** Nom affiché de l'utilisateur. */
  name: string;
  /** Email du compte (lecture seule côté client). */
  email: string;
  /** URL de l'avatar (null = initiales par défaut). */
  avatar: string | null;
  /** Pseudo public (ligues) ; null pour les comptes créés avant le champ. */
  username: string | null;
  streak: number;
  xp: number;
  hearts: number;
  sourates: number;
  precision: number;
  /** Timestamp (ms) de la dernière perte de cœur — base de la régénération. null si plein. */
  lastHeartLossAt: number | null;
  /** Solde de gemmes (source de vérité : serveur, hydraté depuis /me). */
  gems: number;
  /** Gels de streak en stock (achetés 200 gemmes ; illimités avec Premium). */
  streakFreezes: number;
  /** Fin du boost double XP (timestamp ms), null si aucun boost actif. */
  doubleXpUntil: number | null;
  isPremium: boolean;
  /** Date ISO de fin du Premium effectif (personnel ou familial) ; null si pas de Premium actif. */
  premiumUntil: string | null;
  level: 'debutant' | 'alphabet' | 'lent' | 'fluent';
  objectif: 'lire' | 'hifz' | 'tafsir' | 'complet';
  /** Langue de l'interface (code ISO). */
  language: 'fr' | 'en' | 'ar';
  /** Exercices vocaux activés (Settings → Voix & enregistrements, persisté serveur). */
  voiceEnabled: boolean;
  /** Thème visuel. */
  theme: 'light' | 'dark' | 'system';
  /** Objectif de série fixé par l'utilisateur (null = aucun objectif en cours). */
  streakGoal: number | null;
  /** Heure locale préférée (0–23) pour le rappel quotidien — miroir de
   *  `reminderHour` côté backend (persistée ici pour survivre au redémarrage). */
  reminderHour: number;
  /** Date (YYYY-MM-DD) du dernier coffre quotidien réclamé (null = jamais). */
  lastChestDay: string | null;
  /** Ids des podiums dont la récompense a déjà été réclamée. */
  claimedPodiums: string[];
  dailyMinutes: number;
  currentLesson: number;
  onboardingDone: boolean;
  /** Numéros (1–114) des sourates déjà mémorisées, cochées à l'onboarding.
   *  Transmis à saveOnboarding pour personnaliser le point de départ. */
  memorizedSourates: number[];

  /** Met à jour le profil local (nom/avatar) — ex: après PATCH /me. */
  setProfile: (p: { name?: string; avatar?: string | null }) => void;
  setLevel: (v: UserState['level']) => void;
  setObjectif: (v: UserState['objectif']) => void;
  setMemorizedSourates: (v: number[]) => void;
  setLanguage: (v: UserState['language']) => void;
  setTheme: (v: UserState['theme']) => void;
  /** Change l'heure du rappel quotidien (0–23, heure locale). */
  setReminderHour: (hour: number) => void;
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
    premiumUntil?: string | null;
    currentLesson: number;
    lastHeartLossAt: number | null;
    gems?: number;
    streakFreezes?: number;
    doubleXpUntil?: number | null;
    sourates?: number;
    precision?: number;
    name?: string;
    email?: string;
    avatar?: string | null;
    username?: string | null;
    onboardingDone?: boolean;
    level?: UserState['level'];
    objectif?: UserState['objectif'];
    dailyMinutes?: number;
    voiceEnabled?: boolean;
    streakGoal?: number | null;
  }) => void;
  logout: () => void;
}

/**
 * Langue par défaut = langue du SYSTÈME (fr/en/ar supportées, sinon anglais).
 * Ne joue qu'à l'installation : dès que l'utilisateur a un état persisté
 * (ou choisit une langue dans Paramètres), c'est ce choix qui gagne.
 */
function systemLanguage(): 'fr' | 'en' | 'ar' {
  try {
    const code = getLocales()[0]?.languageCode;
    if (code === 'fr' || code === 'ar') return code;
    return 'en';
  } catch {
    return 'en';
  }
}

const initialState = {
  name: '',
  email: '',
  avatar: null as string | null,
  username: null as string | null,
  streak: 0,
  xp: 0,
  hearts: MAX_HEARTS,
  sourates: 0,
  precision: 0,
  lastHeartLossAt: null as number | null,
  gems: 0,
  streakFreezes: 0,
  doubleXpUntil: null as number | null,
  isPremium: false,
  premiumUntil: null as string | null,
  level: 'debutant' as const,
  objectif: 'hifz' as const,
  language: systemLanguage() as 'fr' | 'en' | 'ar',
  voiceEnabled: true,
  theme: 'system' as const,
  streakGoal: null as number | null,
  reminderHour: 19,
  lastChestDay: null as string | null,
  claimedPodiums: [] as string[],
  dailyMinutes: 10,
  currentLesson: 1,
  onboardingDone: false,
  memorizedSourates: [] as number[],
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

      setProfile: ({ name, avatar }) =>
        set((s) => ({
          name: name ?? s.name,
          avatar: avatar !== undefined ? avatar : s.avatar,
        })),
      setLevel: (level) => set({ level }),
      setObjectif: (objectif) => set({ objectif }),
      setMemorizedSourates: (memorizedSourates) => set({ memorizedSourates }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),

      setReminderHour: (hour) => set({ reminderHour: hour }),

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
          premiumUntil: data.premiumUntil ?? null,
          currentLesson: data.currentLesson,
          ...(data.gems          != null && { gems:          data.gems }),
          ...(data.streakFreezes != null && { streakFreezes: data.streakFreezes }),
          ...(data.doubleXpUntil !== undefined && { doubleXpUntil: data.doubleXpUntil }),
          ...(data.sourates  != null && { sourates:  data.sourates  }),
          ...(data.precision != null && { precision: data.precision }),
          ...(data.name   != null && { name:   data.name   }),
          ...(data.email  != null && { email:  data.email  }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
          ...(data.username !== undefined && { username: data.username }),
          // Onboarding/prefs : restaurés depuis le serveur pour ne PAS relancer
          // le setup à chaque reconnexion.
          ...(data.onboardingDone != null && { onboardingDone: data.onboardingDone }),
          ...(data.level        != null && { level:        data.level }),
          ...(data.objectif     != null && { objectif:     data.objectif }),
          ...(data.dailyMinutes != null && { dailyMinutes: data.dailyMinutes }),
          ...(data.voiceEnabled != null && { voiceEnabled: data.voiceEnabled }),
          ...(data.streakGoal !== undefined && { streakGoal: data.streakGoal }),
        });
        syncWidgetData({
          streak: data.streak,
          xp: data.xp,
          currentLesson: data.currentLesson,
        });
      },

      logout: () => {
        clearSwrCache(); // ne pas montrer les données d'un autre compte
        set({ ...initialState });
      },
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
