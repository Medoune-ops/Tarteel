/**
 * Récompenses : historique des podiums (top-3 hebdomadaires) et réclamation.
 *
 * GET  /me/podiums          → l'historique RÉEL de l'utilisateur (vide s'il n'a
 *                             jamais fini top-3 — on n'affiche donc jamais de
 *                             trophée non gagné).
 * POST /me/podiums/:ref/claim → crédite la récompense une seule fois.
 */
import { apiFetch } from './client';
import { fetchMe } from './me';

export type LigueTier = 'bronze' | 'argent' | 'or' | 'emeraude' | 'diamant';

export interface PodiumEntry {
  id: string; // ref stable (ex: "w23")
  semaine: number;
  ligue: LigueTier;
  rang: 1 | 2 | 3;
  xp: number; // XP accumulé cette semaine-là
  reward: number; // XP de récompense pour ce rang
  claimed: boolean;
}

/** GET /me/podiums — historique réel des podiums de l'utilisateur. */
export async function fetchPodiums(): Promise<PodiumEntry[]> {
  const data = await apiFetch<{ podiums: PodiumEntry[] }>('/me/podiums');
  return data.podiums;
}

/**
 * POST /me/podiums/:ref/claim — réclame la récompense d'un podium (1 seule fois).
 * L'XP est crédité côté serveur ; on ré-hydrate le store via /me pour refléter
 * le nouveau total. Renvoie l'XP gagné.
 */
export async function claimPodium(ref: string): Promise<number> {
  const res = await apiFetch<{ xpGained: number; totalXp: number; ref: string }>(
    `/me/podiums/${ref}/claim`,
    { method: 'POST' },
  );
  await fetchMe(); // met à jour l'XP dans le store
  return res.xpGained;
}

// ─── Coffre quotidien (serveur-autoritaire) ─────────────────────────────────
// Le tirage est fait CÔTÉ SERVEUR (1×/jour local). Si le tirage donne des
// cœurs alors qu'ils sont déjà pleins (ou premium), le serveur convertit en
// gemmes — le coffre n'est jamais « pour rien ».

export type DailyChestReward =
  | { type: 'xp'; amount: number }
  | { type: 'hearts'; amount: number }
  | { type: 'gems'; amount: number };

/** GET /me/daily-chest — le coffre est-il encore disponible aujourd'hui ? */
export async function fetchDailyChestAvailable(): Promise<boolean> {
  const data = await apiFetch<{ available: boolean }>('/me/daily-chest');
  return data.available;
}

/**
 * POST /me/daily-chest/claim — ouvre le coffre (1×/jour local). Rehydrate le
 * store depuis /me (XP / cœurs / gemmes à jour). Renvoie la récompense tirée,
 * ou null si déjà réclamé aujourd'hui (409).
 */
export async function claimDailyChestApi(): Promise<DailyChestReward | null> {
  try {
    const res = await apiFetch<{ reward: DailyChestReward }>('/me/daily-chest/claim', {
      method: 'POST',
    });
    await fetchMe();
    return res.reward;
  } catch {
    return null;
  }
}
