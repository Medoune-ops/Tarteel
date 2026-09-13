/**
 * Hooks React du lecteur audio, branchés sur constants/audioPlayer.ts.
 *
 * Pourquoi un store maison plutôt que `useAudioPlayerStatus` d'expo-audio :
 * ce hook-là lie le lecteur au cycle de vie d'un COMPOSANT. Or notre lecteur
 * doit survivre au démontage des écrans — on quitte le lecteur plein écran, le
 * Coran continue, et le mini-lecteur le reprend ailleurs. Le lecteur vit donc
 * au niveau module (audioPlayer.ts) et les écrans s'abonnent à son état.
 *
 * `useSyncExternalStore` est l'outil prévu pour exactement ça : il garantit que
 * React ne lit jamais un état à moitié mis à jour pendant un rendu concurrent.
 *
 * Les noms exportés reprennent ceux de react-native-track-player
 * (useActiveTrack / useProgress / useIsPlaying) : les écrans n'ont pas une
 * ligne à changer.
 */
import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, type ActiveTrack } from '../constants/audioPlayer';

/** Instantané partagé — une seule souscription par composant abonné. */
function useAudioSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** La sourate en cours, ou `undefined` si rien n'est chargé. */
export function useActiveTrack(): ActiveTrack | undefined {
  return useAudioSnapshot().track;
}

/**
 * Position et durée, en secondes.
 *
 * L'argument d'intervalle est ignoré : la cadence est fixée à la création du
 * lecteur (`updateInterval`). Il est accepté pour que les appels existants
 * `useProgress(500)` restent valides sans modification.
 */
export function useProgress(_interval?: number): { position: number; duration: number; buffered: number } {
  const { position, duration } = useAudioSnapshot();
  // `buffered` n'est pas exposé par expo-audio ; aucun écran ne l'affiche, on
  // le laisse à 0 pour garder la forme attendue par l'ancien appelant.
  return { position, duration, buffered: 0 };
}

/** `playing` reste optionnel, comme chez RNTP, pour ne pas changer les écrans. */
export function useIsPlaying(): { playing?: boolean } {
  return { playing: useAudioSnapshot().playing };
}
