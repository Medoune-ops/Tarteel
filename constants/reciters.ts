/**
 * Récitateurs disponibles pour l'écoute du Coran (mushaf complet, 114 sourates).
 * Audio full-sourate hébergé sur mp3quran.net : `<baseUrl><NNN>.mp3`
 * (NNN = numéro de sourate sur 3 chiffres, ex. 001.mp3).
 */
export interface Reciter {
  id: string;
  nom: string;
  baseUrl: string; // se termine par "/"
}

export const RECITERS: Reciter[] = [
  { id: 'basit', nom: 'Abdul Basit', baseUrl: 'https://server7.mp3quran.net/basit/' },
  { id: 'sudais', nom: 'Cheikh Sudais', baseUrl: 'https://server11.mp3quran.net/sds/' },
  { id: 'salami', nom: 'Mansour Al Salami', baseUrl: 'https://server14.mp3quran.net/mansor/' },
  { id: 'afasy', nom: 'Mishary Alafasy', baseUrl: 'https://server8.mp3quran.net/afs/' },
];

export const DEFAULT_RECITER_ID = 'basit';

/** Récitateur par id (fallback sur le premier). */
export function reciterById(id: string): Reciter {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0]!;
}

/** URL du fichier audio complet de la sourate `numero` (1–114) pour un récitateur. */
export function surahAudioUrl(baseUrl: string, numero: number): string {
  return `${baseUrl}${String(numero).padStart(3, '0')}.mp3`;
}
