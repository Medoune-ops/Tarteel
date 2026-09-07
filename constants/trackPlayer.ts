/**
 * Lecteur audio du Coran (react-native-track-player).
 *
 * ⚠️ RNTP est un module natif → absent d'Expo Go. On le charge de façon
 * DÉFENSIVE pour ne pas crasher toute l'app : `AUDIO_AVAILABLE` vaut alors
 * false et les écrans affichent un message au lieu de planter. Tous les accès
 * à RNTP passent par ce module.
 *
 * ⚠️ Le catch ne doit JAMAIS être silencieux. Dans Expo Go l'échec est attendu ;
 * dans un vrai build (dev, TestFlight, store) il signale un BUG — le natif est
 * censé être là. Un utilisateur a vu « nécessite un development build » sur
 * l'app Android du Play Store : le natif était bien présent mais son chargement
 * échouait, et l'erreur partait à la poubelle, rendant le diagnostic impossible.
 * On journalise donc systématiquement, et on garde la cause pour l'affichage.
 */
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { surahAudioUrl, DEFAULT_RECITER_ID, type Reciter } from './reciters';
import { localSudaisPath } from './audioDownload';

export interface SourateLite { numero: number; nom: string; nomArabe: string }
export interface QueueTrack { id: string; url: string; title: string; artist: string; album: string }

/** true dans Expo Go, où l'absence de module natif est normale et attendue. */
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Chargement défensif : le module RNTP lève au require quand le natif est absent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let RNTP: any = null;
/** Erreur de chargement du natif, conservée pour diagnostic. null si tout va bien. */
let audioLoadError: Error | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  RNTP = require('react-native-track-player');
} catch (e) {
  RNTP = null;
  audioLoadError = e instanceof Error ? e : new Error(String(e));
}

/** true seulement quand le module natif RNTP est présent et utilisable. */
export const AUDIO_AVAILABLE: boolean = RNTP != null && RNTP.default != null;

/**
 * Le natif manque alors qu'on n'est PAS dans Expo Go : c'est un bug, pas une
 * limitation d'environnement. Les écrans s'en servent pour afficher un message
 * honnête plutôt que « installe un development build », qui envoie l'utilisateur
 * sur une fausse piste quand il a déjà la vraie app.
 */
export const AUDIO_UNEXPECTEDLY_MISSING: boolean = !AUDIO_AVAILABLE && !IS_EXPO_GO;

/** Message de l'erreur de chargement, pour l'affichage de diagnostic. */
export const AUDIO_LOAD_ERROR: string | null = audioLoadError?.message ?? null;

if (!AUDIO_AVAILABLE) {
  if (IS_EXPO_GO) {
    console.warn('[audio] react-native-track-player absent (Expo Go) — écoute désactivée.');
  } else {
    // Cas anormal : on veut que ça se voie dans les logs (adb logcat, Xcode,
    // Sentry…) au lieu de se traduire par un simple écran « indisponible ».
    console.error(
      '[audio] react-native-track-player INTROUVABLE hors Expo Go — ' +
      "l'écoute est cassée alors que le module natif devrait être présent. " +
      'Cause : ' + (audioLoadError ? audioLoadError.stack ?? audioLoadError.message : 'module chargé mais export `default` absent'),
    );
  }
}

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
  } catch (e) {
    // Le cas normal est « déjà enregistré » et on continue. Mais ce catch
    // absorberait tout aussi bien une VRAIE erreur d'enregistrement, laissant
    // l'app croire que le lecteur est prêt alors que rien ne jouera. On trace.
    console.warn('[audio] registerPlaybackService a échoué (déjà enregistré ?) :', e);
  }
  try {
    await TrackPlayer.setupPlayer();
  } catch (e) {
    // Idem : « déjà initialisé » est bénin, mais une vraie panne d'init doit
    // laisser une trace, sinon la lecture échoue plus tard sans explication.
    console.warn('[audio] setupPlayer a échoué (déjà initialisé ?) :', e);
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

// Cache mémoire des sourates Sudais confirmées présentes en local (mode
// hors-ligne). Rempli de façon asynchrone par refreshLocalSudaisCache() —
// buildQueue reste synchrone (pas de coût I/O par sourate à chaque appel).
let localSudaisAvailable = new Set<number>();

/** À appeler après un téléchargement réussi et au focus de l'écran Tajwid. */
export async function refreshLocalSudaisCache(sourateNumbers: number[]): Promise<void> {
  const checks = await Promise.all(
    sourateNumbers.map(async (n) => {
      const info = await FileSystem.getInfoAsync(localSudaisPath(n));
      return info.exists ? n : null;
    }),
  );
  localSudaisAvailable = new Set(checks.filter((n): n is number => n != null));
}

/** Construit la file d'attente (les sourates fournies) pour un récitateur. */
export function buildQueue(sourates: SourateLite[], reciter: Reciter): QueueTrack[] {
  return sourates.map((s) => {
    const useLocal = reciter.id === 'sudais' && localSudaisAvailable.has(s.numero);
    const url = useLocal ? `file://${localSudaisPath(s.numero)}` : surahAudioUrl(reciter.baseUrl, s.numero);
    return {
      id: String(s.numero),
      url,
      title: `${s.numero}. ${s.nom}`,
      artist: reciter.nom,
      album: 'Coran',
    };
  });
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
