/**
 * Lecteur audio du Coran — bâti sur `expo-audio`.
 *
 * REMPLACE react-native-track-player (constants/trackPlayer.ts).
 *
 * Pourquoi ce remplacement
 * ------------------------
 * RNTP 4.x est conçu pour l'ANCIENNE architecture React Native. Avec la New
 * Architecture (bridgeless, activée par défaut en SDK 54), son service Android
 * récupère le contexte React via `reactNativeHost.reactInstanceManager`, qui
 * rend `null` — et le `?.` faisait disparaître chaque événement EN SILENCE.
 * Constaté sur appareil (Galaxy A17, build 22) : le son sortait, la session
 * média publiait bien PLAYING/PAUSED au système, mais ZÉRO événement
 * n'atteignait le JS sur 19 000 lignes de logcat. Conséquences : mini-lecteur
 * jamais affiché, icône pause figée, barre de progression morte.
 *
 * Six correctifs successifs sur RNTP ont échoué. `expo-audio` est maintenu par
 * Expo, donc compatible New Architecture par construction, et il est DÉJÀ
 * présent dans l'app (constants/sounds.ts, lib/audio/recorder.ts) où il
 * fonctionne.
 *
 * Ce que expo-audio ne fait pas, et qu'on écrit ici
 * ------------------------------------------------
 * `expo-audio` ne connaît qu'UNE piste à la fois : aucune notion de file
 * d'attente. Tout l'enchaînement (sourate suivante, précédent/suivant, boucle,
 * fin de file) est donc géré dans ce fichier, en s'abonnant à `didJustFinish`.
 *
 * Architecture
 * ------------
 * Un SEUL `AudioPlayer` natif est créé, et on lui change sa source avec
 * `replace()` à chaque changement de sourate — plutôt que d'en créer un par
 * piste, ce qui laisserait fuir des lecteurs natifs.
 *
 * L'état est diffusé aux écrans par un petit système d'abonnement maison
 * (`subscribe`), consommé par les hooks de `hooks/useAudio.ts`. On n'utilise
 * PAS `useAudioPlayerStatus` directement dans les écrans : le lecteur doit
 * survivre au démontage des écrans (lecture en arrière-plan), il vit donc au
 * niveau module et non dans un composant.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { surahAudioUrl, DEFAULT_RECITER_ID, type Reciter } from './reciters';
import { localSudaisPath } from './audioDownload';

export interface SourateLite { numero: number; nom: string; nomArabe: string }

/** Piste telle que l'affichent le lecteur et le mini-lecteur. */
export interface ActiveTrack {
  id?: string;
  title?: string;
  artist?: string;
}

/** Modes de répétition — mêmes valeurs que RNTP, pour ne rien casser côté écrans. */
export const RepeatMode = { Off: 0, Track: 1, Queue: 2 } as const;

/**
 * `expo-audio` est un module natif, absent d'Expo Go. On le charge exactement
 * comme l'ancien wrapper le faisait pour RNTP : jamais en silence, car un échec
 * hors Expo Go est un BUG et non une limitation d'environnement.
 *
 * Ici le require ne peut pas échouer (expo-audio est une dépendance directe
 * déjà utilisée par constants/sounds.ts), mais on garde le drapeau pour que les
 * écrans conservent leur logique d'affichage inchangée.
 */
export const AUDIO_AVAILABLE = true;
export const AUDIO_UNEXPECTEDLY_MISSING = false;
export const AUDIO_LOAD_ERROR: string | null = null;

// ── État du lecteur, au niveau module ───────────────────────────────────────
//
// Volontairement hors de React : la lecture doit survivre au démontage des
// écrans (on quitte le lecteur, le son continue).

let player: AudioPlayer | null = null;
let queue: SourateLite[] = [];
let currentIndex = 0;
let currentReciter: Reciter | null = null;
let repeatMode: number = RepeatMode.Queue;
let playbackRate = 1;
let isAudioModeSet = false;

/** Dernier état connu, servi immédiatement à tout nouvel abonné. */
let snapshot = {
  track: undefined as ActiveTrack | undefined,
  playing: false,
  position: 0,
  duration: 0,
};

