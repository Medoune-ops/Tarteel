/**
 * « Écoute du Coran » : préférences de l'écoute audio.
 *
 * - `reciterId` et `favorites` sont persistés LOCALEMENT (AsyncStorage) :
 *   aucun endpoint serveur n'existe pour eux. TODO backend : si un
 *   `GET/PUT /me/coran-ecoute` (récitateur préféré + sourates favorites)
 *   apparaît, synchroniser ces deux champs ici.
 * - `speed` et `loop` ne sont pas persistés : ils reflètent l'état du moteur
 *   audio pour la session en cours (le lecteur plein écran peut être démonté
 *   puis rouvert sans que l'affichage se désynchronise du son).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_RECITER_ID } from '../constants/reciters';

export const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

interface CoranListenState {
  reciterId: string;
  /** Numéros des sourates mises en favori (cœur du lecteur). */
  favorites: number[];
  speed: number;
  loop: boolean;
  setReciterId: (id: string) => void;
  toggleFavorite: (numero: number) => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
}

export const useCoranListenStore = create<CoranListenState>()(
  persist(
    (set) => ({
      reciterId: DEFAULT_RECITER_ID,
      favorites: [],
      speed: 1,
      loop: false,
      setReciterId: (reciterId) => set({ reciterId }),
      toggleFavorite: (numero) =>
        set((s) => ({
          favorites: s.favorites.includes(numero)
            ? s.favorites.filter((n) => n !== numero)
            : [...s.favorites, numero],
        })),
      setSpeed: (speed) => set({ speed }),
      setLoop: (loop) => set({ loop }),
    }),
    {
      name: 'coran-listen-prefs',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ reciterId: s.reciterId, favorites: s.favorites }),
    },
  ),
);
