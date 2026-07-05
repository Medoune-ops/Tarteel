/**
 * Billing — Premium & gemmes. Le PROVIDER est mock côté backend (le paiement
 * réussit toujours, aucun débit réel), mais l'entitlement est réel : le
 * serveur active isPremium/premiumUntil, et c'est LUI qui applique cœurs
 * illimités + XP ×2. Sans cet appel, un `setPremium(true)` local serait
 * écrasé au prochain GET /me.
 *
 * À brancher sur RevenueCat/Stripe plus tard : seul le backend change,
 * ce contrat reste identique.
 */
import { apiFetch } from './client';
import { fetchMe } from './me';

export type PremiumPlan = 'mensuel' | 'annuel';

export interface SubscribeResult {
  isPremium: boolean;
  premiumUntil: string | null;
  plan: PremiumPlan;
}

/** POST /billing/subscribe — active Premium côté serveur puis rehydrate. */
export async function subscribePremium(plan: PremiumPlan): Promise<SubscribeResult> {
  const res = await apiFetch<SubscribeResult>('/billing/subscribe', {
    method: 'POST',
    json: { plan },
  });
  await fetchMe(); // isPremium/hearts/xp désormais servis par le serveur
  return res;
}

/** POST /billing/repair-streak — restaure la série cassée (payant). */
export async function repairStreak(): Promise<{ streak: number }> {
  const res = await apiFetch<{ streak: number }>('/billing/repair-streak', {
    method: 'POST',
  });
  await fetchMe();
  return res;
}