type Listener = () => void;
const listeners = new Set<Listener>();

/** S'abonner aux changements d'état (utilisé par les hooks React). */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Instantané courant — `getSnapshot` pour useSyncExternalStore. */
export function getSnapshot() {
  return snapshot;
}

function emit() {
  for (const l of listeners) l();
}

/**
 * Remplace l'instantané SI quelque chose a changé.
 *
 * L'égalité est comparée champ à champ et un nouvel objet n'est créé qu'en cas
 * de changement réel : `useSyncExternalStore` boucle à l'infini si getSnapshot
 * renvoie un objet différent à chaque appel.
 */
function setSnapshot(next: Partial<typeof snapshot>) {
  const merged = { ...snapshot, ...next };
  if (
    merged.track?.id === snapshot.track?.id
    && merged.playing === snapshot.playing
    && merged.position === snapshot.position
    && merged.duration === snapshot.duration
  ) {
    return;
  }
  snapshot = merged;
  emit();
}

// ── Construction des pistes ─────────────────────────────────────────────────

/**
 * Cache mémoire des sourates Sudais présentes en local (mode hors-ligne).
 * Rempli de façon asynchrone : la résolution d'URL reste synchrone, sans coût
 * d'E/S par sourate à chaque lecture.
 */
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

/** URL d'une sourate : fichier local si déjà téléchargé (Sudais), sinon réseau. */
function sourateUrl(sourate: SourateLite, reciter: Reciter): string {
  const useLocal = reciter.id === 'sudais' && localSudaisAvailable.has(sourate.numero);
  return useLocal
    ? `file://${localSudaisPath(sourate.numero)}`
    : surahAudioUrl(reciter.baseUrl, sourate.numero);
}

function trackOf(sourate: SourateLite, reciter: Reciter): ActiveTrack {
  return {
    id: String(sourate.numero),
    title: `${sourate.numero}. ${sourate.nom}`,
    artist: reciter.nom,
  };
}

// ── Cycle de vie du lecteur ─────────────────────────────────────────────────

/**
 * Configure le mode audio : lecture en arrière-plan et en mode silencieux.
 *
 * `shouldPlayInBackground` est ce qui permet au Coran de continuer écran
 * éteint — sans lui, Android coupe le son dès que l'app passe en fond.
 */
async function ensureAudioMode(): Promise<void> {
  if (isAudioModeSet) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
    });
    isAudioModeSet = true;
  } catch (e) {
    // Sans trace, un mode audio non appliqué se traduirait par une lecture qui
    // s'arrête à l'extinction de l'écran, sans cause visible.
    console.warn('[audio] setAudioModeAsync a échoué :', e);
  }
}

/**
 * Crée le lecteur unique et branche l'écoute d'état.
 *
 * `updateInterval: 500` correspond à la cadence de rafraîchissement de la barre
 * de progression côté écrans (l'ancien wrapper utilisait useProgress(500)).
 */
function ensurePlayer(): AudioPlayer {
  if (player) return player;

  const p = createAudioPlayer(null, { updateInterval: 500 });

  p.addListener('playbackStatusUpdate', (status) => {
    setSnapshot({
      playing: status.playing,
      position: status.currentTime ?? 0,
      duration: status.duration ?? 0,
    });

    // Fin de piste : c'est ICI qu'on remplace la file d'attente absente
    // d'expo-audio. RNTP enchaînait tout seul ; il faut le faire à la main.
    if (status.didJustFinish) {
      void handleTrackFinished();
    }
  });

  player = p;
  return p;
}

/** Enchaînement automatique en fin de sourate. */
async function handleTrackFinished(): Promise<void> {
  if (repeatMode === RepeatMode.Track) {
    // Boucle sur la même sourate.
    await loadIndex(currentIndex, true);
    return;
  }
  if (currentIndex < queue.length - 1) {
    await loadIndex(currentIndex + 1, true);
    return;
  }
  if (repeatMode === RepeatMode.Queue && queue.length > 0) {
    // Fin de file : on repart au début, comme le faisait RNTP en mode Queue.
    await loadIndex(0, true);
    return;
  }
  // Fin de file sans répétition : on s'arrête sur la dernière piste.
  setSnapshot({ playing: false });
}

