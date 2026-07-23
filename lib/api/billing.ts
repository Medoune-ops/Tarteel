/**
 * Billing — paiement carte via DexPay (DEXCHANGE PAY, https://dexpay.africa).
 *
 * Flux ASYNCHRONE en 2 temps :
 *  1. On demande au backend une "session de paiement" → il répond
 *     `{ reference, paymentUrl }`. Ça n'active RIEN côté serveur.
 *  2. Le front ouvre `paymentUrl` dans le SDK DexPay (WebView, voir
 *     components/DexPayCheckout.tsx). L'utilisateur paie sa carte DANS le
 *     popup DexPay — le numéro de carte ne transite jamais par notre code
 *     (conformité PCI-DSS : on reste hors du scope carte).
 *  3. Le paiement réel est confirmé par un WEBHOOK côté backend, qui fait
 *     passer la Transaction de `pending` à `success`/`failed`. Le front doit
 *     POLLER `getTransaction(reference)` jusqu'à voir ce changement — le
 *     callback `onSuccess` du SDK n'est qu'un signal UI, jamais une preuve
 *     de paiement.
 */
import { apiFetch } from './client';
import { fetchMe } from './me';

export type PremiumPlan = 'mensuel' | 'annuel' | 'famille_mensuel' | 'famille_annuel';

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

/** POST /billing/subscribe — crée une session de paiement DexPay pour l'abonnement Premium. */
export async function subscribePremium(plan: PremiumPlan): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/subscribe', {
    method: 'POST',
    json: { plan },
  });
}

/** POST /billing/repair-streak — crée une session de paiement pour restaurer la série cassée. */
export async function repairStreak(): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/repair-streak', { method: 'POST' });
}

/** POST /billing/hearts — crée une session de paiement pour un refill complet des cœurs. */
export async function buyHearts(): Promise<CheckoutSession> {
  return apiFetch<CheckoutSession>('/billing/hearts', { method: 'POST' });
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
