/**
 * Chargement des recueils de hadiths, à la demande.
 *
 * Les 4 recueils pèsent ~7,7 Mo. Les importer directement les mettrait dans
 * le bundle JS, donc en mémoire à CHAQUE démarrage — y compris pour quelqu'un
 * qui ne lit jamais de hadiths. On passe donc par expo-asset : les fichiers
 * sont livrés avec l'app (donc hors-ligne) mais lus seulement à l'ouverture
 * de l'écran, puis gardés en mémoire pour la session.
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { chaptersFor, THEMES, type ThemeId } from '../constants/hadithChapters';

export interface Hadith {
  /** Numéro dans le recueil. */
  n: number;
  /** Id du chapitre. */
  s: number;
  /** Texte français. */
  t: string;
}

export interface Collection {
  id: string;
  name: string;
  chapters: { id: number; en: string }[];
  hadiths: Hadith[];
}

/**
 * Recueils disponibles, dans l'ordre d'affichage.
 *
 * Extension `.hadith` (déclarée en asset dans metro.config.js) : en `.json`,
 * Metro les inlinerait dans le bundle au lieu de les livrer en fichiers.
 */
export const COLLECTIONS = [
  { id: 'nawawi', module: require('../assets/hadiths/nawawi.hadith') },
  { id: 'qudsi', module: require('../assets/hadiths/qudsi.hadith') },
  { id: 'bukhari', module: require('../assets/hadiths/bukhari.hadith') },
  { id: 'muslim', module: require('../assets/hadiths/muslim.hadith') },
] as const;

export type CollectionId = (typeof COLLECTIONS)[number]['id'];

/** Cache mémoire : un recueil ouvert deux fois n'est lu qu'une fois. */
const cache = new Map<string, Collection>();

/** Charge un recueil depuis les assets embarqués. */
export async function loadCollection(id: CollectionId): Promise<Collection> {
  const cached = cache.get(id);
  if (cached) return cached;

  const entry = COLLECTIONS.find((c) => c.id === id);
  if (!entry) throw new Error(`recueil inconnu: ${id}`);

  const asset = Asset.fromModule(entry.module);
  await asset.downloadAsync();

  // Metro peut servir l'asset soit depuis un fichier local (build), soit
  // depuis une URL http (dev) : on gère les deux.
  const uri = asset.localUri ?? asset.uri;
  const raw = uri.startsWith('http')
    ? await (await fetch(uri)).text()
    : await FileSystem.readAsStringAsync(uri);

  const parsed = JSON.parse(raw) as Collection;
  cache.set(id, parsed);
  return parsed;
}

export interface ThemeGroup {
  theme: ThemeId;
  emoji: string;
  color: string;
  chapters: { id: number; fr: string; count: number }[];
}

/**
 * Regroupe les chapitres d'un recueil par thème, en comptant les hadiths.
 * Les thèmes vides sont écartés : un recueil court comme an-Nawawi ne doit
 * pas afficher 9 rubriques dont 8 sans contenu.
 */
export function groupByTheme(collection: Collection): ThemeGroup[] {
  const table = chaptersFor(collection.id);

  const counts = new Map<number, number>();
  for (const h of collection.hadiths) {
    counts.set(h.s, (counts.get(h.s) ?? 0) + 1);
  }

  return THEMES.map(({ id, emoji, color }) => {
    const chapters = Object.entries(table)
      .filter(([, c]) => c.theme === id)
      .map(([key, c]) => ({ id: Number(key), fr: c.fr, count: counts.get(Number(key)) ?? 0 }))
      .filter((c) => c.count > 0);
    return { theme: id, emoji, color, chapters };
  }).filter((g) => g.chapters.length > 0);
}

/** Hadiths d'un chapitre donné. */
export function hadithsOfChapter(collection: Collection, chapterId: number): Hadith[] {
  return collection.hadiths.filter((h) => h.s === chapterId);
}

/** Recherche plein texte, bornée pour rester fluide sur 7 500 hadiths. */
export function searchHadiths(collection: Collection, query: string, limit = 50): Hadith[] {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return [];
  const out: Hadith[] = [];
  for (const h of collection.hadiths) {
    if (h.t.toLowerCase().includes(q)) {
      out.push(h);
      if (out.length >= limit) break;
    }
  }
  return out;
}
