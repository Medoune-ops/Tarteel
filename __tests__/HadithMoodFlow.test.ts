/**
 * Parcours réel de la recherche par ressenti : de la phrase tapée jusqu'aux
 * hadiths servis. Ces tests vérifient que l'utilisateur obtient bien quelque
 * chose — pas seulement que le code compile.
 */
import { matchEmotions, hadithsForEmotion, isDistressQuery } from '../lib/hadithSearch';
import { EMOTIONS } from '../constants/hadithEmotions';

/** Recueils cherchés, comme dans l'écran. */
const TAGGED = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

/** Simule le parcours : je tape une phrase → je reçois des hadiths. */
function search(phrase: string, lang: 'fr' | 'en') {
  const emotions = matchEmotions(phrase, lang);
  if (emotions.length === 0) return { emotions, hadiths: [] };
  return { emotions, hadiths: hadithsForEmotion(emotions[0], TAGGED) };
}

describe('Phrases réelles en français : on trouve toujours quelque chose', () => {
  const phrases = [
    "j'ai peur",
    "je suis angoissé",
    "j'ai pas l'esprit tranquille",
    "je suis triste",
    "j'ai perdu quelqu'un",
    "je suis en colère",
    "j'arrive pas à pardonner",
    "j'aime quelqu'un",
    "je me sens seul",
    "je doute",
    "je culpabilise",
    "j'en peux plus",
    "je suis malade",
    "j'ai pas d'argent",
    "je suis reconnaissant",
  ];

  it.each(phrases)('« %s » renvoie au moins un hadith', (p) => {
    const { emotions, hadiths } = search(p, 'fr');
    expect(emotions.length).toBeGreaterThan(0);
    expect(hadiths.length).toBeGreaterThan(0);
  });
});

describe('Phrases réelles en anglais', () => {
  const phrases = [
    "i'm scared",
    "i'm anxious",
    "i'm sad",
    "i lost someone",
    "i'm angry",
    "i can't forgive",
    "i love someone",
    "i'm lonely",
    "i feel guilty",
    "i can't take it anymore",
  ];

  it.each(phrases)('« %s » renvoie au moins un hadith', (p) => {
    const { emotions, hadiths } = search(p, 'en');
    expect(emotions.length).toBeGreaterThan(0);
    expect(hadiths.length).toBeGreaterThan(0);
  });
});

describe('Détresse vitale : réconfort servi, condamnation écartée', () => {
  const distress = [
    "j'ai plus envie de vivre",
    'je veux mourir',
    "i don't want to live",
    'kill myself',
  ];

  it.each(distress)('« %s » est bien détectée comme détresse', (p) => {
    expect(isDistressQuery(p)).toBe(true);
  });

  it.each(distress)('« %s » sert des hadiths de réconfort', (p) => {
    const lang = p.startsWith('i') && !p.startsWith("j'") ? 'en' : 'fr';
    const { emotions, hadiths } = search(p, lang as 'fr' | 'en');
    expect(['espoir', 'patience', 'confiance']).toContain(emotions[0]);
    expect(hadiths.length).toBeGreaterThan(0);
  });

  it('une phrase ordinaire n’est jamais prise pour de la détresse', () => {
    expect(isDistressQuery("j'ai peur")).toBe(false);
    expect(isDistressQuery("j'ai perdu mon père")).toBe(false);
    expect(isDistressQuery('i am sad')).toBe(false);
  });
});

describe('Cohérence des données affichées par l’écran', () => {
  it('chaque ressenti suggéré a un libellé, un emoji et des hadiths', () => {
    const suggested = [
      'peur', 'tristesse', 'colere', 'patience', 'espoir',
      'pardon', 'gratitude', 'amour', 'solitude', 'doute',
      'repentir', 'confiance',
    ] as const;

    for (const id of suggested) {
      const e = EMOTIONS.find((x) => x.id === id);
      expect(e).toBeDefined();
      expect(e?.fr).toBeTruthy();
      expect(e?.en).toBeTruthy();
      expect(e?.emoji).toBeTruthy();
      expect(hadithsForEmotion(id, TAGGED).length).toBeGreaterThan(0);
    }
  });

  it('tous les ressentis renvoient des hadiths des recueils étiquetés', () => {
    for (const e of EMOTIONS) {
      const refs = hadithsForEmotion(e.id, TAGGED);
      expect(refs.length).toBeGreaterThanOrEqual(2);
      for (const r of refs) expect(TAGGED).toContain(r.collection);
    }
  });

  it('une saisie trop courte ne renvoie rien', () => {
    expect(matchEmotions('a', 'fr')).toEqual([]);
    expect(matchEmotions('', 'fr')).toEqual([]);
  });
});
