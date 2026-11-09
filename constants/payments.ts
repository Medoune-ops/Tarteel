/**
 * Interrupteur global des moyens de paiement.
 *
 * `CARD_PAYMENTS_ENABLED = false` masque **toute** la partie carte bancaire
 * (Stripe) : ligne « Carte bancaire » de l'écran d'abonnement, choix Stripe
 * des achats rapides (cœurs, gemmes, série, foyer) et accès à l'écran
 * `payment-card` (désactivé).
 *
 * ⚠️ Mobile Money / DexPay n'est PAS concerné : il reste affiché et fonctionnel
 * partout (abonnement, cœurs, gemmes, réparation de série, plan familial).
 *
 * Passer à `true` pour réactiver la carte — aucun autre fichier à modifier.
 */
export const CARD_PAYMENTS_ENABLED = false;
