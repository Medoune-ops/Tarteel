import { matchEmotions } from '../lib/hadithSearch';

describe('Détresse vitale : réconfort, jamais condamnation', () => {
  const fr = ["j'ai plus envie de vivre", 'je veux mourir', 'suicide', 'en finir', 'a quoi bon'];
  const en = ["i don't want to live", 'i want to die', 'suicide', 'kill myself', 'end it all'];

  it.each(fr)('FR « %s » ne renvoie jamais le tag mort', (q) => {
    expect(matchEmotions(q, 'fr')).not.toContain('mort');
  });

  it.each(en)('EN « %s » ne renvoie jamais le tag mort', (q) => {
    expect(matchEmotions(q, 'en')).not.toContain('mort');
  });

  it.each(fr)('FR « %s » renvoie un tag de réconfort', (q) => {
    const r = matchEmotions(q, 'fr');
    expect(r.some((e) => ['espoir', 'patience', 'confiance'].includes(e))).toBe(true);
  });

  it.each(en)('EN « %s » renvoie un tag de réconfort', (q) => {
    const r = matchEmotions(q, 'en');
    expect(r.some((e) => ['espoir', 'patience', 'confiance'].includes(e))).toBe(true);
  });

  it('un deuil réel renvoie toujours le tag mort', () => {
    expect(matchEmotions("j'ai perdu quelqu'un", 'fr')).toContain('mort');
    expect(matchEmotions('someone died', 'en')).toContain('mort');
  });
});
