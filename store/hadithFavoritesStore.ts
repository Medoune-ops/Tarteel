/**
 * Hadiths mis de côté par l'utilisateur, et série de lecture.
 *
 * ⚠️ Le « favori » ici n'a rien à voir avec les cœurs/vies du parcours Coran.
 * C'est un marque-page : aucune notion de score, de perte ou d'échec. La
 * section Hadiths est un espace de lecture, pas un jeu — mettre un hadith de
 * côté ne coûte ni ne rapporte rien, ça constitue juste une collection à soi.
 *
 * Store séparé de `hadithProgressStore` volontairement : les favoris sont peu
 * nombreux et relus souvent (page « Mes hadiths »), alors que la liste des
 * hadiths lus peut atteindre plusieurs milliers d'entrées. Les mélanger
 * ferait réécrire toute la liste de lecture à chaque ajout de favori.
 *
 * Clé d'un hadith = `${collectionId}:${n}`, même convention que
 * `hadithProgressStore` (le numéro seul n'est pas unique entre recueils).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hadithKey, today } from './hadithProgressStore';

/** Un hadith mis de côté. */
export interface Favorite {
  collectionId: string;
  n: number;
  /** Date d'ajout (YYYY-MM-DD), pour trier « Mes hadiths » du plus récent. */
  savedOn: string;
}

/** Veille de `day`, au format YYYY-MM-DD. */
function yesterdayOf(day: string): string {
  const d = new Date(`${day}T12:00:00`); // midi : à l'abri des décalages horaires
  d.setDate(d.getDate() - 1);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface HadithFavoritesState {
  /** Favoris, du plus ancien au plus récent (l'affichage inverse l'ordre). */
  favorites: Favorite[];
  /** Index de recherche rapide, reconstruit à la réhydratation. */
  favoriteSet: Set<string>;

  /**
   * Série de lecture : nombre de jours consécutifs avec au moins un hadith lu.
   *
   * Volontairement douce — pas de cœur perdu, pas d'alerte, pas de rupture
   * brutale. Si la personne saute un jour, le compteur repart simplement à 1.
   * C'est une continuité offerte, pas un devoir.
   */
  streak: number;
  /** Dernier jour où un hadith a été lu (YYYY-MM-DD). */
  lastReadDay: string | null;

  isFavorite: (collectionId: string, n: number) => boolean;
  /** Ajoute ou retire. Renvoie true si le hadith est désormais en favori. */
  toggleFavorite: (collectionId: string, n: number) => boolean;
  removeFavorite: (collectionId: string, n: number) => void;
  /** Marque la journée comme lue et met à jour la série. */
  markReadToday: () => void;
  reset: () => void;
}

export const useHadithFavorites = create<HadithFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      favoriteSet: new Set<string>(),
      streak: 0,
      lastReadDay: null,

      isFavorite: (collectionId, n) => get().favoriteSet.has(hadithKey(collectionId, n)),

      toggleFavorite: (collectionId, n) => {
        const key = hadithKey(collectionId, n);
        const s = get();
        const favoriteSet = new Set(s.favoriteSet);

        if (favoriteSet.has(key)) {
          favoriteSet.delete(key);
          set({
            favoriteSet,
            favorites: s.favorites.filter(
              (f) => !(f.collectionId === collectionId && f.n === n),
            ),
          });
          return false;
        }

        favoriteSet.add(key);
        set({
          favoriteSet,
          favorites: [...s.favorites, { collectionId, n, savedOn: today() }],
        });
        return true;
      },

      removeFavorite: (collectionId, n) => {
        const key = hadithKey(collectionId, n);
        const s = get();
        if (!s.favoriteSet.has(key)) return;
        const favoriteSet = new Set(s.favoriteSet);
        favoriteSet.delete(key);
        set({
          favoriteSet,
          favorites: s.favorites.filter(
            (f) => !(f.collectionId === collectionId && f.n === n),
          ),
        });
      },

      markReadToday: () => {
        const day = today();
        const s = get();
        if (s.lastReadDay === day) return; // déjà compté aujourd'hui

        // Lu hier : la série continue. Sinon elle repart à 1 — sans pénalité,
        // on ne retire jamais rien à personne.
        const streak = s.lastReadDay === yesterdayOf(day) ? s.streak + 1 : 1;
        set({ lastReadDay: day, streak });
      },

      reset: () =>
        set({
          favorites: [],
          favoriteSet: new Set<string>(),
          streak: 0,
          lastReadDay: null,
        }),
    }),
    {
      name: 'tarteel-hadith-favorites',
      storage: createJSONStorage(() => AsyncStorage),
      // Le Set n'est pas sérialisable : on ne persiste que le tableau.
      partialize: (s) => ({
        favorites: s.favorites,
        streak: s.streak,
        lastReadDay: s.lastReadDay,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.favoriteSet = new Set(
          state.favorites.map((f) => hadithKey(f.collectionId, f.n)),
        );
      },
    },
  ),
);
