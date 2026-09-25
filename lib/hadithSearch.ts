/**
 * Recherche de hadiths par phrase libre, entièrement hors ligne.
 *
 * L'utilisateur tape ce qu'il ressent (« j'ai pas l'esprit tranquille ») et on
 * lui rend les émotions correspondantes, puis les hadiths de ces émotions.
 * Aucune API, aucun modèle : on compare la saisie normalisée à la table de
 * formulations de `hadithEmotions.ts`.
 *
 * Trois niveaux de correspondance, du plus fiable au plus large :
 *   1. la saisie contient une formulation entière (« je stresse au travail »
 *      contient « je stresse ») ;
 *   2. une formulation contient la saisie, qui est donc partielle (« angoi »
 *      → « angoisse ») — utile pendant la frappe ;
 *   3. un mot significatif de la saisie correspond à un mot d'une formulation
 *      (« peur » dans « grosse peur ce soir »).
 *
 * Toutes les fonctions sont pures : pas d'état, pas de React, testables
 * directement.
 */
import { EMOTIONS, SYNONYMS, type EmotionId } from '../constants/hadithEmotions';
// Table agrégée : les lots d'étiquetage y sont assemblés (voir hadithTagsAll).
import { ALL_HADITH_TAGS as HADITH_TAGS } from '../constants/hadithTagsAll';

/** Langues de saisie prises en charge. */
export type SearchLang = 'fr' | 'en';

/**
 * Met une chaîne sous forme comparable : minuscules, sans accents, sans
 * ponctuation, espaces resserrés.
 *
 * Les apostrophes (droites comme typographiques) deviennent des espaces :
 * « j'ai peur » et « jai peur » se ramènent ainsi à la même forme que
 * « j ai peur », ce qui absorbe les fautes de frappe les plus fréquentes.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    // Enlève les diacritiques laissés par la décomposition NFD.
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Mots trop courants pour discriminer une émotion : les ignorer évite que
 * « je suis » ne fasse remonter la moitié des tags.
 */
const STOP_WORDS = new Set([
  'je', 'j', 'me', 'ma', 'mon', 'mes', 'moi', 'tu', 'te', 'il', 'elle', 'on',
  'nous', 'vous', 'ils', 'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de',
  'd', 'a', 'au', 'aux', 'et', 'ou', 'que', 'qui', 'quoi', 'ce', 'cet', 'cette',
  'ca', 'c', 'est', 'suis', 'sont', 'ai', 'as', 'avoir', 'etre', 'en', 'y',
  'pas', 'ne', 'n', 'plus', 'tres', 'trop', 'pour', 'par', 'dans', 'sur',
  'avec', 'sans', 'se', 's', 'l', 'quand', 'comme', 'fait', 'faire',
  'i', 'im', 'me', 'my', 'you', 'he', 'she', 'we', 'they', 'it', 'the', 'an',
  'and', 'or', 'of', 'to', 'in', 'on', 'at', 'for', 'with', 'is', 'am', 'are',
  'be', 'been', 'do', 'does', 'did', 'have', 'has', 'not', 'dont', 'cant',
  'so', 'too', 'very', 'this', 'that', 'what', 'about', 'feel', 'feeling',
]);

