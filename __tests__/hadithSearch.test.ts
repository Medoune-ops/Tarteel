import { EMOTIONS, SYNONYMS, type EmotionId } from '../constants/hadithEmotions';
import { HADITH_TAGS } from '../constants/hadithTags';
import {
  emotionsOfHadith,
  hadithsForEmotion,
  matchEmotions,
  normalize,
} from '../lib/hadithSearch';

const RECUEILS = ['nawawi', 'qudsi'];

describe('Normalisation de la saisie', () => {
  it('passe en minuscules et enlève les accents', () => {
    expect(normalize('ANGOISSÉ')).toBe('angoisse');
    expect(normalize('Colère')).toBe('colere');
  });

  it('enlève la ponctuation et resserre les espaces', () => {
    expect(normalize("  J'ai   peur !!! ")).toBe('j ai peur');
    expect(normalize('je stresse, beaucoup.')).toBe('je stresse beaucoup');
  });

  it('traite l’apostrophe typographique comme la droite', () => {
    expect(normalize('j’ai peur')).toBe(normalize("j'ai peur"));
  });
});

describe('matchEmotions — correspondance exacte', () => {
  it('trouve « j’ai peur » en tête', () => {
    expect(matchEmotions("j'ai peur", 'fr')[0]).toBe('peur');
  });

  it('trouve « je suis triste » en tête', () => {
    expect(matchEmotions('je suis triste', 'fr')[0]).toBe('tristesse');
  });

  it('trouve « j’aime quelqu’un » en tête', () => {
    expect(matchEmotions("j'aime quelqu'un", 'fr')[0]).toBe('amour');
  });

  it('trouve la formulation familière « j’ai pas l’esprit tranquille »', () => {
    expect(matchEmotions("j'ai pas l'esprit tranquille", 'fr')[0]).toBe('peur');
  });
});

describe('matchEmotions — correspondance partielle', () => {
  it('reconnaît une saisie en cours de frappe', () => {
    expect(matchEmotions('angoi', 'fr')).toContain('peur');
    expect(matchEmotions('jalou', 'fr')).toContain('jalousie');
  });

  it('reconnaît une formulation noyée dans une phrase plus longue', () => {
    expect(matchEmotions('je stresse beaucoup en ce moment', 'fr')[0]).toBe('peur');
  });

  it('retombe sur les mots significatifs quand la tournure est inédite', () => {
    expect(matchEmotions('cette solitude me pèse', 'fr')).toContain('solitude');
  });
});

describe('matchEmotions — casse et accents', () => {
  it('donne le même résultat quelle que soit la casse', () => {
    expect(matchEmotions('JE SUIS EN COLERE', 'fr')).toEqual(
      matchEmotions('je suis en colere', 'fr'),
    );
  });

  it('donne le même résultat avec ou sans accents', () => {
    expect(matchEmotions('je suis en colère', 'fr')).toEqual(
      matchEmotions('je suis en colere', 'fr'),
    );
    expect(matchEmotions('anxiété', 'fr')[0]).toBe('peur');
  });

  it('ignore la ponctuation parasite', () => {
    expect(matchEmotions('je suis triste...', 'fr')[0]).toBe('tristesse');
  });
});

describe('matchEmotions — absence de correspondance', () => {
  it('renvoie un tableau vide pour une saisie sans rapport', () => {
    expect(matchEmotions('zzzzqqq', 'fr')).toEqual([]);
  });

  it('renvoie un tableau vide pour une saisie vide ou trop courte', () => {
    expect(matchEmotions('', 'fr')).toEqual([]);
    expect(matchEmotions('   ', 'fr')).toEqual([]);
    expect(matchEmotions('a', 'fr')).toEqual([]);
  });
});

describe('matchEmotions — anglais', () => {
  it('trouve « i am scared » en tête', () => {
    expect(matchEmotions("i'm scared", 'en')[0]).toBe('peur');
  });

  it('trouve « i feel lonely »', () => {
    expect(matchEmotions('i feel lonely', 'en')).toContain('solitude');
  });

  it('trouve « i cannot forgive »', () => {
    expect(matchEmotions("i can't forgive", 'en')[0]).toBe('pardon');
  });

  it('gère la casse et la ponctuation en anglais aussi', () => {
    expect(matchEmotions('I AM GRATEFUL!', 'en')).toContain('gratitude');
  });

  it('ne trouve rien pour une saisie française passée en anglais', () => {
    // « angoisse » n'existe pas dans la table anglaise : mieux vaut zéro
    // résultat qu'un résultat faux.
    expect(matchEmotions('angoisse', 'en')).toEqual([]);
  });
});

