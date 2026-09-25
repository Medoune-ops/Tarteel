/**
 * Corpus élargi à Bukhari et Muslim : vérifie que la garde de détresse tient
 * sur les 900 hadiths étiquetés, et que le tag `famille` répond enfin.
 */
import { hadithsForEmotion, isDistressQuery, isSafeInDistress, matchEmotions } from '../lib/hadithSearch';

const ALL = ['nawawi', 'qudsi', 'bukhari', 'muslim'];
const BANNED = ['qudsi:28', 'bukhari:5778', 'bukhari:1363', 'bukhari:1364',
  'bukhari:1365', 'muslim:2262', 'bukhari:6493', 'bukhari:6047', 'bukhari:6105'];

describe('Garde détresse avec le corpus élargi', () => {
  it('aucun texte de condamnation ne sort en mode détresse', () => {
    for (const e of ['espoir', 'patience', 'confiance', 'mort'] as const) {
      const refs = hadithsForEmotion(e, ALL, true);
      for (const r of refs) expect(BANNED).not.toContain(`${r.collection}:${r.n}`);
    }
  });

  it('isSafeInDistress marque bien les 9 textes', () => {
    for (const k of BANNED) {
      const [c, n] = k.split(':');
      expect(isSafeInDistress(c, Number(n))).toBe(false);
    }
    expect(isSafeInDistress('nawawi', 19)).toBe(true);
  });

  it('hors détresse, le corpus reste entier', () => {
    const libre = hadithsForEmotion('mort', ALL, false).length;
    const garde = hadithsForEmotion('mort', ALL, true).length;
    expect(libre).toBeGreaterThan(garde);
  });

  // Le tag visé est `parents`, extrait de `famille` depuis : voir
  // HadithRelations.test.ts pour le détail de cette séparation.
  it('« mes parents vieillissent » trouve enfin des hadiths', () => {
    expect(matchEmotions('mes parents vieillissent', 'fr')).toContain('parents');
    expect(hadithsForEmotion('parents', ALL).length).toBeGreaterThan(15);
  });

  it('« my parents are getting old » aussi', () => {
    expect(matchEmotions('my parents are getting old', 'en')).toContain('parents');
  });

  it('détresse : réconfort en tête, jamais mort', () => {
    for (const q of ["j'ai plus envie de vivre", 'i want to die']) {
      const em = matchEmotions(q, q.startsWith('i ') ? 'en' : 'fr');
      expect(['espoir', 'patience', 'confiance']).toContain(em[0]);
      expect(em).not.toContain('mort');
      expect(isDistressQuery(q)).toBe(true);
    }
  });
});
