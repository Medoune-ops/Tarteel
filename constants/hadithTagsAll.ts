/**
 * Table d'étiquettes complète — assemblage des lots d'étiquetage.
 *
 * L'étiquetage se fait par lots, chacun dans son fichier : un lot correspond
 * à un ensemble de chapitres lus et tagués d'un bloc. Les garder séparés
 * plutôt que de tout verser dans un seul fichier a deux avantages :
 *  - on sait toujours d'où vient une étiquette, et on peut reprendre un lot
 *    sans toucher aux autres ;
 *  - les lots peuvent être produits en parallèle sans conflit.
 *
 * Périmètre actuel :
 *  - `hadithTags.ts`  — an-Nawawi + al-Qudsi (82 hadiths, 76 tagués)
 *  - `hadithTagsA.ts` — Bukhari/Muslim : cœur, comportement, invocations
 *  - `hadithTagsB.ts` — Bukhari/Muslim : famille, mariage, liens
 *  - `hadithTagsC.ts` — Bukhari/Muslim : maladie, mort, deuil
 *
 * Clé : `"<recueil>:<numéro>"`. Les numéros sont alignés entre les éditions
 * FR et EN pour an-Nawawi et al-Qudsi ; pour Bukhari et Muslim, les deux
 * éditions diffèrent légèrement en nombre (7589/7580 et 7307/7359), ce qui
 * peut décaler quelques hadiths d'une langue à l'autre. Un tag reste donc
 * fiable sur le fond, mais pas garanti au numéro près en anglais.
 */
import type { EmotionId } from './hadithEmotions';
import { HADITH_TAGS as BASE } from './hadithTags';
import { HADITH_TAGS_A } from './hadithTagsA';
import { HADITH_TAGS_B } from './hadithTagsB';
import { HADITH_TAGS_C } from './hadithTagsC';
import { COUPLE_TAGS, COUPLE_EXCLUDE } from './hadithTagsCouple';
import { PARENTS_TAGS } from './hadithTagsParents';

/**
 * Fusionne plusieurs tables en une seule.
 *
 * Si deux lots taguent le même hadith — ce qui ne devrait pas arriver, les
 * périmètres étant disjoints — les étiquettes sont réunies sans doublon
 * plutôt que l'une écrasant l'autre.
 */
function merge(...tables: Record<string, EmotionId[]>[]): Record<string, EmotionId[]> {
  const out: Record<string, EmotionId[]> = {};
  for (const table of tables) {
    for (const [key, tags] of Object.entries(table)) {
      out[key] = out[key] ? [...new Set([...out[key], ...tags])] : [...tags];
    }
  }
  return out;
}

/**
 * Toutes les étiquettes, tous lots confondus, après affinage du couple.
 *
 * Trois corrections s'appliquent après la fusion, toutes nées du même
 * constat : `famille` était un fourre-tout d'une centaine de hadiths, servis
 * dans l'ordre des numéros. « Mon couple va mal » et « mes parents
 * vieillissent » y tombaient donc sur les premiers hadiths du chapitre du
 * mariage, qui encouragent à se marier.
 *
 *  - les hadiths de `COUPLE_TAGS` reçoivent le tag `couple` ;
 *  - ceux de `PARENTS_TAGS` reçoivent le tag `parents` ;
 *  - ceux de `COUPLE_EXCLUDE` sont retirés entièrement. Ce sont des textes
 *    unilatéraux ou décrivant une violence conjugale : servis à quelqu'un
 *    dont le couple va mal, ils accusent l'un des deux au lieu d'aider.
 */
export const ALL_HADITH_TAGS: Record<string, EmotionId[]> = (() => {
  const table = merge(BASE, HADITH_TAGS_A, HADITH_TAGS_B, HADITH_TAGS_C);

  const enrichir = (keys: string[], tag: EmotionId) => {
    for (const key of keys) {
      if (!table[key]) continue; // clé inconnue : rien à enrichir
      if (!table[key].includes(tag)) table[key] = [...table[key], tag];
    }
  };

  enrichir(COUPLE_TAGS, 'couple');
  enrichir(PARENTS_TAGS, 'parents');

  for (const key of COUPLE_EXCLUDE) delete table[key];

  return table;
})();
