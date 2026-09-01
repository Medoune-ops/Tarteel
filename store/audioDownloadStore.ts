import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { downloadAllSudais, NoAudioAvailableError } from '../constants/audioDownload';

/** Pourquoi le téléchargement n'a pas abouti — pilote le message affiché. */
export type DownloadError =
  /** Le serveur n'a aucun fichier : réessayer n'y changerait rien. */
  | 'unavailable'
  /** Réseau coupé ou fichiers manquants : réessayer a du sens. */
  | 'failed'
  | null;

interface AudioDownloadState {
  /** Seul champ persisté : true uniquement quand les 114 fichiers Sudais ont
   *  été confirmés présents localement. Reste `false` tant qu'un téléchargement
   *  n'a pas abouti intégralement (retente au prochain lancement en ligne). */
  sudaisReady: boolean;
  downloadedCount: number;
  totalCount: number;
  isDownloading: boolean;
  lastError: DownloadError;
  startDownload: () => Promise<void>;
}

/**
 * Pré-téléchargement automatique du récitateur Sudais (mode Tajwid
 * hors-ligne) — déclenché une fois au premier lancement de l'app depuis
 * app/_layout.tsx. Voir constants/audioDownload.ts pour la logique de
 * téléchargement/vérification, constants/trackPlayer.ts pour la lecture
 * depuis les fichiers locaux.
 */
export const useAudioDownloadStore = create<AudioDownloadState>()(
  persist(
    (set, get) => ({
      sudaisReady: false,
      downloadedCount: 0,
      totalCount: 114,
      isDownloading: false,
      lastError: null,

      startDownload: async () => {
        if (get().isDownloading || get().sudaisReady) return;
        set({ isDownloading: true, lastError: null, downloadedCount: 0 });
        try {
          const ok = await downloadAllSudais((done, total) => {
            set({ downloadedCount: done, totalCount: total });
          });
          if (ok) {
            set({ sudaisReady: true, isDownloading: false });
          } else {
            set({ isDownloading: false, lastError: 'failed' });
          }
        } catch (e) {
          set({
            isDownloading: false,
            lastError: e instanceof NoAudioAvailableError ? 'unavailable' : 'failed',
          });
        }
      },
    }),
    {
      name: 'audio-download-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ sudaisReady: state.sudaisReady }),
    },
  ),
);
