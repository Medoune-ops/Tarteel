/**
 * Map des sons locaux pour les 28 lettres de l'alphabet arabe.
 * Fichiers MP3 bundlés dans assets/sounds/letters/ — aucun réseau requis.
 * (Re)générer les fichiers via : assets/sounds/letters/download.ps1
 */
const LETTER_SOUNDS: Record<string, number> = {
  alif:  require('../assets/sounds/letters/alif.mp3'),
  ba:    require('../assets/sounds/letters/ba.mp3'),
  ta:    require('../assets/sounds/letters/ta.mp3'),
  tha:   require('../assets/sounds/letters/tha.mp3'),
  jeem:  require('../assets/sounds/letters/jeem.mp3'),
  ha:    require('../assets/sounds/letters/ha.mp3'),
  kha:   require('../assets/sounds/letters/kha.mp3'),
  dal:   require('../assets/sounds/letters/dal.mp3'),
  dhal:  require('../assets/sounds/letters/dhal.mp3'),
  ra:    require('../assets/sounds/letters/ra.mp3'),
  zay:   require('../assets/sounds/letters/zay.mp3'),
  sin:   require('../assets/sounds/letters/sin.mp3'),
  shin:  require('../assets/sounds/letters/shin.mp3'),
  sad:   require('../assets/sounds/letters/sad.mp3'),
  dad:   require('../assets/sounds/letters/dad.mp3'),
  ta2:   require('../assets/sounds/letters/ta2.mp3'),
  dha2:  require('../assets/sounds/letters/dha2.mp3'),
  ayn:   require('../assets/sounds/letters/ayn.mp3'),
  ghayn: require('../assets/sounds/letters/ghayn.mp3'),
  fa:    require('../assets/sounds/letters/fa.mp3'),
  qaf:   require('../assets/sounds/letters/qaf.mp3'),
  kaf:   require('../assets/sounds/letters/kaf.mp3'),
  lam:   require('../assets/sounds/letters/lam.mp3'),
  mim:   require('../assets/sounds/letters/mim.mp3'),
  nun:   require('../assets/sounds/letters/nun.mp3'),
  ha2:   require('../assets/sounds/letters/ha2.mp3'),
  waw:   require('../assets/sounds/letters/waw.mp3'),
  ya:    require('../assets/sounds/letters/ya.mp3'),
};

/** Retourne la source audio bundlée pour une clé de lettre, ou null si absente. */
export function getLetterSound(key: string | null | undefined): number | null {
  if (!key) return null;
  return LETTER_SOUNDS[key] ?? null;
}
