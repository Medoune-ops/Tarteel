/**
 * Billing — paiement via DexPay (mobile money : Wave, Orange Money, MTN,
 * Moov… — Afrique de l'Ouest/Centrale) ou Stripe (carte bancaire, mondial),
 * choisi par l'utilisateur (voir `PaymentProvider` + app/(app)/payment-method.tsx).
 *
 * Flux ASYNCHRONE en 2 temps, IDENTIQUE pour les deux providers :
 *  1. On demande au backend une "session de paiement" → il répond
 *     `{ reference, paymentUrl }`. Ça n'active RIEN côté serveur.
 *  2. Le front ouvre `paymentUrl` dans une WebView (voir
 *     components/DexPayCheckout.tsx, réutilisé pour Stripe Checkout — même
 *     mécanique de redirection succès/échec). L'utilisateur paie DANS cette
 *     page hébergée par le provider — le numéro de carte ne transite jamais
 *     par notre code (conformité PCI-DSS : on reste hors du scope carte).
 *  3. Le paiement réel est confirmé par un WEBHOOK côté backend, qui fait
 *     passer la Transaction de `pending` à `success`/`failed`. Le front doit
 *     POLLER `getTransaction(reference)` jusqu'à voir ce changement — la
 *     redirection n'est qu'un signal UI, jamais une preuve de paiement.
 */
import { apiFetch } from './client';
import { fetchMe } from './me';

export type PremiumPlan = 'mensuel' | 'annuel' | 'famille_mensuel' | 'famille_annuel';
/** 'dexpay' = mobile money (Afrique de l'Ouest/Centrale), 'stripe' = carte bancaire (mondial). */
export type PaymentProvider = 'dexpay' | 'stripe';

/** Réponse commune à toutes les créations de session de paiement DexPay. */
export interface CheckoutSession {
  reference: string;
  paymentUrl: string;
}

export type TransactionStatut = 'pending' | 'success' | 'failed' | 'refunded';

/** `Transaction` Prisma sérialisée — forme de GET /billing/transactions/:reference. */
export interface Transaction {
  id: string;
  userId: string;
  type: string;
  montant: number;
  devise: string;
  statut: TransactionStatut;
  providerRef: string | null;
  reference: string;
  payload: unknown;
  createdAt: string;
}

/** POST /billing/subscribe — crée une session de paiement (DexPay ou Stripe) pour l'abonnement Premium. */
export async function subscribePremium(plan: PremiumPlan, provider: PaymentProvider): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/subscribe', {
    method: 'POST',
    json: { plan, provider },
  });
}

/** POST /billing/repair-streak — crée une session de paiement (DexPay ou Stripe) pour restaurer la série cassée. */
export async function repairStreak(provider: PaymentProvider): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/repair-streak', { method: 'POST', json: { provider } });
}

/** POST /billing/hearts — crée une session de paiement (DexPay ou Stripe) pour un refill complet des cœurs. */
export async function buyHearts(provider: PaymentProvider): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/hearts', { method: 'POST', json: { provider } });
}

/**
 * GET /billing/transactions/:reference — à poller après la fermeture du popup
 * DexPay, jusqu'à ce que `statut` passe de `pending` à `success`/`failed`
 * (le webhook peut prendre quelques secondes).
 */
export async function getTransaction(reference: string): Promise<Transaction> {
  return apiFetch<Transaction>(`/billing/transactions/${reference}`);
}

/**
 * Rehydrate le store depuis le serveur — à appeler une fois qu'un paiement a
 * été confirmé (`statut === 'success'`) pour refléter immédiatement le nouvel
 * état (premium/gemmes/cœurs/streak).
 */
export async function refreshAfterPayment() {
  await fetchMe();
}
