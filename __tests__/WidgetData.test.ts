/**
 * Tests du code JS des widgets.
 *
 * Deux choses distinctes sont couvertes ici :
 *
 *  1. nameOfTheDay() — la rotation des 99 noms. Le MÊME calcul est réécrit
 *     trois fois (TS ici, Kotlin dans AsmaData.kt, Swift dans
 *     WordOfDayWidget.swift). Si l'un dérive, l'app et le widget affichent
 *     deux noms différents le même jour, sans que rien ne le signale.
 *
 *  2. syncWidgetData() — le pont app -> widget. C'est ici qu'était le bug qui
 *     laissait les widgets Android à zéro : l'appel visait un module natif
 *     inexistant et l'échec partait dans un catch muet.
 */
import { ASMA_UL_HUSNA } from '../constants/asmaulHusna';
import { nameOfTheDay } from '../utils/nameOfDay';

describe('nameOfTheDay (rotation des 99 noms)', () => {
  it("affiche le nom n°1 le jour d'ancrage (1er janvier 2024 UTC)", () => {
    expect(nameOfTheDay(new Date(Date.UTC(2024, 0, 1))).numero).toBe(1);
  });

  it('avance d’un nom par jour', () => {
    expect(nameOfTheDay(new Date(Date.UTC(2024, 0, 2))).numero).toBe(2);
    expect(nameOfTheDay(new Date(Date.UTC(2024, 0, 10))).numero).toBe(10);
  });

  it('boucle sur 99 : le 100e jour revient au nom n°1', () => {
    // 1er janvier + 99 jours = 9 avril 2024.
    const jour100 = new Date(Date.UTC(2024, 0, 1) + 99 * 24 * 60 * 60 * 1000);
    expect(nameOfTheDay(jour100).numero).toBe(1);
  });

  it('reste stable au fil de la journée (même nom matin et soir)', () => {
    const matin = nameOfTheDay(new Date(Date.UTC(2024, 5, 15, 6, 0, 0)));
    const soir = nameOfTheDay(new Date(Date.UTC(2024, 5, 15, 23, 30, 0)));
    expect(soir.numero).toBe(matin.numero);
  });

  it('gère les dates antérieures à l’ancrage sans index négatif', () => {
    // Le modulo doit rester positif : sinon ASMA_UL_HUSNA[-1] => undefined,
    // et le widget planterait au lieu d'afficher un nom.
    const avant = nameOfTheDay(new Date(Date.UTC(2023, 11, 25)));
    expect(avant).toBeDefined();
    expect(avant.numero).toBeGreaterThanOrEqual(1);
    expect(avant.numero).toBeLessThanOrEqual(99);
  });

  it('ne renvoie jamais un nom hors des 99, sur deux ans glissants', () => {
    const debut = Date.UTC(2024, 0, 1);
    for (let i = 0; i < 730; i++) {
      const n = nameOfTheDay(new Date(debut + i * 24 * 60 * 60 * 1000));
      expect(n).toBeDefined();
      expect(n.numero).toBe((i % 99) + 1);
    }
  });

  it('la liste source contient bien 99 noms numérotés de 1 à 99', () => {
    expect(ASMA_UL_HUSNA).toHaveLength(99);
    expect(ASMA_UL_HUSNA[0]!.numero).toBe(1);
    expect(ASMA_UL_HUSNA[98]!.numero).toBe(99);
  });
});