describe('hadithsForEmotion', () => {
  it('renvoie des hadiths pour la peur, dans les deux recueils', () => {
    const refs = hadithsForEmotion('peur', RECUEILS);
    expect(refs.length).toBeGreaterThanOrEqual(2);
    expect(refs.every((r) => RECUEILS.includes(r.collection))).toBe(true);
  });

  it('filtre sur les recueils demandés', () => {
    const refs = hadithsForEmotion('espoir', ['qudsi']);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.every((r) => r.collection === 'qudsi')).toBe(true);
  });

  it('renvoie un tableau vide si aucun recueil n’est demandé', () => {
    expect(hadithsForEmotion('peur', [])).toEqual([]);
  });

  it('trie par recueil puis par numéro croissant', () => {
    const refs = hadithsForEmotion('pardon', RECUEILS);
    const nawawi = refs.filter((r) => r.collection === 'nawawi').map((r) => r.n);
    expect([...nawawi].sort((a, b) => a - b)).toEqual(nawawi);
    // Tous les nawawi arrivent avant les qudsi.
    const premierQudsi = refs.findIndex((r) => r.collection === 'qudsi');
    if (premierQudsi !== -1) {
      expect(refs.slice(premierQudsi).every((r) => r.collection === 'qudsi')).toBe(true);
    }
  });
});

describe('emotionsOfHadith — un hadith porte plusieurs tags', () => {
  it('rend plusieurs émotions pour nawawi #19 (« préserve Allah »)', () => {
    const tags = emotionsOfHadith('nawawi', 19);
    expect(tags.length).toBeGreaterThan(1);
    expect(tags).toEqual(expect.arrayContaining(['confiance', 'patience', 'espoir']));
  });

  it('rend plusieurs émotions pour qudsi #29 (la patience dans le deuil)', () => {
    const tags = emotionsOfHadith('qudsi', 29);
    expect(tags).toEqual(expect.arrayContaining(['tristesse', 'mort', 'patience']));
  });

  it('rend un tableau vide pour un hadith non étiqueté', () => {
    expect(emotionsOfHadith('nawawi', 3)).toEqual([]);
    expect(emotionsOfHadith('bukhari', 1)).toEqual([]);
    expect(emotionsOfHadith('nawawi', 999)).toEqual([]);
  });

  it('respecte l’ordre d’affichage de EMOTIONS', () => {
    const ordre = EMOTIONS.map((e) => e.id);
    const tags = emotionsOfHadith('nawawi', 24);
    const positions = tags.map((t) => ordre.indexOf(t));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('boucle : chaque hadith rendu par un tag porte bien ce tag', () => {
    for (const { id } of EMOTIONS) {
      for (const ref of hadithsForEmotion(id, RECUEILS)) {
        expect(emotionsOfHadith(ref.collection, ref.n)).toContain(id);
      }
    }
  });
});

describe('Cohérence des données', () => {
  it('chaque émotion a au moins 2 hadiths dans le corpus complet', () => {
    // Sur les QUATRE recueils : `famille` ne vient que de Bukhari et Muslim,
    // an-Nawawi et al-Qudsi n'ayant aucun texte familial.
    const tous = ['nawawi', 'qudsi', 'bukhari', 'muslim'];
    const faibles = EMOTIONS.filter((e) => hadithsForEmotion(e.id, tous).length < 2);
    // Le message d'échec nomme les tags fautifs plutôt qu'un simple « 1 < 2 ».
    expect(faibles.map((e) => e.id)).toEqual([]);
  });

  it('chaque émotion a des synonymes dans les deux langues', () => {
    for (const { id } of EMOTIONS) {
      expect(SYNONYMS[id].fr.length).toBeGreaterThanOrEqual(8);
      expect(SYNONYMS[id].en.length).toBeGreaterThanOrEqual(8);
    }
  });

  it('les tags ne référencent que des émotions connues, sur nawawi et qudsi', () => {
    const connues = new Set<EmotionId>(EMOTIONS.map((e) => e.id));
    for (const [cle, tags] of Object.entries(HADITH_TAGS)) {
      const [recueil, num] = cle.split(':');
      expect(RECUEILS).toContain(recueil);
      expect(Number.isInteger(Number(num))).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
      for (const t of tags) expect(connues.has(t)).toBe(true);
    }
  });

  it('les numéros restent dans les bornes des recueils (42 et 40)', () => {
    for (const cle of Object.keys(HADITH_TAGS)) {
      const [recueil, num] = cle.split(':');
      const max = recueil === 'nawawi' ? 42 : 40;
      expect(Number(num)).toBeGreaterThanOrEqual(1);
      expect(Number(num)).toBeLessThanOrEqual(max);
    }
  });
});
