/**
 * Progression de lecture des hadiths : hadiths lus, badges de thème, quiz du jour.
 *
 * Store séparé du `userStore` volontairement : la liste des hadiths lus peut
 * atteindre plusieurs milliers d'entrées, et on ne veut pas réécrire tout le
 * profil utilisateur dans AsyncStorage à chaque hadith parcouru.
 *
 * Clé d'un hadith = `${collectionId}:${n}` — le numéro seul n'est pas unique
 * entre recueils. Stockée en tableau (le JSON ne sait pas sérialiser un Set),
 * convertie en Set à la réhydratation pour que `isRead` reste en O(1).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeId } from '../constants/hadithChapters';

/** Identifiant stable d'un hadith, tous recueils confondus. */
export function hadithKey(collectionId: string, n: number): string {
  return `${collectionId}:${n}`;
}

/** Jour local au format YYYY-MM-DD (le quiz est quotidien, pas glissant). */
export function today(): string {
  const d = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Badge obtenu : un thème entièrement lu dans un recueil donné. */
export interface Badge {
  collectionId: string;
  theme: ThemeId;
  /** Date d'obtention (YYYY-MM-DD), pour l'afficher dans le profil. */
  earnedOn: string;
}

interface HadithProgressState {
  /** Clés des hadiths lus. Tableau persisté, Set en mémoire. */
  read: string[];
  /** Index de recherche rapide, reconstruit à la réhydratation. */
  readSet: Set<string>;
  /** Badges obtenus, du plus ancien au plus récent. */
  badges: Badge[];
  /** Jour du dernier quiz répondu — empêche de le refaire le même jour. */
  lastQuizDay: string | null;
  /** Nombre de bonnes réponses au quiz, cumulé (affiché dans le profil). */
  quizCorrect: number;
  /** Nombre de quiz répondus, cumulé. */
  quizAnswered: number;
  /** Série de quiz quotidiens réussis d'affilée. */
  quizStreak: number;

  markRead: (collectionId: string, n: number) => void;
  isRead: (collectionId: string, n: number) => boolean;
  readCountIn: (collectionId: string, numbers: number[]) => number;
  hasBadge: (collectionId: string, theme: ThemeId) => boolean;
  /** Enregistre le badge s'il n'existe pas déjà. Renvoie true si nouveau. */
  awardBadge: (collectionId: string, theme: ThemeId) => boolean;
  /** Le quiz du jour a-t-il déjà été répondu ? */
  quizDoneToday: () => boolean;
  recordQuiz: (correct: boolean) => void;
  reset: () => void;
}

export const useHadithProgress = create<HadithProgressState>()(
  persist(
    (set, get) => ({
      read: [],
      readSet: new Set<string>(),
      badges: [],
      lastQuizDay: null,
      quizCorrect: 0,
      quizAnswered: 0,
      quizStreak: 0,

      markRead: (collectionId, n) => {
        const key = hadithKey(collectionId, n);
        const s = get();
        if (s.readSet.has(key)) return; // déjà lu : pas de réécriture inutile
        const readSet = new Set(s.readSet);
        readSet.add(key);
        set({ readSet, read: [...s.read, key] });
      },

      isRead: (collectionId, n) => get().readSet.has(hadithKey(collectionId, n)),

      readCountIn: (collectionId, numbers) => {
        const { readSet } = get();
        let count = 0;
        for (const n of numbers) if (readSet.has(hadithKey(collectionId, n))) count++;
        return count;
      },

      hasBadge: (collectionId, theme) =>
        get().badges.some((b) => b.collectionId === collectionId && b.theme === theme),

      awardBadge: (collectionId, theme) => {
        if (get().hasBadge(collectionId, theme)) return false;
        set((s) => ({ badges: [...s.badges, { collectionId, theme, earnedOn: today() }] }));
        return true;
      },

      quizDoneToday: () => get().lastQuizDay === today(),

      recordQuiz: (correct) => {
        const day = today();
        if (get().lastQuizDay === day) return; // un seul quiz par jour
        set((s) => ({
          lastQuizDay: day,
          quizAnswered: s.quizAnswered + 1,
          quizCorrect: s.quizCorrect + (correct ? 1 : 0),
          // Une mauvaise réponse casse la série ; une bonne la prolonge.
          quizStreak: correct ? s.quizStreak + 1 : 0,
        }));
      },

      reset: () =>
        set({
          read: [], readSet: new Set<string>(), badges: [],
          lastQuizDay: null, quizCorrect: 0, quizAnswered: 0, quizStreak: 0,
        }),
    }),
    {
      name: 'tarteel-hadith-progress',
      storage: createJSONStorage(() => AsyncStorage),
      // Le Set n'est pas sérialisable : on ne persiste que le tableau.
      partialize: (s) => ({
        read: s.read,
        badges: s.badges,
        lastQuizDay: s.lastQuizDay,
        quizCorrect: s.quizCorrect,
        quizAnswered: s.quizAnswered,
        quizStreak: s.quizStreak,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.readSet = new Set(state.read);
      },
    },
  ),
);
