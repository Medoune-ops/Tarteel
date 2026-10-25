/**
 * « Lecture libre » : dernière position de lecture (carte « Reprendre la
 * lecture » du catalogue) + préférences d'affichage du lecteur.
 *
 * Stockage LOCAL uniquement (AsyncStorage) : aucun endpoint serveur n'existe
 * pour la position de lecture libre. TODO backend : si un
 * `GET/PUT /me/lecture-libre` apparaît, synchroniser `last` ici (objet plat,
 * directement sérialisable).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LastReading {
  numero: number;
  nom: string;
  nomArabe: string;
  /** Verset en cours (1-based). */
  verset: number;
  total: number;
}

interface LectureProgressState {
  last: LastReading | null;
  /** Afficher la traduction sous chaque verset. */
  showTranslation: boolean;
  /** Taille du texte arabe : 0 = petite, 1 = normale, 2 = grande. */
  arabicSize: 0 | 1 | 2;
  setLast: (last: LastReading) => void;
  toggleTranslation: () => void;
  cycleArabicSize: () => void;
}

export const useLectureProgressStore = create<LectureProgressState>()(
  persist(
    (set) => ({
      last: null,
      showTranslation: true,
      arabicSize: 1,
      setLast: (last) => set({ last }),
      toggleTranslation: () => set((s) => ({ showTranslation: !s.showTranslation })),
      cycleArabicSize: () => set((s) => ({ arabicSize: ((s.arabicSize + 1) % 3) as 0 | 1 | 2 })),
    }),
    {
      name: 'lecture-libre-progress',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
