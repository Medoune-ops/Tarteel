/**
 * Lecteur audio du Coran (react-native-track-player).
 *
 * ⚠️ RNTP est un module natif → nécessite un development build. On le charge de
 * façon DÉFENSIVE : dans Expo Go (ou si le natif manque), le `require` lève une
 * erreur au chargement du module (`new NativeEventEmitter()`), qu'on attrape.
 * `AUDIO_AVAILABLE` vaut alors false et les écrans affichent « dev build requis »
 * au lieu de crasher toute l'app. Tous les accès à RNTP passent par ce module.
 */
import { surahAudioUrl, DEFAULT_RECITER_ID, type Reciter } from './reciters';

export interface SourateLite { numero: number; nom: string; nomArabe: string }
export interface QueueTrack { id: string; url: string; title: string; artist: string; album: string }

// Chargement défensif : le module RNTP lève au require quand le natif est absent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RNTP: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RNTP = require('react-native-track-player');
} catch {
  RNTP = null;
}

/** true seulement dans un dev build où le module natif RNTP est présent. */
export const AUDIO_AVAILABLE: boolean = RNTP != null && RNTP.default != null;

const TrackPlayer = RNTP?.default ?? null;
const Capability = RNTP?.Capability ?? {};
const AppKilledPlaybackBehavior = RNTP?.AppKilledPlaybackBehavior ?? {};
export const RepeatMode: { Off: number; Track: number; Queue: number } =
  RNTP?.RepeatMode ?? { Off: 0, Track: 1, Queue: 2 };

// ── Hooks (réels si natif présent, sinon stubs sûrs) ────────────────────────
export interface ActiveTrack { id?: string; title?: string; artist?: string }
export const useActiveTrack: () => ActiveTrack | undefined =
  RNTP?.useActiveTrack ?? (() => undefined);
export const useProgress: (interval?: number) => { position: number; duration: number; buffered: number } =
  RNTP?.useProgress ?? (() => ({ position: 0, duration: 0, buffered: 0 }));
export const useIsPlaying: () => { playing?: boolean } =
  RNTP?.useIsPlaying ?? (() => ({ playing: false }));

// ── Contrôles directs (no-op si natif absent) ───────────────────────────────
export const audioControls = {
  play: () => { TrackPlayer?.play?.(); },
  pause: () => { TrackPlayer?.pause?.(); },
  skipToNext: () => { TrackPlayer?.skipToNext?.()?.catch?.(() => {}); },
  skipToPrevious: () => { TrackPlayer?.skipToPrevious?.()?.catch?.(() => {}); },
  setRate: (r: number) => { TrackPlayer?.setRate?.(r)?.catch?.(() => {}); },
  setRepeatMode: (m: number) => { TrackPlayer?.setRepeatMode?.(m)?.catch?.(() => {}); },
  stop: () => {
    currentSourates = [];
    TrackPlayer?.reset?.()?.catch?.(() => {});
  },
};

// File en cours (mémorisée pour changer de récitateur sans perdre la position).
let currentSourates: SourateLite[] = [];
let currentReciterId = DEFAULT_RECITER_ID;
let isSetup = false;

export function getCurrentSourates(): SourateLite[] { return currentSourates; }
export function getCurrentReciterId(): string { return currentReciterId; }

/** Initialise le lecteur (idempotent) + contrôles écran verrouillé. */
export async function setupTrackPlayer(): Promise<void> {
  if (!AUDIO_AVAILABLE || isSetup) return;
  // Enregistre le service de lecture (contrôles écran verrouillé / arrière-plan)
  // À LA DEMANDE — jamais au démarrage de l'app — pour ne rien charger de natif
  // dans Expo Go. `require` dynamique : le module n'est évalué que dans un dev
  // build où RNTP est disponible.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    TrackPlayer.registerPlaybackService(() => require('../playbackService').default);
  } catch {
    // Déjà enregistré (rare) → on continue.
  }
  try {
    await TrackPlayer.setupPlayer();
  } catch {
    // Déjà initialisé → on continue.
  }
  await TrackPlayer.updateOptions({
    android: {
      appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
    },
    capabilities: [
      Capability.Play, Capability.Pause,
      Capability.SkipToNext, Capability.SkipToPrevious,
      Capability.SeekTo, Capability.Stop,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
    progressUpdateEventInterval: 1,
  });
  isSetup = true;
}

/** Construit la file d'attente (les sourates fournies) pour un récitateur. */
export function buildQueue(sourates: SourateLite[], reciter: Reciter): QueueTrack[] {
  return sourates.map((s) => ({
    id: String(s.numero),
    url: surahAudioUrl(reciter.baseUrl, s.numero),
    title: `${s.numero}. ${s.nom}`,
    artist: reciter.nom,
    album: 'Coran',
  }));
}

/** Charge toutes les `sourates` (récitateur `reciter`) et démarre à `startIndex`. */
export async function playSurates(
  sourates: SourateLite[],
  reciter: Reciter,
  startIndex: number,
): Promise<void> {
  if (!AUDIO_AVAILABLE) throw new Error('AUDIO_UNAVAILABLE');
  currentSourates = sourates;
  currentReciterId = reciter.id;
  await setupTrackPlayer();
  await TrackPlayer.reset();
  await TrackPlayer.add(buildQueue(sourates, reciter));
  if (startIndex > 0) await TrackPlayer.skip(startIndex);
  await TrackPlayer.play();
}

/** Change de récitateur en gardant la sourate courante et la position. */
export async function changeReciter(reciter: Reciter): Promise<void> {
  if (!AUDIO_AVAILABLE || currentSourates.length === 0) return;
  currentReciterId = reciter.id;
  const idx = (await TrackPlayer.getActiveTrackIndex()) ?? 0;
  const { position } = await TrackPlayer.getProgress();
  await TrackPlayer.reset();
  await TrackPlayer.add(buildQueue(currentSourates, reciter));
  if (idx > 0) await TrackPlayer.skip(idx);
  if (position > 0) await TrackPlayer.seekTo(position);
  await TrackPlayer.play();
}
