/**
 * Suivi de la flamme pour les widgets Série.
 *
 * Le widget ne voit l'app que par le JSON qu'elle lui laisse : si l'utilisateur
 * ne la rouvre pas, la série écrite reste figée (ex. 17) alors qu'elle s'est
 * éteinte côté serveur. On lui donne donc de quoi le déduire seul : le dernier
 * jour où la série a progressé, la série perdue et le jour de la perte.
 */

/** Jour local au format YYYY-MM-DD (le widget découpe les jours dans le même fuseau). */
export function localDay(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${j}`;
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return localDay(new Date(y!, m! - 1, d! + n, 12));
}

export interface FlameTrack {
  /** Dernier jour où la série a progressé (null : inconnu, compte antérieur au suivi). */
  streakDay: string | null;
  /** Série qui vient de s'éteindre (0 : rien à afficher). */
  lostStreak: number;
  /** Jour où la flamme s'est éteinte. */
  lostStreakDay: string | null;
}

/** Met à jour le suivi quand la série passe de `prev` à `next`. Pure. */
export function trackFlame(
  prev: FlameTrack & { streak: number },
  next: number,
  today: string = localDay(),
): FlameTrack {
  if (next > 0) {
    // Série en cours (nouvelle, restaurée ou continuée) : plus rien de perdu.
    const progressed = next > prev.streak;
    return {
      streakDay: progressed || prev.streakDay == null ? today : prev.streakDay,
      lostStreak: 0,
      lostStreakDay: null,
    };
  }
  if (prev.streak > 0) {
    // La flamme s'éteint à la fin du lendemain du dernier jour lu : c'est ce
    // jour-là que le widget a commencé à afficher « Série éteinte ».
    const guessed = prev.streakDay ? addDays(prev.streakDay, 2) : today;
    return {
      streakDay: prev.streakDay,
      lostStreak: prev.streak,
      lostStreakDay: guessed < today ? guessed : today,
    };
  }
  return { streakDay: prev.streakDay, lostStreak: prev.lostStreak, lostStreakDay: prev.lostStreakDay };
}
