/**
 * Fichiers audio transcodés pour l'écoute hors-ligne (mode Tajwid, récitateur
 * Sudais uniquement — voir constants/audioDownload.ts pour le téléchargement
 * et le stockage local, backend : src/modules/audio/).
 */
import { apiFetch } from './client';
import { API_URL } from './config';

export interface SudaisManifestEntry {
  numero: number;
  sizeBytes: number;
  sha256: string;
}

export interface SudaisManifest {
  reciter: string;
  bitrateKbps: number;
  files: SudaisManifestEntry[];
}

/** GET /audio/sudais/manifest — liste des fichiers disponibles avec taille/hash. */
export async function fetchSudaisManifest(): Promise<SudaisManifest> {
  return apiFetch<SudaisManifest>('/audio/sudais/manifest');
}

/** URL absolue du fichier binaire (consommée par expo-file-system, pas apiFetch). */
export function sudaisFileUrl(numero: number): string {
  return `${API_URL}/audio/sudais/${numero}`;
}
