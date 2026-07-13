/**
 * ══════════════ POINT DE BRANCHEMENT DE L'API DE PAIEMENT ══════════════
 *
 * Toute l'app paie via `getPaymentProvider()` — c'est LE seul endroit à
 * modifier quand notre API de paiement sera prête :
 *
 *   1. Implémente `PaymentProvider` (Stripe PaymentSheet, RevenueCat,
 *      Wave/Orange Money…) : collecte le paiement et renvoie un
 *      `paymentToken` vérifiable côté serveur.
 *   2. Remplace `mockProvider` dans `getPaymentProvider()`.
 *   3. Côté backend, `POST /billing/subscribe` reçoit ce `paymentToken` et
 *      le vérifie auprès du provider avant d'activer l'abonnement (la
 *      couture serveur est `charge()` dans billing.service.ts).
 *
 * Les écrans de paiement (payment-method, payment-card) ne connaissent que
 * cette interface — rien d'autre à changer chez eux.
 */

export type PaymentMethodKind = 'apple' | 'google' | 'card';

export interface PaymentResult {
  ok: boolean;
  /** Preuve de paiement à transmettre au backend pour vérification. */
  paymentToken?: string;
  /** Message d'erreur affichable quand ok=false. */
  error?: string;
}

export interface PaymentProvider {
  /**
   * Collecte le paiement de l'abonnement auprès de l'utilisateur.
   * Doit ouvrir l'UI du provider (PaymentSheet, Apple Pay…) si nécessaire.
   */
  payPremium(plan: 'mensuel' | 'annuel' | 'famille_mensuel' | 'famille_annuel', method: PaymentMethodKind): Promise<PaymentResult>;
}

/**
 * Provider MOCK — développement uniquement. Ne collecte RIEN : il renvoie un
 * jeton factice que le backend (provider mock lui aussi) accepte. Aucun débit
 * réel n'a lieu, et rien de tout ceci ne doit survivre au branchement de la
 * vraie API de paiement.
 */
const mockProvider: PaymentProvider = {
  async payPremium() {
    return { ok: true, paymentToken: `mock_client_${Date.now().toString(36)}` };
  },
};

/** Le provider actif. ⇦ REMPLACER par la vraie implémentation au branchement. */
export function getPaymentProvider(): PaymentProvider {
  return mockProvider;
}
