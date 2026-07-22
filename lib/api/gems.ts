/**
 * Économie de gemmes — tout est jugé et débité CÔTÉ SERVEUR (solde, coûts,
 * plafonds). Après chaque action on rehydrate le store via GET /me pour que
 * l'UI reflète la source de vérité.
 *
 * Portes de sortie quand cœurs = 0 (ordre d'affichage de la spec) :
 *   1. Réviser pour regagner : POST /me/hearts/review-regain (+1 cœur, max 2/j, gratuit)
 *   2. Attendre (compte à rebours local)
 *   3. Refill gemmes : POST /me/hearts/refill (5 cœurs = 350 gemmes)
 *   4. Premium (cœurs illimités)
 */
import { apiFetch } from './client';
import { fetchMe } from './me';

export interface GemLedgerEntry {
  id: string;
  amount: number;
  reason:
    | 'lesson_complete'
    | 'lesson_perfect'
    | 'daily_streak'
    | 'streak_bonus'
    | 'league_promotion'
    | 'pack_purchase'
    | 'heart_refill'
    | 'streak_freeze'
    | 'double_xp';
  ref: string | null;
  createdAt: string;
}

export interface GemsStatus {
  gems: number;
  streakFreezes: number;
  doubleXpUntil: string | null;
  doubleXpActive: boolean;
  transactions: GemLedgerEntry[];
}

/** GET /me/gems — solde + dernières écritures du ledger. */
export async function fetchGems(): Promise<GemsStatus> {
  return apiFetch<GemsStatus>('/me/gems');
}

/** POST /me/hearts/refill — 5 cœurs instantanés pour 350 gemmes. */
export async function refillHeartsWithGems() {
  const res = await apiFetch<{ gems: number; hearts: number }>('/me/hearts/refill', {
    method: 'POST',
  });
  await fetchMe(); // rehydrate cœurs + gemmes
  return res;
}

/**
 * POST /me/hearts/review-regain — session de révision terminée → +1 cœur
 * (max 2/j). Le serveur vérifie qu'une session récente existe vraiment pour
 * cette sourate (POST /me/revisions/:numero/review) avant d'accorder le cœur.
 * `numero` = numéro de la sourate (1–114) dont la session vient d'être terminée.
 */
export async function reviewRegainHeart(numero: number) {
  const res = await apiFetch<{ hearts: number; reviewHeartsRemaining: number }>(
    '/me/hearts/review-regain',
    { method: 'POST', json: { numero } },
  );
  await fetchMe();
  return res;
}

/** POST /me/streak-freezes — achète un gel de streak (200 gemmes, max 2). */
export async function buyStreakFreeze() {
  const res = await apiFetch<{ gems: number; streakFreezes: number }>('/me/streak-freezes', {
    method: 'POST',
  });
  await fetchMe();
  return res;
}

/** POST /me/boosts/double-xp — XP ×2 pendant 15 min (100 gemmes). */
export async function buyDoubleXp() {
  const res = await apiFetch<{ gems: number; doubleXpUntil: string }>('/me/boosts/double-xp', {
    method: 'POST',
  });
  await fetchMe();
  return res;
}

export type GemPackId = 'p500' | 'p3000' | 'p7000';

/**
 * POST /billing/gems — crée une session de paiement DexPay pour un pack de
 * gemmes. Ne crédite RIEN immédiatement : il faut ouvrir `paymentUrl` dans le
 * checkout DexPay (voir components/DexPayCheckout.tsx) puis poller
 * `getTransaction(reference)` (lib/api/billing.ts) jusqu'à confirmation.
 */
export async function buyGemPack(pack: GemPackId): Promise<{ reference: string; paymentUrl: string }> {
  return apiFetch<{ reference: string; paymentUrl: string }>('/billing/gems', {
    method: 'POST',
    json: { pack },
  });
}
