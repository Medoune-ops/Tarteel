import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

/**
 * Sons UI de l'app (effets ponctuels : bonne/mauvaise réponse, fin de leçon…).
 * Fichiers générés dans assets/sounds/.
 */
export const SOUND_SOURCES = {
  correct:  require('../assets/sounds/correct.wav'),
  wrong:    require('../assets/sounds/wrong.wav'),
  finish:   require('../assets/sounds/finish.wav'),
  start:    require('../assets/sounds/start.wav'),
  progress: require('../assets/sounds/progress.wav'),
} as const;

export type SoundName = keyof typeof SOUND_SOURCES;

let preloaded = false;
let muted = false;

// Cache des players préchargés — un player par son, prêt à jouer immédiatement.
const playerCache: Partial<Record<SoundName, AudioPlayer>> = {};

export function setSoundMuted(value: boolean) {
  muted = value;
}

/**
 * À appeler une fois au lancement de l'app (layout racine) : configure le mode
 * audio et crée tous les players en avance. Le premier appui est alors
 * instantané car le fichier est déjà chargé en mémoire.
 */
export async function preloadSounds() {
  if (preloaded) return;
  preloaded = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch (e) {
    console.log('[sounds] setAudioModeAsync failed', e);
  }
  // Crée un player par son et le met en cache.
  for (const name of Object.keys(SOUND_SOURCES) as SoundName[]) {
    try {
      playerCache[name] = createAudioPlayer(SOUND_SOURCES[name]);
    } catch (e) {
      console.log('[sounds] preload failed', name, e);
    }
  }
}

/**
 * Joue un effet sonore instantanément grâce au player préchargé.
 * Si le cache n'est pas prêt (rare), crée un player éphémère en fallback.
 */
export function playSound(name: SoundName) {
  if (muted) return;
  const cached = playerCache[name];
  if (cached) {
    try {
      // Remet à zéro puis joue — évite d'attendre la fin si on rappelle vite.
      cached.seekTo(0);
      cached.play();
      console.log('[sounds] play', name);
      return;
    } catch (e) {
      console.log('[sounds] cached play failed, fallback', name, e);
    }
  }
  // Fallback : player éphémère (premier lancement avant preload ou erreur cache).
  try {
    const player = createAudioPlayer(SOUND_SOURCES[name]);
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove();
        try { player.remove(); } catch {}
      }
    });
    player.play();
  } catch (e) {
    console.log('[sounds] play failed', name, e);
  }
}

/** Petit vibrement d'erreur (no-op sur web). */
export function vibrateError() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    console.log('[haptics] error failed', e);
  }
}

/** Vibrement léger de succès. */
export function vibrateSuccess() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    console.log('[haptics] success failed', e);
  }
}

/** Joue le son ET la vibration d'erreur en même temps. */
export function wrongFeedback() {
  playSound('wrong');
  vibrateError();
}

/** Joue le son ET la vibration de succès. */
export function correctFeedback() {
  playSound('correct');
  vibrateSuccess();
}
