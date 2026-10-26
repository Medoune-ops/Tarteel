/**
 * Exercice « Reconstituer » (onglet Révision) : un mot ou un verset sert de
 * modèle, l'utilisateur le reforme en posant les lettres puis leurs harakats.
 *
 * Tout le découpage du texte coranique est ici, sans React, pour être testé.
 *
 * Le texte uthmani contient plus que des lettres et des voyelles : signes de
 * pause (ۖ ۗ…), numéros de verset, petites lettres suscrites, tatwil… Seuls
 * les signes qu'un élève sait nommer deviennent des pièces à placer (voir
 * TILE_MARKS). Les autres signes sont posés d'office avec leur lettre, pour
 * que le mot reformé ressemble exactement au modèle.
 */

export type PieceKind = 'letter' | 'mark';

/** Harakats proposés comme pièces : voyelles, tanwin, soukoun, chadda, alif suscrit, madda. */
export const TILE_MARKS = new Set([
  'ً', // fathatan
  'ٌ', // dammatan
  'ٍ', // kasratan
  'َ', // fatha
  'ُ', // damma
  'ِ', // kasra
  'ّ', // chadda
  'ْ', // soukoun
  'ٰ', // alif suscrit
  'ٓ', // madda
]);

/** Variantes uthmanies ramenées au harakat que l'élève connaît. */
const MARK_ALIASES: Record<string, string> = {
  'ۡ': 'ْ', // soukoun uthmani (tête de khâ) → soukoun
  'ࣰ': 'ً', // tanwin « ouvert » → tanwin
  'ࣱ': 'ٌ',
  'ࣲ': 'ٍ',
};

/** Signes de pause, fin de verset et numéros : absents de l'exercice. */
const DROPPED_RE = /[ۖ-۞۩٠-٩۰-۹0-9۝()﴿﴾]/;

/** Diacritique combinant (porte sur la lettre qui précède). */
const COMBINING_RE = /[ؐ-ًؚ-ٰٟ۟-۪ۨ-ۭ࣓-ࣿ]/;

const TATWEEL = 'ـ';

export interface Cluster {
  /** Lettre de base ('' pour une espace). */
  letter: string;
  /** Posée d'office : espace entre deux mots ou tatwil. */
  auto: boolean;
  /** Signes du texte, dans l'ordre, tels qu'affichés. */
  chars: { ch: string; tile: string | null }[];
}

export function normalizeMark(ch: string): string {
  return MARK_ALIASES[ch] ?? ch;
}

/** Découpe un mot ou un verset en grappes « lettre + signes ». */
export function tokenize(text: string): Cluster[] {
  const clusters: Cluster[] = [];
  for (const raw of [...text.normalize('NFC')]) {
    if (DROPPED_RE.test(raw)) continue;
    if (/\s/.test(raw)) {
      const last = clusters[clusters.length - 1];
      if (last && last.letter !== '') clusters.push({ letter: '', auto: true, chars: [{ ch: ' ', tile: null }] });
      continue;
    }
    if (COMBINING_RE.test(raw)) {
      const last = clusters[clusters.length - 1];
      if (!last || last.letter === '') continue; // signe orphelin : ignoré
      const n = normalizeMark(raw);
      last.chars.push({ ch: raw, tile: TILE_MARKS.has(n) ? n : null });
      continue;
    }
    clusters.push({ letter: raw, auto: raw === TATWEEL, chars: [{ ch: raw, tile: null }] });
  }
  while (clusters.length && clusters[clusters.length - 1]!.letter === '') clusters.pop();
  return clusters;
}

/** Harakats à placer pour une grappe. */
export function clusterMarks(c: Cluster): string[] {
  return c.chars.filter((x) => x.tile).map((x) => x.tile!);
}

/** Nombre de lettres à placer (hors espaces et tatwil). */
export function letterCount(clusters: Cluster[]): number {
  return clusters.filter((c) => !c.auto).length;
}

/** Nombre total de pièces (lettres + harakats). */
export function pieceCount(clusters: Cluster[]): number {
  return clusters.reduce((n, c) => n + (c.auto ? 0 : 1) + clusterMarks(c).length, 0);
}

export interface Piece {
  id: number;
  kind: PieceKind;
  value: string;
  used: boolean;
}

