/**
 * Configuration et helpers du lecteur audio du Coran (react-native-track-player).
 * Gère la lecture en arrière-plan, la file d'attente (sourate suivante auto) et
 * les contrôles de l'écran verrouillé (service enregistré dans index.js).
 * ⚠️ Nécessite un development build — indisponible dans Expo Go.
 */
import TrackPlayer, {
  Capability, AppKilledPlaybackBehavior, RepeatMode, type Track,
} from 'react-native-track-player';
import { surahAudioUrl, DEFAULT_RECITER_ID, type Reciter } from './reciters';

export interface SourateLite { numero: number; nom: string; nomArabe: string }

let isSetup = false;
let currentReciterId = DEFAULT_RECITER_ID;

/** Id du récitateur de la file en cours (pour l'écran lecteur). */
export function getCurrentReciterId(): string {
  return currentReciterId;
}

/** Initialise le lecteur (idempotent) + contrôles écran verrouillé. */
export async function setupTrackPlayer(): Promise<void> {
  if (isSetup) return;
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
export function buildQueue(sourates: SourateLite[], reciter: Reciter): Track[] {
  return sourates.map((s) => ({
    id: String(s.numero),
    url: surahAudioUrl(reciter.baseUrl, s.numero),
    title: `${s.numero}. ${s.nom}`,
    artist: reciter.nom,
    album: 'Coran',
  }));
}

// File en cours (mémorisée pour pouvoir changer de récitateur sans perdre la
// position, RNTP étant un lecteur global).
let currentSourates: SourateLite[] = [];

/** Sourates de la file en cours (pour l'écran lecteur). */
export function getCurrentSourates(): SourateLite[] {
  return currentSourates;
}

/** Charge toutes les `sourates` (récitateur `reciter`) et démarre à `startIndex`. */
export async function playSurates(
  sourates: SourateLite[],
  reciter: Reciter,
  startIndex: number,
): Promise<void> {
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
  if (currentSourates.length === 0) return;
  currentReciterId = reciter.id;
  const idx = (await TrackPlayer.getActiveTrackIndex()) ?? 0;
  const { position } = await TrackPlayer.getProgress();
  await TrackPlayer.reset();
  await TrackPlayer.add(buildQueue(currentSourates, reciter));
  if (idx > 0) await TrackPlayer.skip(idx);
  if (position > 0) await TrackPlayer.seekTo(position);
  await TrackPlayer.play();
}

export { RepeatMode };
