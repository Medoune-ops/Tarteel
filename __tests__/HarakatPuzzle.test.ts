/**
 * Exercice « Reconstituer » : découpage du texte uthmani et pose des pièces.
 * Une pièce correcte refusée bloquerait l'élève sans issue ; une pièce fausse
 * acceptée lui ferait reformer un mot faux en le croyant juste.
 */
import {
  builtText, clusterMarks, createPuzzle, letterCount, modelText, pickSession, pieceCount, placePiece, tokenize,
  type PuzzleState,
} from '../utils/harakatPuzzle';

/** Pose les bonnes pièces dans l'ordre attendu jusqu'à la fin. */
function solve(s: PuzzleState): PuzzleState {
  let state = s;
  let guard = 0;
  while (!state.done && guard++ < 500) {
    const piece = state.pieces.find((p) => !p.used && placePiece(state, p.id).ok);
    if (!piece) throw new Error('aucune pièce ne convient');
    state = placePiece(state, piece.id).state;
  }
  return state;
}

const fixedRand = () => 0.42;

describe('tokenize', () => {
  it('sépare lettres et harakats (بِسْمِ)', () => {
    const c = tokenize('بِسْمِ');
    expect(c.map((x) => x.letter)).toEqual(['ب', 'س', 'م']);
    expect(c.map(clusterMarks)).toEqual([['ِ'], ['ْ'], ['ِ']]);
    expect(letterCount(c)).toBe(3);
    expect(pieceCount(c)).toBe(6);
  });

  it('ramène le soukoun uthmani au soukoun', () => {
    const c = tokenize('ٱلْحَمْدُ'.replace('ْ', 'ۡ'));
    expect(clusterMarks(c[1]!)).toEqual(['ْ']);
  });

  it('retire les signes de pause et le numéro de verset', () => {
    expect(modelText('قُلْ هُوَ ٱللَّهُ أَحَدٌ ۝١')).toBe('قُلْ هُوَ ٱللَّهُ أَحَدٌ');
    expect(modelText('ٱلصَّمَدُ ۖ')).toBe('ٱلصَّمَدُ');
  });

  it('pose d’office les espaces entre les mots', () => {
    const c = tokenize('قُلْ هُوَ');
    expect(c.filter((x) => x.auto)).toHaveLength(1);
    expect(letterCount(c)).toBe(4);
  });
});

describe('placePiece', () => {
  it('refuse un harakat tant que la lettre n’est pas posée', () => {
    const s = createPuzzle('بِسْمِ', fixedRand);
    const kasra = s.pieces.find((p) => p.kind === 'mark')!;
    const r = placePiece(s, kasra.id);
    expect(r.ok).toBe(false);
    expect(r.state.mistakes).toBe(1);
  });

  it('accepte chadda et fatha dans n’importe quel ordre', () => {
    let s = createPuzzle('رَبِّ', fixedRand);
    s = placePiece(s, s.pieces.find((p) => p.value === 'ر')!.id).state;
    s = placePiece(s, s.pieces.find((p) => p.value === 'َ')!.id).state;
    s = placePiece(s, s.pieces.find((p) => p.value === 'ب')!.id).state;
    // kasra avant chadda alors que le texte écrit chadda puis kasra.
    const k = placePiece(s, s.pieces.find((p) => p.value === 'ِ')!.id);
    expect(k.ok).toBe(true);
    const sh = placePiece(k.state, k.state.pieces.find((p) => p.value === 'ّ')!.id);
    expect(sh.ok).toBe(true);
    expect(sh.state.done).toBe(true);
    expect(sh.state.mistakes).toBe(0);
  });

  it('reforme exactement le modèle, sans erreur', () => {
    const texte = 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ';
    const fin = solve(createPuzzle(texte, fixedRand));
    expect(fin.done).toBe(true);
    expect(fin.mistakes).toBe(0);
    expect(builtText(fin)).toBe(modelText(texte));
    expect(fin.pieces.every((p) => p.used)).toBe(true);
  });

  it('montre le texte au fur et à mesure', () => {
    let s = createPuzzle('بِسْمِ', fixedRand);
    s = placePiece(s, s.pieces.find((p) => p.value === 'ب')!.id).state;
    expect(builtText(s)).toBe('ب');
    s = placePiece(s, s.pieces.find((p) => p.value === 'ِ')!.id).state;
    expect(builtText(s)).toBe('بِ');
  });
});

describe('pickSession', () => {
  const versets = [
    { numero: 1, texteArabe: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', mots: [{ texteArabe: 'قُلْ' }, { texteArabe: 'هُوَ' }, { texteArabe: 'ٱللَّهُ' }, { texteArabe: 'أَحَدٌ' }] },
    { numero: 2, texteArabe: 'ٱللَّهُ ٱلصَّمَدُ', mots: [{ texteArabe: 'ٱللَّهُ' }, { texteArabe: 'ٱلصَّمَدُ' }] },
  ];

  it('alterne mots et versets courts, sans doublon', () => {
    const s = pickSession(versets, 'Al-Ikhlas', 5, fixedRand);
    expect(s.length).toBeGreaterThan(0);
    expect(s.length).toBeLessThanOrEqual(5);
    expect(s.some((i) => i.kind === 'verset')).toBe(true);
    const textes = s.map((i) => modelText(i.text));
    expect(new Set(textes).size).toBe(textes.length);
    expect(s[0]!.ref).toMatch(/^Al-Ikhlas · \d$/);
  });
});
