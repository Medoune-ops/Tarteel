/**
 * Horaires embarqués pour les widgets « Heures de prière ».
 *
 * Le widget ne peut pas recalculer (adhan est en JS) : il se fie entièrement
 * à cette liste. Un ordre faux ou un jour manquant afficherait une mauvaise
 * « prochaine prière » sur l'écran d'accueil, sans que rien ne le signale.
 */
import { buildPrayerWidgetData, PRAYER_WIDGET_DAYS } from '../utils/widgetData';

// Dakar.
const LAT = 14.6928;
const LNG = -17.4467;

describe('buildPrayerWidgetData', () => {
  const now = new Date(2026, 9, 25, 10, 44);
  const data = buildPrayerWidgetData(LAT, LNG, 'Dakar', now);

  it('donne 6 créneaux par jour sur toute la fenêtre', () => {
    expect(data.slots).toHaveLength(PRAYER_WIDGET_DAYS * 6);
  });

  it('suit l’ordre du jour : Fajr, Chourouq, Dhuhr, Asr, Maghrib, Isha', () => {
    expect(data.slots.slice(0, 6).map((s) => s.k)).toEqual(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha']);
  });

  it('a des horaires strictement croissants (aucun jour sauté ni doublé)', () => {
    for (let i = 1; i < data.slots.length; i++) {
      expect(data.slots[i]!.t).toBeGreaterThan(data.slots[i - 1]!.t);
    }
  });

  it('commence aujourd’hui (jour local)', () => {
    const first = new Date(data.slots[0]!.t * 1000);
    expect(first.getDate()).toBe(now.getDate());
  });

  it('garde la ville et arrondit la Qibla', () => {
    expect(data.city).toBe('Dakar');
    expect(Number.isInteger(data.qibla)).toBe(true);
    // Depuis Dakar, La Mecque est à l'est-nord-est.
    expect(data.qibla).toBeGreaterThan(50);
    expect(data.qibla).toBeLessThan(90);
  });
});
