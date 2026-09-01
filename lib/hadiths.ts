/**
 * Chargement des recueils de hadiths, à la demande.
 *
 * Les 4 recueils, en français et en anglais, pèsent ~15 Mo. Les importer
 * directement les mettrait dans le bundle JS, donc en mémoire à CHAQUE
 * démarrage — y compris pour quelqu'un qui ne lit jamais de hadiths. On passe
 * donc par expo-asset : les fichiers sont livrés avec l'app (donc hors-ligne)
 * mais lus seulement à l'ouverture de l'écran, puis gardés en mémoire.
 */
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { chaptersFor, THEMES, type ThemeId } from '../constants/hadithChapters';

export interface Hadith {
  /** Numéro dans le recueil. */
  n: number;
  /** Id du chapitre. */
  s: number;
  /** Texte du hadith, dans la langue du recueil chargé. */
  t: string;
}

export interface Collection {
  id: string;
  lang: string;
  name: string;
  chapters: { id: number; en: string }[];
  hadiths: Hadith[];
}

/** Langues dans lesquelles les recueils sont fournis. */
export type HadithLang = 'fr' | 'en';

/**
 * Recueils disponibles, dans l'ordre d'affichage, en français et en anglais.
 *
 * Extension `.hadith` (déclarée en asset dans metro.config.js) : en `.json`,
 * Metro les inlinerait dans le bundle au lieu de les livrer en fichiers.
 * Les `require` doivent être littéraux — Metro résout les assets à la
 * compilation, un chemin construit à l'exécution ne fonctionnerait pas.
 */
export const COLLECTIONS = [
  {
    id: 'nawawi',
    modules: {
      fr: require('../assets/hadiths/nawawi.fr.hadith'),
      en: require('../assets/hadiths/nawawi.en.hadith'),
    },
  },
  {
    id: 'qudsi',
    modules: {
      fr: require('../assets/hadiths/qudsi.fr.hadith'),
      en: require('../assets/hadiths/qudsi.en.hadith'),
    },
  },
  {
    id: 'bukhari',
    modules: {
      fr: require('../assets/hadiths/bukhari.fr.hadith'),
      en: require('../assets/hadiths/bukhari.en.hadith'),
    },
  },
  {
    id: 'muslim',
    modules: {
      fr: require('../assets/hadiths/muslim.fr.hadith'),
      en: require('../assets/hadiths/muslim.en.hadith'),
    },
  },
] as const;

export type CollectionId = (typeof COLLECTIONS)[number]['id'];

/** Cache mémoire : un recueil ouvert deux fois n'est lu qu'une fois. */
const cache = new Map<string, Collection>();

/**
 * Charge un recueil dans la langue demandée.
 *
 * L'arabe n'ayant pas d'édition traduite ici, un utilisateur en `ar` reçoit
 * la version française — plutôt qu'un écran vide.
 */
export async function loadCollection(id: CollectionId, lang: HadithLang = 'fr'): Promise<Collection> {
  const key = `${id}.${lang}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const entry = COLLECTIONS.find((c) => c.id === id);
  if (!entry) throw new Error(`recueil inconnu: ${id}`);

  const asset = Asset.fromModule(entry.modules[lang]);
  await asset.downloadAsync();

  // Metro peut servir l'asset soit depuis un fichier local (build), soit
  // depuis une URL http (dev) : on gère les deux.
  const uri = asset.localUri ?? asset.uri;
  const raw = uri.startsWith('http')
    ? await (await fetch(uri)).text()
    : await FileSystem.readAsStringAsync(uri);

  const parsed = JSON.parse(raw) as Collection;
  cache.set(key, parsed);
  return parsed;
}

/** Langue des hadiths à servir pour la langue d'interface de l'utilisateur. */
export function hadithLangFor(appLanguage: string): HadithLang {
  return appLanguage === 'en' ? 'en' : 'fr';
}

export interface ThemeGroup {
  theme: ThemeId;
  emoji: string;
  color: string;
  chapters: { id: number; title: string; count: number }[];
}

/**
 * Titre d'un chapitre dans la langue du recueil.
 *
 * En français on sert la traduction de `hadithChapters.ts` ; en anglais, le
 * titre d'origine livré par la source (déjà présent dans les données), ce qui
 * évite de maintenir une seconde table de 154 entrées.
 */
export function chapterTitle(collection: Collection, chapterId: number): string {
  if (collection.lang === 'en') {
    const fromData = collection.chapters.find((c) => c.id === chapterId)?.en;
    if (fromData) return fromData;
  }
  return chaptersFor(collection.id)[chapterId]?.fr ?? '';
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
      .map(([key, c]) => ({
        id: Number(key),
        title: chapterTitle(collection, Number(key)) || c.fr,
        count: counts.get(Number(key)) ?? 0,
      }))
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
