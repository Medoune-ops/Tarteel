/**
 * Téléchargement et cache local des 114 fichiers audio Sudais (64kbps) pour
 * l'écoute hors-ligne du mode Tajwid. Consommé par store/audioDownloadStore.ts
 * (déclenchement + état) et constants/trackPlayer.ts (lecture depuis le
 * fichier local si présent).
 */
// SDK 54 : expo-file-system expose une nouvelle API orientée objet (File/
// Directory/Paths) sous l'import par défaut. On garde volontairement l'API
// "legacy" (fonctions documentDirectory/downloadAsync/getInfoAsync), stable
// et documentée, plutôt que réécrire avec la nouvelle API expérimentale.
import * as FileSystem from 'expo-file-system/legacy';
import { fetchSudaisManifest, sudaisFileUrl, type SudaisManifestEntry } from '../lib/api';

const SUDAIS_DIR = `${FileSystem.documentDirectory}audio/sudais/`;

/** Chemin local (sans `file://`) du fichier d'une sourate, téléchargé ou non. */
export function localSudaisPath(numero: number): string {
  return `${SUDAIS_DIR}${String(numero).padStart(3, '0')}.mp3`;
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SUDAIS_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(SUDAIS_DIR, { intermediates: true });
}

async function isFileValid(numero: number, expectedSize: number): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(localSudaisPath(numero));
  return info.exists && !info.isDirectory && info.size === expectedSize;
}

const CONCURRENCY = 4;
const MAX_RETRIES = 2;

async function downloadOne(entry: SudaisManifestEntry): Promise<boolean> {
  if (await isFileValid(entry.numero, entry.sizeBytes)) return true;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await FileSystem.downloadAsync(sudaisFileUrl(entry.numero), localSudaisPath(entry.numero));
      if (res.status === 200 && (await isFileValid(entry.numero, entry.sizeBytes))) return true;
    } catch {
      // retry
    }
  }
  return false;
}

/**
 * Télécharge les fichiers manquants par lots de CONCURRENCY, avec retry.
 * Renvoie `true` seulement si les 114 fichiers sont confirmés présents à la fin.
 */
/** Le serveur ne propose aucun fichier : script de transcodage pas encore lancé. */
export class NoAudioAvailableError extends Error {
  constructor() {
    super('no audio available on server');
    this.name = 'NoAudioAvailableError';
  }
}

export async function downloadAllSudais(
  onProgress: (done: number, total: number) => void,
): Promise<boolean> {
  await ensureDir();
  const manifest = await fetchSudaisManifest();
  const files = manifest.files;
  // Distingué d'un échec de téléchargement : ici il n'y a rien à télécharger,
  // le problème est côté serveur et réessayer n'y changerait rien. L'écran
  // doit le dire, au lieu d'afficher une erreur qui accuse la connexion.
  if (files.length === 0) throw new NoAudioAvailableError();

  let done = 0;
  let allOk = true;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(downloadOne));
    results.forEach((ok) => { if (!ok) allOk = false; });
    done += batch.length;
    onProgress(Math.min(done, files.length), files.length);
  }
  return allOk;
}