/** Mots significatifs d'une chaîne déjà normalisée. */
function meaningfulWords(normalized: string): string[] {
  return normalized.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

/**
 * Formulations de détresse vitale, sous forme normalisée.
 *
 * ⚠️ Ces saisies reçoivent un traitement à part, décidé volontairement.
 *
 * Le tag `mort` contient qudsi:28 — le récit d'un homme qui met fin à ses
 * jours et à qui le Paradis est interdit. Quelqu'un qui écrit « j'ai plus
 * envie de vivre » ne doit jamais recevoir ce texte : ce serait une
 * condamnation au moment le plus fragile. On l'oriente vers la miséricorde et
 * l'épreuve traversée, qui sont largement représentées dans le corpus.
 *
 * Écarter les formulations de la table de synonymes ne suffit pas : le
 * troisième niveau de correspondance (mot significatif partagé) rattraperait
 * « mourir » → « mourir » ou « die » → « dying ». D'où cette garde, appliquée
 * après le calcul des scores.
 */
const DISTRESS_PHRASES = [
  // FR
  'plus envie de vivre', 'envie de mourir', 'je veux mourir', 'veux mourir',
  'suicide', 'suicider', 'me tuer', 'en finir', 'a quoi bon', 'pourquoi vivre',
  'je sers a rien', 'je vaux rien', 'disparaitre',
  // EN
  'don t want to live', 'dont want to live', 'want to die', 'wanna die',
  'kill myself', 'end it all', 'end my life', 'what s the point',
  'whats the point', 'why live', 'i m worthless', 'worthless',
  'no reason to live', 'better off dead',
].map(normalize);

/** Tags de réconfort servis en cas de détresse vitale — jamais `mort`. */
const COMFORT_EMOTIONS: EmotionId[] = ['espoir', 'patience', 'confiance'];

/**
 * Hadiths à ne JAMAIS servir sur une recherche de détresse vitale, quels que
 * soient leurs tags.
 *
 * ⚠️ Filtrer par tag ne suffit pas. La garde ci-dessus écarte `mort` et met
 * les tags de réconfort en tête — mais si l'un de ces textes reçoit un jour
 * `espoir`, `patience` ou `confiance` (par un futur lot d'étiquetage, ou par
 * inadvertance), il remonterait en PREMIER sur « j'en peux plus ». D'où cette
 * exclusion par clé, qui s'applique après le filtrage par tag et ne dépend
 * d'aucune étiquette.
 *
 * Ces textes condamnent explicitement celui qui met fin à ses jours :
 * « je lui interdis le Paradis », « il continuera à se poignarder dans le
 * Feu », le refus de prier sur un suicidé. Les servir à quelqu'un en détresse
 * serait lui renvoyer une damnation au moment le plus fragile.
 *
 * Les autres textes durs relevés par l'étiquetage (châtiment de la tombe,
 * mort d'enfants, pleurs punis) ne sont pas ici : ils ne sont pas tagués, et
 * les écarter par clé n'aurait pas d'effet. Ils sont documentés dans
 * `SENSITIVE_C` de `constants/hadithTagsC.ts`.
 */
const NEVER_IN_DISTRESS = new Set([
  // An-Nawawi / al-Qudsi
  'qudsi:28',
  // Bukhari / Muslim — chapitres des funérailles et de la médecine
  'bukhari:5778',
  'bukhari:1363',
  'bukhari:1364',
  'bukhari:1365',
  'muslim:2262',
  // Bukhari — chapitre du bon comportement. Ces trois-là portent aujourd'hui
  // des tags sans rapport (`intention`, `parole`, `colere`), mais leur contenu
  // condamne celui qui s'ôte la vie : on les verrouille par précaution.
  'bukhari:6493',
  'bukhari:6047',
  'bukhari:6105',
]);

/** Ce hadith peut-il être servi à quelqu'un en détresse vitale ? */
export function isSafeInDistress(collectionId: string, n: number): boolean {
  return !NEVER_IN_DISTRESS.has(`${collectionId}:${n}`);
}

/**
 * La saisie exprime-t-elle une détresse vitale ?
 *
 * Exposé pour que l'interface puisse, elle aussi, réagir — afficher un numéro
 * d'écoute au-dessus des hadiths, par exemple.
 */
export function isDistressQuery(query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  return DISTRESS_PHRASES.some((p) => p && q.includes(p));
}

/**
 * Émotions correspondant à une phrase libre, les plus pertinentes d'abord.
 *
 * Renvoie un tableau vide si rien ne correspond — l'appelant affiche alors son
 * message « aucun résultat » plutôt qu'une liste au hasard. Une saisie de
 * moins de deux caractères est ignorée : à une lettre, tout correspond.
 */
export function matchEmotions(query: string, lang: SearchLang): EmotionId[] {
  const q = normalize(query);
  if (q.length < 2) return [];

  const queryWords = meaningfulWords(q);
  const scores = new Map<EmotionId, number>();

  const bump = (id: EmotionId, points: number): void => {
    const current = scores.get(id) ?? 0;
    if (points > current) scores.set(id, points);
  };

  for (const { id } of EMOTIONS) {
    for (const raw of SYNONYMS[id][lang]) {
      const syn = normalize(raw);
      if (!syn) continue;

      // 1. La saisie contient la formulation : le signal le plus sûr. On
      //    favorise les formulations longues, plus spécifiques (« crise
      //    d angoisse » l'emporte sur « angoisse »).
      if (q === syn) {
        bump(id, 1000 + syn.length);
        continue;
      }
      if (q.includes(syn)) {
        bump(id, 500 + syn.length);
        continue;
      }

      // 2. Saisie partielle : l'utilisateur est en train de taper.
      if (syn.includes(q)) {
        bump(id, 200 + q.length);
        continue;
      }

      // 3. Dernier filet : un mot significatif en commun.
      const synWords = meaningfulWords(syn);
      const shared = queryWords.filter((w) => synWords.includes(w)).length;
      if (shared > 0) bump(id, 50 + shared * 10);
    }
  }

  // Tri par score décroissant ; à score égal on garde l'ordre d'affichage de
  // EMOTIONS pour que deux recherches équivalentes donnent le même résultat.
  const order = new Map(EMOTIONS.map((e, i) => [e.id, i] as const));
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
    .map(([id]) => id);

  // Détresse vitale : on retire `mort` (qui contient qudsi:28, voir
  // DISTRESS_PHRASES) et on met les tags de réconfort en tête, même si le
  // score ne les y aurait pas placés.
  if (isDistressQuery(query)) {
    const rest = ranked.filter((id) => id !== 'mort' && !COMFORT_EMOTIONS.includes(id));
    return [...COMFORT_EMOTIONS, ...rest];
  }

  return ranked;
}

/** Référence d'un hadith : son recueil et son numéro. */
export interface HadithRef {
  collection: string;
  n: number;
}

/**
 * Hadiths portant une émotion donnée, limités aux recueils demandés.
 *
 * `collections` permet à l'appelant de n'afficher que ce qu'il a chargé, et
 * fixe l'ordre : les recueils passés en premier sortent en premier, puis le
 * numéro croissant, pour un affichage stable.
 *
 * `distress` à `true` écarte les textes de `NEVER_IN_DISTRESS`, quels que
 * soient leurs tags. L'appelant le passe quand la saisie exprime une détresse
 * vitale (voir `isDistressQuery`).
 */
export function hadithsForEmotion(
  emotion: EmotionId,
  collections: string[],
  distress = false,
): HadithRef[] {
  const refs: HadithRef[] = [];

  for (const [key, tags] of Object.entries(HADITH_TAGS)) {
    if (!tags.includes(emotion)) continue;
    const [collection, num] = key.split(':');
    if (!collections.includes(collection)) continue;
    if (distress && NEVER_IN_DISTRESS.has(key)) continue;
    refs.push({ collection, n: Number(num) });
  }

  return refs.sort(
    (a, b) =>
      collections.indexOf(a.collection) - collections.indexOf(b.collection) || a.n - b.n,
  );
}

/**
 * Hadiths répondant à une saisie libre, restreints au ressenti dominant.
 *
 * ⚠️ C'est cette fonction que l'interface doit appeler, pas
 * `hadithsForEmotion` seule.
 *
 * On sert les hadiths du PREMIER ressenti reconnu, et de lui seul. Élargir
 * aux ressentis suivants, ou classer par nombre de tags partagés, donne des
 * résultats absurdes : « mon couple va mal » déclenche `couple`, `tristesse`
 * et `patience`, et les hadiths cumulant ces trois tags sont ceux du deuil
 * d'un enfant. Un score qui récompense l'accumulation de tags récompense la
 * gravité, pas la justesse.
 *
 * `limit` borne le résultat : au-delà d'une vingtaine de cartes, on ne
 * choisit plus, on subit une liste.
 */
export function hadithsForQuery(
  query: string,
  lang: SearchLang,
  collections: string[],
  limit = 20,
): HadithRef[] {
  const emotions = matchEmotions(query, lang);
  if (emotions.length === 0) return [];
  return hadithsForEmotion(emotions[0], collections, isDistressQuery(query))
    .slice(0, limit);
}

/**
 * Émotions portées par un hadith, dans l'ordre d'affichage de EMOTIONS.
 *
 * Sert à afficher les puces sous un hadith ouvert. Renvoie un tableau vide
 * pour un hadith non étiqueté (Bukhari, Muslim, ou l'un des textes purement
 * doctrinaux d'an-Nawawi laissés sans tag à dessein).
 */
export function emotionsOfHadith(collectionId: string, n: number): EmotionId[] {
  const tags = HADITH_TAGS[`${collectionId}:${n}`];
  if (!tags) return [];
  return EMOTIONS.filter((e) => tags.includes(e.id)).map((e) => e.id);
}
