import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
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

export function setSoundMuted(value: boolean) {
  muted = value;
}

/**
 * À appeler une fois au lancement de l'app (layout racine) : configure le mode
 * audio (lecture même en silencieux iOS). On ne garde PAS de players partagés
 * car, sur Expo Go, rejouer un player partagé via seekTo est peu fiable —
 * on crée un player frais à chaque effet (cf. playSound).
 */
export async function preloadSounds() {
  if (preloaded) return;
  preloaded = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
  } catch (e) {
    console.log('[sounds] setAudioModeAsync failed', e);
  }
}

/**
 * Joue un effet sonore. Crée un player éphémère, le lance, puis le libère à la
 * fin de la lecture. Robuste pour des effets courts répétés.
 */
export function playSound(name: SoundName) {
  if (muted) return;
  try {
    const player = createAudioPlayer(SOUND_SOURCES[name]);
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove();
        try { player.remove(); } catch {}
      }
    });
    player.play();
    console.log('[sounds] play', name);
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
