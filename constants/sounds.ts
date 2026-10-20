import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

/**
 * Sons UI de l'app (effets ponctuels : bonne/mauvaise réponse, fin de leçon…).
 * Fichiers générés dans assets/sounds/.
 */
export const SOUND_SOURCES = {
  correct:  require('../assets/sounds/correct_answer.wav'),
  wrong:    require('../assets/sounds/wrong_answer.wav'),
  finish:   require('../assets/sounds/lesson_complete.wav'),
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
  // pause() AVANT remove() : sur iOS/Android, remove() seul peut laisser le
  // buffer déjà en lecture continuer quelques centaines de ms (son audible
  // après l'appui sur pause) — pause() coupe le son immédiatement.
  try { remotePlayer?.pause(); } catch {}
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

/*
 * Vibration rythmée sur la fanfare de fin de leçon.
 *
 * Les instants ci-dessous ne sont pas inventés : ils viennent de l'analyse de
 * l'enveloppe de `lesson_complete.wav` (2,59 s). Chaque entrée tombe sur une
 * attaque reellement presente dans le fichier.
 *
 * On ne suit PAS chaque note. Le materiel impose son rythme : le moteur
 * haptique met ~50 ms a rendre une impulsion et doit se reposer ensuite. En
 * demander une toutes les 90 ms, comme le ferait un calage note a note, les
 * fait se chevaucher et s'annuler — on ne sent plus qu'un ronronnement. On
 * garde donc les temps FORTS, a 180 ms d'ecart minimum.
 *
 * LIMITE ASSUMEE : `expo-haptics` ne sait pas moduler une vibration en continu
 * sur l'amplitude du son (iOS ne l'expose pas), et plafonne meme `heavy` a
 * 70/255 d'amplitude sur Android. On joue donc une SUITE d'impulsions sur les
 * temps forts, ouverte par le motif de celebration natif.
 *
 * Si le fichier audio change, relancer l'analyse : ces valeurs deviendraient
 * fausses et la vibration se decalerait du son.
 */
/*
 * ESPACEMENT MINIMAL — 180 ms.
 *
 * Premiere version : une impulsion par attaque du fichier audio, soit un
 * intervalle minimal de 90 ms. On ne sentait presque rien. Le moteur haptique
 * (Taptic Engine sur iOS) met ~50 ms a rendre une impulsion et doit se
 * REPOSER avant la suivante : en-dessous de ~150 ms, les impulsions se
 * chevauchent, s'annulent, et il n'en reste qu'un ronronnement flou.
 *
 * On ne suit donc plus chaque note : on garde les temps FORTS, espaces d'au
 * moins 180 ms, en restant cale sur des attaques reelles du fichier. Mieux
 * vaut six coups nets que treize coups qui se marchent dessus.
 */
const FINISH_PULSES: { at: number; force: 'rigid' | 'medium' | 'heavy' }[] = [
  // 355 ms : ouverture par notificationAsync(Success), voir finishFeedback —
  // un motif a deux temps bien plus marque qu'une impulsion seule. Il occupe
  // ~180 ms, d'ou la pulsation suivante seulement a 575.
  { at: 575,  force: 'heavy'  },
  { at: 830,  force: 'heavy'  }, // (+255) sommet de la montee
  { at: 1085, force: 'medium' }, // (+255)
  { at: 1335, force: 'medium' }, // (+250)
  { at: 1710, force: 'rigid'  }, // (+375) ponctuation finale, seche
];

/*
 * `Rigid` plutot que `Light` : Light est faible par conception, pensee pour
 * un retour discret sous le doigt, pas pour etre senti bras tendu. Rigid est
 * la plus seche et la plus perceptible des cinq.
 */
const IMPACT_BY_FORCE = {
  rigid: Haptics.ImpactFeedbackStyle.Rigid,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

/** Minuteurs de la séquence en cours — annulables si on quitte l'écran. */
let finishTimers: ReturnType<typeof setTimeout>[] = [];

/** Coupe une séquence de vibrations en cours (démontage de l'écran). */
export function stopFinishHaptics() {
  finishTimers.forEach(clearTimeout);
  finishTimers = [];
}

/**
 * Joue la fanfare de fin ET la vibration calée sur son rythme.
 *
 * Les deux partent du même instant : le son n'étant pas différé, les
 * impulsions restent alignées sur ce qu'on entend.
 *
 * Renvoie de quoi annuler la séquence — à appeler au démontage, sinon le
 * téléphone continue de vibrer sur un écran déjà quitté.
 */
export function finishFeedback(): () => void {
  playSound('finish');

  // `muted` coupe le son : une vibration rythmée sur une musique inaudible
  // n'aurait aucun sens, on s'aligne sur le même réglage.
  if (muted) return stopFinishHaptics;

  stopFinishHaptics();

  /*
   * Ouverture sur notificationAsync(Success) plutot qu'une impulsion seule :
   * c'est le motif de celebration natif (deux temps sur ~180 ms), nettement
   * plus marque que impactAsync, dont Expo plafonne meme `heavy` a 70/255
   * d'amplitude sur Android. C'est lui qu'on sent passer.
   */
  finishTimers = [
    setTimeout(() => {
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.log('[haptics] opening failed', e);
      }
    }, 355),
    ...FINISH_PULSES.map(({ at, force }) =>
      setTimeout(() => {
        try {
          void Haptics.impactAsync(IMPACT_BY_FORCE[force]);
        } catch (e) {
          console.log('[haptics] pulse failed', e);
        }
      }, at),
    ),
  ];
  return stopFinishHaptics;
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
