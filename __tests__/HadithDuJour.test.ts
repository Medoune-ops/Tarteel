/**
 * Le tirage du hadith du jour.
 *
 * Le point critique est la STABILITÉ : le même jour doit toujours rendre le
 * même hadith, sinon le rendez-vous quotidien n'en est plus un — revenir
 * l'après-midi donnerait une autre carte, et la notification annoncerait un
 * texte différent de celui affiché.
 */
import { hashDay, dailyPool, hadithOfDay } from '../lib/hadithDuJour';
import { ALL_HADITH_TAGS } from '../constants/hadithTagsAll';

const ALL = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

describe('Tirage stable', () => {
  it('rend le même hadith pour un jour donné, appelé plusieurs fois', () => {
    const a = hadithOfDay('2026-09-25', ALL);
    const b = hadithOfDay('2026-09-25', ALL);
    const c = hadithOfDay('2026-09-25', ALL);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it('change d’un jour à l’autre', () => {
    const jours = ['2026-09-25', '2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29'];
    const tires = jours.map((j) => {
      const r = hadithOfDay(j, ALL);
      return `${r?.collection}:${r?.n}`;
    });
    // Cinq jours consécutifs ne doivent pas donner cinq fois le même texte.
    expect(new Set(tires).size).toBeGreaterThan(3);
  });

  it('le hachage est déterministe', () => {
    expect(hashDay('2026-09-25')).toBe(hashDay('2026-09-25'));
    expect(hashDay('2026-09-25')).not.toBe(hashDay('2026-09-26'));
  });

  it('l’ordre du vivier ne dépend pas de celui des clés', () => {
    const pool = dailyPool(ALL);
    const trie = [...pool].sort(
      (a, b) => a.collection.localeCompare(b.collection) || a.n - b.n,
    );
    expect(pool).toEqual(trie);
  });
});

describe('Qualité du vivier', () => {
  it('ne pioche que parmi les hadiths étiquetés', () => {
    const pool = dailyPool(ALL);
    expect(pool.length).toBe(Object.keys(ALL_HADITH_TAGS).length);
    for (const r of pool.slice(0, 50)) {
      expect(ALL_HADITH_TAGS[`${r.collection}:${r.n}`]).toBeDefined();
    }
  });

  it('respecte les recueils demandés', () => {
    const pool = dailyPool(['nawawi', 'qudsi']);
    for (const r of pool) expect(['nawawi', 'qudsi']).toContain(r.collection);
    expect(pool.length).toBeGreaterThan(50);
  });

  it('couvre une bonne partie du corpus sur un an, sans se répéter', () => {
    const vus = new Map<string, number>();
    const d = new Date('2026-01-01T12:00:00');
    for (let i = 0; i < 365; i++) {
      const jour = d.toISOString().slice(0, 10);
      const r = hadithOfDay(jour, ALL);
      if (r) {
        const k = `${r.collection}:${r.n}`;
        vus.set(k, (vus.get(k) ?? 0) + 1);
      }
      d.setDate(d.getDate() + 1);
    }

    /*
     * Sur 365 tirages dans un vivier de ~890, un tirage UNIFORME donne
     * environ 300 textes distincts — et non 365 : des collisions sont
     * attendues (paradoxe des anniversaires). On vérifie donc qu'on reste
     * proche de cet optimum, pas qu'on l'atteint.
     */
    expect(vus.size).toBeGreaterThan(270);

    // Et qu'aucun hadith ne revienne trop souvent dans l'année.
    expect(Math.max(...vus.values())).toBeLessThanOrEqual(4);
  });
});

describe('Cas limites', () => {
  it('rend null si aucun recueil ne correspond', () => {
    expect(hadithOfDay('2026-09-25', [])).toBeNull();
    expect(hadithOfDay('2026-09-25', ['inconnu'])).toBeNull();
  });

  it('rend toujours un hadith réellement présent dans la table', () => {
    for (const jour of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const r = hadithOfDay(jour, ALL);
      expect(r).not.toBeNull();
      expect(ALL_HADITH_TAGS[`${r!.collection}:${r!.n}`]).toBeDefined();
    }
  });
});
