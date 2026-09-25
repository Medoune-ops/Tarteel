/**
 * Les trois tags de relation — `parents`, `couple`, `famille` — et ce qu'ils
 * servent réellement.
 *
 * `famille` était au départ un seul tag d'une centaine de hadiths, triés par
 * numéro : « mon couple va mal » y recevait des hadiths qui encouragent à se
 * marier, et « mes parents vieillissent » aussi. Ces tests figent la
 * séparation qui a corrigé ça.
 */
import { matchEmotions, hadithsForQuery, emotionsOfHadith } from '../lib/hadithSearch';
import { ALL_HADITH_TAGS } from '../constants/hadithTagsAll';
import { COUPLE_EXCLUDE } from '../constants/hadithTagsCouple';

const ALL = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

describe('Difficulté conjugale', () => {
  const phrases = [
    'mon couple va mal',
    'ma femme me mene la vie dure',
    'dispute avec mon mari',
    'je supporte plus ma femme',
  ];

  it.each(phrases)('« %s » vise le tag couple', (p) => {
    expect(matchEmotions(p, 'fr')[0]).toBe('couple');
  });

  it.each(['my marriage is falling apart', 'argument with my wife'])(
    '« %s » vise le tag couple', (p) => {
      expect(matchEmotions(p, 'en')[0]).toBe('couple');
    },
  );

  it('les hadiths servis parlent bien du couple', () => {
    const refs = hadithsForQuery('mon couple va mal', 'fr', ALL, 5);
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) {
      expect(emotionsOfHadith(r.collection, r.n)).toContain('couple');
    }
  });

  it('les textes unilatéraux ou violents sont hors du corpus', () => {
    for (const key of COUPLE_EXCLUDE) {
      expect(ALL_HADITH_TAGS[key]).toBeUndefined();
    }
    // Le plus emblématique : « la femme ressemble à une côte », version
    // courte, sans la recommandation de douceur qui encadre 5185/5186.
    expect(ALL_HADITH_TAGS['bukhari:5184']).toBeUndefined();
  });
});

describe('Parents', () => {
  const phrases = [
    'mes parents vieillissent',
    'mon pere vieillit',
    'je m occupe de mes parents',
    'ma mere est malade',
  ];

  it.each(phrases)('« %s » vise le tag parents', (p) => {
    expect(matchEmotions(p, 'fr')[0]).toBe('parents');
  });

  it.each(['my parents are getting old', 'looking after my parents'])(
    '« %s » vise le tag parents', (p) => {
      expect(matchEmotions(p, 'en')[0]).toBe('parents');
    },
  );

  it('sert « ta mère, ta mère, ta mère, puis ton père » en premier', () => {
    const refs = hadithsForQuery('mes parents vieillissent', 'fr', ALL, 3);
    expect(`${refs[0].collection}:${refs[0].n}`).toBe('muslim:6500');
  });

  it('ne sert plus les hadiths qui encouragent à se marier', () => {
    const servis = hadithsForQuery('mes parents vieillissent', 'fr', ALL, 10)
      .map((r) => `${r.collection}:${r.n}`);
    // bukhari:5066 = « ô jeunes gens, que celui qui peut se marier se marie »
    expect(servis).not.toContain('bukhari:5066');
  });
});

describe('Famille au sens large', () => {
  it.each(['mes enfants', 'mon frere', 'ma famille me parle plus'])(
    '« %s » reste sur le tag famille', (p) => {
      expect(matchEmotions(p, 'fr')[0]).toBe('famille');
    },
  );

  it('les trois tags ont chacun de la matière', () => {
    for (const tag of ['parents', 'couple', 'famille'] as const) {
      const n = Object.values(ALL_HADITH_TAGS).filter((t) => t.includes(tag)).length;
      expect(n).toBeGreaterThanOrEqual(15);
    }
  });
});
