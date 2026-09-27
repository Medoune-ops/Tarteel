/**
 * Le hadith du jour — le rendez-vous quotidien, version lecture.
 *
 * Remplace l'ancien QCM : plus de question, plus de bonne ou mauvaise
 * réponse, plus de série à ne pas casser. On lit une carte, on la met de côté
 * ou on la partage, c'est tout. Le rendez-vous sans l'examen.
 *
 * TIRAGE DÉTERMINISTE. Le hadith du jour ne doit pas changer si on quitte et
 * revient dans la journée — ce serait perdre le sentiment du rendez-vous. On
 * dérive donc l'index d'un hachage de la date : le même jour donne toujours
 * le même hadith, sans rien avoir à stocker.
 *
 * Toutes les fonctions sont pures : pas d'état, pas de React, testables
 * directement.
 */
import { ALL_HADITH_TAGS } from '../constants/hadithTagsAll';

/** Référence d'un hadith : son recueil et son numéro. */
export interface DailyRef {
  collection: string;
  n: number;
}

/**
 * Hachage stable d'une chaîne (FNV-1a 32 bits).
 *
 * `Math.random()` changerait à chaque ouverture, et `Date.now() % n` sauterait
 * des valeurs selon la longueur des mois. Un hachage de la date donne une
 * suite bien répartie et parfaitement reproductible — y compris côté
 * notification, qui doit annoncer le même hadith que l'écran.
 */
export function hashDay(day: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    // Multiplication par le nombre premier FNV, en 32 bits non signés.
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Hadiths éligibles au rendez-vous quotidien.
 *
 * On ne pioche QUE parmi les hadiths étiquetés : ce sont ceux qui ont été lus
 * et dont on sait qu'ils portent une charge humaine. Piocher dans les 15 000
 * hadiths bruts servirait un jour sur deux une règle d'ablutions ou une
 * chaîne de transmission — mauvais rendez-vous.
 *
 * `collections` restreint aux recueils que l'appelant sait charger.
 */
export function dailyPool(collections: string[]): DailyRef[] {
  const refs: DailyRef[] = [];
  for (const key of Object.keys(ALL_HADITH_TAGS)) {
    const [collection, num] = key.split(':');
    if (!collections.includes(collection)) continue;
    const n = Number(num);
    if (!Number.isFinite(n)) continue;
    refs.push({ collection, n });
  }
  // Ordre stable, indépendant de celui des clés de l'objet : deux appareils
  // doivent tomber sur le même hadith le même jour.
  return refs.sort(
    (a, b) => a.collection.localeCompare(b.collection) || a.n - b.n,
  );
}

/**
 * Le hadith du jour pour une date donnée (`YYYY-MM-DD`).
 *
 * Renvoie `null` si aucun hadith n'est éligible — l'appelant affiche alors son
 * état vide plutôt que de planter.
 */
export function hadithOfDay(day: string, collections: string[]): DailyRef | null {
  const pool = dailyPool(collections);
  if (pool.length === 0) return null;
  return pool[hashDay(day) % pool.length];
}
