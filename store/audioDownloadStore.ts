import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { downloadAllSudais } from '../constants/audioDownload';

interface AudioDownloadState {
  /** Seul champ persisté : true uniquement quand les 114 fichiers Sudais ont
   *  été confirmés présents localement. Reste `false` tant qu'un téléchargement
   *  n'a pas abouti intégralement (retente au prochain lancement en ligne). */
  sudaisReady: boolean;
  downloadedCount: number;
  totalCount: number;
  isDownloading: boolean;
  lastError: string | null;
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
            set({ isDownloading: false, lastError: 'partial download' });
          }
        } catch (e) {
          set({ isDownloading: false, lastError: e instanceof Error ? e.message : 'download failed' });
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
