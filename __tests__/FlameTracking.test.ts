/**
 * Suivi de la flamme pour les widgets « Série éteinte ».
 *
 * Le widget ne relit que ce suivi : une série perdue mal enregistrée laisserait
 * le widget afficher une flamme allumée (ou l'inverse) sans que rien ne le dise.
 */
import { localDay, trackFlame } from '../utils/flameTracking';

const vide = { streak: 0, streakDay: null, lostStreak: 0, lostStreakDay: null };

describe('trackFlame', () => {
  it('formate le jour local en YYYY-MM-DD', () => {
    expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
  });

  it('note le jour quand la série progresse', () => {
    const r = trackFlame({ ...vide, streak: 16, streakDay: '2026-10-20' }, 17, '2026-10-21');
    expect(r).toEqual({ streakDay: '2026-10-21', lostStreak: 0, lostStreakDay: null });
  });

  it('garde le jour quand la série ne bouge pas', () => {
    const r = trackFlame({ ...vide, streak: 17, streakDay: '2026-10-21' }, 17, '2026-10-22');
    expect(r.streakDay).toBe('2026-10-21');
  });

  it('suppose aujourd’hui pour un compte suivi pour la première fois', () => {
    const r = trackFlame({ ...vide, streak: 17 }, 17, '2026-10-22');
    expect(r.streakDay).toBe('2026-10-22');
  });

  it('retient la série perdue et le jour où la flamme s’est éteinte', () => {
    const r = trackFlame({ ...vide, streak: 17, streakDay: '2026-10-21' }, 0, '2026-10-26');
    expect(r.lostStreak).toBe(17);
    // Dernière lecture le 21, rien le 22 : éteinte le 23.
    expect(r.lostStreakDay).toBe('2026-10-23');
    expect(r.streakDay).toBe('2026-10-21');
  });

  it('oublie la série perdue dès que la flamme repart', () => {
    const perdu = { streak: 0, streakDay: '2026-10-21', lostStreak: 17, lostStreakDay: '2026-10-23' };
    expect(trackFlame(perdu, 1, '2026-10-26')).toEqual({ streakDay: '2026-10-26', lostStreak: 0, lostStreakDay: null });
  });

  it('ne change rien tant que la série reste à zéro', () => {
    const perdu = { streak: 0, streakDay: '2026-10-21', lostStreak: 17, lostStreakDay: '2026-10-23' };
    expect(trackFlame(perdu, 0, '2026-10-30')).toEqual({ streakDay: '2026-10-21', lostStreak: 17, lostStreakDay: '2026-10-23' });
  });
});
