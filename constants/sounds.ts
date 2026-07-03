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

// Un seul player distant à la fois (récitation d'un verset / d'un mot). On le
// garde en référence pour pouvoir l'arrêter/le remplacer au clic suivant.
let remotePlayer: AudioPlayer | null = null;
// Resolver de la lecture asynchrone en cours (chaînage mot par mot) — permet à
// stopRemoteAudio() de débloquer la boucle d'auto-lecture même si on coupe au
// milieu d'un mot (remove() ne déclenche pas didJustFinish).
let remoteResolve: (() => void) | null = null;
// Vitesse de lecture appliquée aux players distants (récitation). 1 = normal.
// Modifiable via setRemotePlaybackRate() — les boutons 0.5×/0.75×/1×/1.5×.
let remoteRate = 1;

/** Applique la vitesse courante à un player fraîchement créé (correction de pitch). */
function applyRate(player: AudioPlayer) {
  if (remoteRate === 1) return;
  try { player.setPlaybackRate(remoteRate, 'high'); } catch (e) { console.log('[sounds] setPlaybackRate failed', e); }
}

/**
 * Change la vitesse de lecture des récitations (0.5–2). S'applique au player en
 * cours immédiatement et à tous les suivants (auto-lecture mot par mot).
 */
export function setRemotePlaybackRate(rate: number) {
  remoteRate = rate;
  if (remotePlayer) {
    try { remotePlayer.setPlaybackRate(rate, 'high'); } catch (e) { console.log('[sounds] setPlaybackRate failed', e); }
  }
}

/** Coupe la lecture distante en cours et résout la promesse associée. */
function clearRemote() {
  try { remotePlayer?.remove(); } catch {}
  remotePlayer = null;
  if (remoteResolve) {
    const resolve = remoteResolve;
    remoteResolve = null;
    resolve();
  }
}

/** Stoppe immédiatement la lecture distante (bouton pause / sortie d'écran). */
export function stopRemoteAudio() {
  clearRemote();
}

/**
 * Joue un audio : URL distante ou source bundlée (require()).
 * Stoppe la lecture précédente. Renvoie false si la source est absente.
 */
export function playRemoteAudio(source?: string | number | null): boolean {
  clearRemote();
  if (source == null || source === '') return false;
  const audioSource = typeof source === 'number' ? source : { uri: source };
  try {
    const player = createAudioPlayer(audioSource);
    remotePlayer = player;
    applyRate(player);
    const sub = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        sub.remove();
        if (remotePlayer === player) {
          try { player.remove(); } catch {}
          remotePlayer = null;
        }
      }
    });
    player.play();
    return true;
  } catch (e) {
    console.log('[sounds] remote play failed', source, e);
    return false;
  }
}

/**
 * Joue un audio distant et renvoie une promesse résolue à la FIN de la lecture
 * (ou immédiatement si l'URL est absente). Sert à enchaîner les mots d'un
 * verset avec un surlignage qui suit. La promesse est aussi résolue si
 * `stopRemoteAudio()` est appelé — la boucle d'auto-lecture peut donc s'arrêter
 * proprement en cours de mot.
 */
export function playRemoteAudioAsync(url?: string | null | number): Promise<void> {
  clearRemote();
  return new Promise<void>((resolve) => {
    if (url == null || url === '') { resolve(); return; }
    const audioSource = typeof url === 'number' ? url : { uri: url };
    try {
      const player = createAudioPlayer(audioSource);
      remotePlayer = player;
      applyRate(player);
      remoteResolve = resolve;
      const sub = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          sub.remove();
          if (remotePlayer === player) {
            try { player.remove(); } catch {}
            remotePlayer = null;
          }
          if (remoteResolve === resolve) {
            remoteResolve = null;
            resolve();
          }
        }
      });
      player.play();
    } catch (e) {
      console.log('[sounds] remote play async failed', url, e);
      remoteResolve = null;
      resolve();
    }
  });
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
