import { RECITERS, DEFAULT_RECITER_ID, reciterById, surahAudioUrl } from '../constants/reciters';

describe('Données récitateurs (Coran audio)', () => {
  it('propose 4 récitateurs (dont Mishary Alafasy)', () => {
    expect(RECITERS).toHaveLength(4);
    expect(RECITERS.map((r) => r.id)).toEqual(['basit', 'sudais', 'salami', 'afasy']);
    expect(RECITERS.find((r) => r.id === 'afasy')?.nom).toContain('Mishary');
  });

  it('toutes les baseUrl sont en https et finissent par /', () => {
    for (const r of RECITERS) {
      expect(r.baseUrl.startsWith('https://')).toBe(true);
      expect(r.baseUrl.endsWith('/')).toBe(true);
    }
  });

  it('construit l’URL audio avec le numéro sur 3 chiffres', () => {
    expect(surahAudioUrl('https://x/', 1)).toBe('https://x/001.mp3');
    expect(surahAudioUrl('https://x/', 36)).toBe('https://x/036.mp3');
    expect(surahAudioUrl('https://x/', 114)).toBe('https://x/114.mp3');
  });

  it('reciterById renvoie le bon récitateur, sinon le premier', () => {
    expect(reciterById('sudais').nom).toBe('Cheikh Sudais');
    expect(reciterById('inconnu').id).toBe(RECITERS[0].id);
    expect(DEFAULT_RECITER_ID).toBe('basit');
  });
});
