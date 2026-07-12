import { fatihaFirstThenDesc } from '../constants/sourateOrder';

describe('Ordre des sourates (Al-Fatiha en tête, puis décroissant)', () => {
  it('met Al-Fatiha (1) en tête puis le reste en décroissant', () => {
    const input = [{ numero: 1 }, { numero: 2 }, { numero: 5 }, { numero: 114 }];
    expect(fatihaFirstThenDesc(input).map((s) => s.numero)).toEqual([1, 114, 5, 2]);
  });

  it('sans Al-Fatiha : uniquement décroissant', () => {
    expect(fatihaFirstThenDesc([{ numero: 3 }, { numero: 7 }, { numero: 2 }]).map((s) => s.numero)).toEqual([7, 3, 2]);
  });

  it('gère la liste vide', () => {
    expect(fatihaFirstThenDesc([])).toEqual([]);
  });

  it('ne mute pas la liste d’entrée', () => {
    const input = [{ numero: 2 }, { numero: 1 }, { numero: 3 }];
    fatihaFirstThenDesc(input);
    expect(input.map((s) => s.numero)).toEqual([2, 1, 3]);
  });
});