/**
 * Charge la sourate d'indice `index` et démarre si `autoPlay`.
 *
 * On réutilise le MÊME lecteur natif via `replace()` : créer un lecteur par
 * sourate laisserait fuir des instances natives à chaque changement de piste.
 */
async function loadIndex(index: number, autoPlay: boolean): Promise<void> {
  if (index < 0 || index >= queue.length || !currentReciter) return;
  currentIndex = index;

  const sourate = queue[index]!;
  const p = ensurePlayer();

  p.replace({ uri: sourateUrl(sourate, currentReciter) });
  // La vitesse est portée par le lecteur, pas par la source : elle doit être
  // réappliquée après chaque replace().
  p.setPlaybackRate(playbackRate);

  const track = trackOf(sourate, currentReciter);
  setSnapshot({ track, position: 0, duration: 0 });

  // Contrôles de l'écran verrouillé et de la notification média.
  try {
    p.setActiveForLockScreen(
      true,
      { title: track.title, artist: track.artist, albumTitle: 'Coran' },
      { showSeekForward: true, showSeekBackward: true },
    );
  } catch (e) {
    console.warn('[audio] contrôles écran verrouillé indisponibles :', e);
  }

  if (autoPlay) p.play();
}

// ── API publique, alignée sur l'ancien wrapper ──────────────────────────────

export function getCurrentSourates(): SourateLite[] { return queue; }
export function getCurrentReciterId(): string { return currentReciter?.id ?? DEFAULT_RECITER_ID; }
export function getCurrentIndex(): number { return currentIndex; }

/** Charge toutes les `sourates` (récitateur `reciter`) et démarre à `startIndex`. */
export async function playSurates(
  sourates: SourateLite[],
  reciter: Reciter,
  startIndex: number,
): Promise<void> {
  await ensureAudioMode();
  queue = sourates;
  currentReciter = reciter;
  ensurePlayer();
  await loadIndex(startIndex, true);
}

/** Change de récitateur en gardant la sourate courante ET la position. */
export async function changeReciter(reciter: Reciter): Promise<void> {
  if (queue.length === 0) return;
  const position = snapshot.position;
  currentReciter = reciter;
  await loadIndex(currentIndex, true);
  // On restaure la position seulement si elle est significative : un seekTo(0)
  // inutile provoque un à-coup audible au changement de récitateur.
  if (position > 0) {
    try {
      await player?.seekTo(position);
    } catch (e) {
      console.warn('[audio] reprise de position impossible après changement de récitateur :', e);
    }
  }
}

export const audioControls = {
  play: () => { ensurePlayer().play(); },
  pause: () => { player?.pause(); },

  skipToNext: () => {
    if (currentIndex < queue.length - 1) void loadIndex(currentIndex + 1, true);
    else if (repeatMode === RepeatMode.Queue && queue.length > 0) void loadIndex(0, true);
  },

  /**
   * Revient au début de la sourate si on l'a déjà entamée, sinon passe à la
   * précédente — comportement usuel d'un lecteur audio, et celui de RNTP.
   */
  skipToPrevious: () => {
    if (snapshot.position > 3) {
      void player?.seekTo(0);
      return;
    }
    if (currentIndex > 0) void loadIndex(currentIndex - 1, true);
    else void player?.seekTo(0);
  },

  seekTo: (seconds: number) => { void player?.seekTo(seconds); },

  setRate: (rate: number) => {
    playbackRate = rate;
    player?.setPlaybackRate(rate);
  },

  setRepeatMode: (mode: number) => {
    repeatMode = mode;
    // `loop` natif ne couvre que la répétition d'UNE piste ; la répétition de
    // file est gérée par handleTrackFinished().
    if (player) player.loop = mode === RepeatMode.Track;
  },

  stop: () => {
    queue = [];
    currentIndex = 0;
    currentReciter = null;
    try {
      player?.pause();
      player?.clearLockScreenControls();
    } catch {
      // Le lecteur natif peut déjà être libéré : ne pas faire échouer l'arrêt.
    }
    setSnapshot({ track: undefined, playing: false, position: 0, duration: 0 });
  },
};
