/**
 * Barème central des récompenses (XP, cadeaux).
 * Source unique de vérité — calibré sur l'économie de l'app :
 *   1 leçon ≈ 25–35 XP · 1 journée active ≈ 60 XP · 1 niveau = 2000 XP.
 */

// ─── Cadeau d'objectif de série ──────────────────────────────────────────────
// Non-linéaire : les gros objectifs récompensent PLUS que proportionnellement,
// pour donner envie de viser loin (365 j ≫ 12 × l'objectif « 30 »).
const STREAK_REWARD_TABLE: { days: number; xp: number }[] = [
  { days: 7,   xp: 100 },
  { days: 14,  xp: 250 },
  { days: 30,  xp: 600 },
  { days: 50,  xp: 1200 },
  { days: 100, xp: 2500 },
  { days: 365, xp: 10000 },
];

/**
 * XP offerts pour un objectif de série atteint.
 * - paliers connus → valeur de la table ;
 * - valeurs intermédiaires/personnalisées → interpolation linéaire (≈ 20 XP/jour
 *   en bas, l'effet « bonus » venant des paliers hauts).
 */
export function streakReward(days: number): number {
  if (days <= 0) return 0;
  const table = STREAK_REWARD_TABLE;
  if (days <= table[0].days) return Math.round((days / table[0].days) * table[0].xp);
  for (let i = 1; i < table.length; i++) {
    if (days <= table[i].days) {
      const a = table[i - 1], b = table[i];
      const t = (days - a.days) / (b.days - a.days);
      return Math.round(a.xp + t * (b.xp - a.xp));
    }
  }
  // Au-delà de 365 : on prolonge au rythme du dernier segment (~30 XP/jour).
  const last = table[table.length - 1];
  return Math.round(last.xp + (days - last.days) * 30);
}

// ─── Récompense de podium (fin de semaine en ligue) ──────────────────────────
export const PODIUM_REWARD: Record<1 | 2 | 3, number> = {
  1: 500,
  2: 300,
  3: 150,
};

// ─── Coffre quotidien (récompense de connexion) ──────────────────────────────
/** Une récompense possible du coffre quotidien. */
export type DailyChestReward =
  | { type: 'xp'; amount: number }
  | { type: 'hearts'; amount: number };

const DAILY_CHEST_POOL: DailyChestReward[] = [
  { type: 'xp', amount: 10 },
  { type: 'xp', amount: 20 },
  { type: 'xp', amount: 30 },
  { type: 'xp', amount: 50 },
  { type: 'hearts', amount: 1 },
  { type: 'hearts', amount: 2 },
];

/** Tire une récompense aléatoire du coffre quotidien. */
export function rollDailyChest(): DailyChestReward {
  return DAILY_CHEST_POOL[Math.floor(Math.random() * DAILY_CHEST_POOL.length)];
}
