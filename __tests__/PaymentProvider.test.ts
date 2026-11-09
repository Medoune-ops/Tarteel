/**
 * Choix du moyen de paiement pour les achats rapides.
 *
 * Tant que la carte est masquée, `askPaymentProvider()` doit résoudre
 * directement `'dexpay'` (Mobile Money) — sans popup, et sans jamais proposer
 * Stripe. Le checkout DexPay s'affiche ensuite normalement.
 */
import { askPaymentProvider } from '../utils/askPaymentProvider';
import { CARD_PAYMENTS_ENABLED } from '../constants/payments';

describe('askPaymentProvider', () => {
  it('résout directement DexPay quand la carte est masquée', async () => {
    expect(CARD_PAYMENTS_ENABLED).toBe(false);
    await expect(askPaymentProvider()).resolves.toBe('dexpay');
  });
});
