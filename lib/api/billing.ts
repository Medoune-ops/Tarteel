/**
 * Billing — activation de l'entitlement Premium côté SERVEUR.
 *
 * Le paiement lui-même est collecté AVANT, par le `PaymentProvider`
 * (lib/payments.ts — point de branchement de notre future API de paiement) ;
 * on transmet ici le `paymentToken` obtenu, que le backend vérifiera auprès
 * du provider avant d'activer isPremium/premiumUntil. Tant que le provider
 * est mock des deux côtés, le jeton est factice et accepté (dev only).
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
export async function subscribePremium(
  plan: PremiumPlan,
  paymentToken?: string,
): Promise<SubscribeResult> {
  const res = await apiFetch<SubscribeResult>('/billing/subscribe', {
    method: 'POST',
    json: { plan, ...(paymentToken ? { paymentToken } : {}) },
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
