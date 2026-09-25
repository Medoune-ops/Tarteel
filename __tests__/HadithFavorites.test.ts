import { useHadithFavorites } from '../store/hadithFavoritesStore';
import { today } from '../store/hadithProgressStore';

/** Repositionne le store avant chaque test (les stores zustand sont globaux). */
beforeEach(() => {
  useHadithFavorites.getState().reset();
});

describe('Favoris de hadiths (marque-page, pas les vies du parcours)', () => {
  it('met un hadith de côté puis le retire', () => {
    const s = useHadithFavorites.getState();
    expect(s.isFavorite('nawawi', 7)).toBe(false);

    expect(s.toggleFavorite('nawawi', 7)).toBe(true);
    expect(useHadithFavorites.getState().isFavorite('nawawi', 7)).toBe(true);

    expect(useHadithFavorites.getState().toggleFavorite('nawawi', 7)).toBe(false);
    expect(useHadithFavorites.getState().isFavorite('nawawi', 7)).toBe(false);
  });

  it('distingue deux recueils portant le même numéro', () => {
    useHadithFavorites.getState().toggleFavorite('nawawi', 1);
    const s = useHadithFavorites.getState();
    expect(s.isFavorite('nawawi', 1)).toBe(true);
    expect(s.isFavorite('qudsi', 1)).toBe(false);
  });

  it('horodate le favori pour pouvoir trier « Mes hadiths »', () => {
    useHadithFavorites.getState().toggleFavorite('qudsi', 12);
    const [fav] = useHadithFavorites.getState().favorites;
    expect(fav).toEqual({ collectionId: 'qudsi', n: 12, savedOn: today() });
  });

  it('retirer un hadith absent ne casse rien', () => {
    useHadithFavorites.getState().removeFavorite('nawawi', 99);
    expect(useHadithFavorites.getState().favorites).toEqual([]);
  });

  it('conserve les autres favoris quand on en retire un', () => {
    const s = useHadithFavorites.getState();
    s.toggleFavorite('nawawi', 1);
    useHadithFavorites.getState().toggleFavorite('nawawi', 2);
    useHadithFavorites.getState().toggleFavorite('qudsi', 3);

    useHadithFavorites.getState().removeFavorite('nawawi', 2);

    const rest = useHadithFavorites.getState().favorites.map((f) => `${f.collectionId}:${f.n}`);
    expect(rest).toEqual(['nawawi:1', 'qudsi:3']);
  });
});

describe('Série de lecture (douce : elle repart, elle ne punit pas)', () => {
  /** Force le dernier jour de lecture, pour simuler une reprise le lendemain. */
  function setLastRead(day: string, streak: number) {
    useHadithFavorites.setState({ lastReadDay: day, streak });
  }

  /** `n` jours avant aujourd'hui, au format YYYY-MM-DD. */
  function daysAgo(n: number): string {
    const d = new Date(`${today()}T12:00:00`);
    d.setDate(d.getDate() - n);
    const pad = (v: number) => String(v).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  it('démarre la série à 1 à la première lecture', () => {
    useHadithFavorites.getState().markReadToday();
    const s = useHadithFavorites.getState();
    expect(s.streak).toBe(1);
    expect(s.lastReadDay).toBe(today());
  });

  it('prolonge la série si la veille a été lue', () => {
    setLastRead(daysAgo(1), 11);
    useHadithFavorites.getState().markReadToday();
    expect(useHadithFavorites.getState().streak).toBe(12);
  });

  it('repart à 1 après un jour sauté, sans rien retirer', () => {
    setLastRead(daysAgo(3), 11);
    useHadithFavorites.getState().markReadToday();
    expect(useHadithFavorites.getState().streak).toBe(1);
  });

  it('ne compte qu’une fois par jour', () => {
    useHadithFavorites.getState().markReadToday();
    useHadithFavorites.getState().markReadToday();
    useHadithFavorites.getState().markReadToday();
    expect(useHadithFavorites.getState().streak).toBe(1);
  });
});
