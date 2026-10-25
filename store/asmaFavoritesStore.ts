/**
 * Noms d'Allah mis en favori par l'utilisateur (écran « Les 99 noms »).
 *
 * Stockage LOCAL uniquement (AsyncStorage) : il n'existe pas encore d'endpoint
 * serveur pour ces favoris. TODO backend : si un `GET/PUT /me/asma-favorites`
 * apparaît, synchroniser ici (la forme — une liste de numéros 1…99 — est
 * directement sérialisable).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AsmaFavoritesState {
  /** Numéros (1…99) des noms en favori. */
  favorites: number[];
  toggle: (numero: number) => void;
}

export const useAsmaFavoritesStore = create<AsmaFavoritesState>()(
  persist(
    (set) => ({
      favorites: [],
      toggle: (numero) =>
        set((s) => ({
          favorites: s.favorites.includes(numero)
            ? s.favorites.filter((n) => n !== numero)
            : [...s.favorites, numero],
        })),
    }),
    {
      name: 'asma-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