export interface PuzzleState {
  clusters: Cluster[];
  /** Grappe en cours de reconstitution. */
  cursor: number;
  /** La lettre de la grappe courante est-elle posée ? */
  letterPlaced: boolean;
  /** Harakats déjà posés sur la grappe courante (valeurs normalisées). */
  placedMarks: string[];
  pieces: Piece[];
  mistakes: number;
  done: boolean;
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Passe les grappes posées d'office (espaces, tatwil sans harakat). */
function advance(s: PuzzleState): PuzzleState {
  let { cursor, letterPlaced, placedMarks } = s;
  for (;;) {
    const c = s.clusters[cursor];
    if (!c) return { ...s, cursor, letterPlaced: false, placedMarks: [], done: true };
    if (c.auto && !letterPlaced) letterPlaced = true;
    const missing = clusterMarks(c).length - placedMarks.length;
    if (letterPlaced && missing <= 0) {
      cursor += 1;
      letterPlaced = false;
      placedMarks = [];
      continue;
    }
    return { ...s, cursor, letterPlaced, placedMarks, done: false };
  }
}

export function createPuzzle(text: string, rand: () => number = Math.random): PuzzleState {
  const clusters = tokenize(text);
  const values: { kind: PieceKind; value: string }[] = [];
  for (const c of clusters) {
    if (!c.auto) values.push({ kind: 'letter', value: c.letter });
    for (const m of clusterMarks(c)) values.push({ kind: 'mark', value: m });
  }
  const pieces = shuffle(values, rand).map((v, id) => ({ ...v, id, used: false }));
  return advance({ clusters, cursor: 0, letterPlaced: false, placedMarks: [], pieces, mistakes: 0, done: false });
}

export type PlaceResult = { ok: boolean; state: PuzzleState };

/**
 * Tente de poser une pièce. On attend d'abord la lettre de la grappe
 * courante, puis tous ses harakats (dans n'importe quel ordre : chadda puis
 * fatha ou l'inverse). Une pièce fausse compte une erreur et reste en place.
 */
export function placePiece(s: PuzzleState, pieceId: number): PlaceResult {
  const piece = s.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.used || s.done) return { ok: false, state: s };
  const c = s.clusters[s.cursor]!;
  const remaining = [...clusterMarks(c)];
  for (const m of s.placedMarks) remaining.splice(remaining.indexOf(m), 1);

  const fits = !s.letterPlaced
    ? piece.kind === 'letter' && piece.value === c.letter
    : piece.kind === 'mark' && remaining.includes(piece.value);
  if (!fits) return { ok: false, state: { ...s, mistakes: s.mistakes + 1 } };

  const pieces = s.pieces.map((p) => (p.id === pieceId ? { ...p, used: true } : p));
  const next = s.letterPlaced
    ? { ...s, pieces, placedMarks: [...s.placedMarks, piece.value] }
    : { ...s, pieces, letterPlaced: true };
  return { ok: true, state: advance(next) };
}

/** Texte déjà reformé, prêt à afficher (signes non proposés compris). */
export function builtText(s: PuzzleState): string {
  let out = '';
  s.clusters.forEach((c, i) => {
    if (i < s.cursor || s.done) {
      out += c.chars.map((x) => x.ch).join('');
    } else if (i === s.cursor && s.letterPlaced) {
      const left = [...s.placedMarks];
      for (const x of c.chars) {
        if (x.tile == null) out += x.ch;
        else if (left.includes(x.tile)) {
          left.splice(left.indexOf(x.tile), 1);
          out += x.ch;
        }
      }
    }
  });
  return out;
}

/** Le texte du modèle, débarrassé des signes de pause et numéros de verset. */
export function modelText(text: string): string {
  return tokenize(text).map((c) => c.chars.map((x) => x.ch).join('')).join('');
}

// ─── Choix des exercices d'une session ──────────────────────────────────────

export interface PuzzleItem {
  kind: 'mot' | 'verset';
  text: string;
  /** Référence affichée : « Al-Ikhlas · 2 ». */
  ref: string;
}

/** Un mot : 2 à 7 lettres. Un verset : 24 pièces au plus, pour rester jouable. */
const WORD_MIN_LETTERS = 2;
const WORD_MAX_LETTERS = 7;
const VERSE_MAX_PIECES = 24;

export function pickSession(
  versets: { numero: number; texteArabe: string; mots: { texteArabe: string }[] }[],
  sourateNom: string,
  count = 5,
  rand: () => number = Math.random,
): PuzzleItem[] {
  const mots: PuzzleItem[] = [];
  const courts: PuzzleItem[] = [];
  for (const v of versets) {
    const ref = `${sourateNom} · ${v.numero}`;
    const vc = tokenize(v.texteArabe);
    if (letterCount(vc) >= WORD_MIN_LETTERS && pieceCount(vc) <= VERSE_MAX_PIECES) {
      courts.push({ kind: 'verset', text: v.texteArabe, ref });
    }
    for (const m of v.mots) {
      const n = letterCount(tokenize(m.texteArabe));
      if (n >= WORD_MIN_LETTERS && n <= WORD_MAX_LETTERS) mots.push({ kind: 'mot', text: m.texteArabe, ref });
    }
  }
  const motsMelanges = shuffle(dedupe(mots), rand);
  const versetsMelanges = shuffle(courts, rand);
  // Alternance : mot, mot, verset, mot, verset… (un mot si aucun verset n'est assez court).
  const out: PuzzleItem[] = [];
  for (let i = 0; i < count; i++) {
    const veutVerset = i % 3 === 2 || i === 4;
    const item = (veutVerset ? versetsMelanges.shift() : undefined) ?? motsMelanges.shift() ?? versetsMelanges.shift();
    if (!item) break;
    out.push(item);
  }
  return out;
}

function dedupe(items: PuzzleItem[]): PuzzleItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = modelText(i.text);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
