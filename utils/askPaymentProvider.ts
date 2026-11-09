import { Alert } from 'react-native';
import type { PaymentProvider } from '../lib/api/billing';
import { t } from '../lib/i18n';
import { CARD_PAYMENTS_ENABLED } from '../constants/payments';

/**
 * Demande à l'utilisateur son mode de paiement (Mobile Money via DexPay ou
 * carte bancaire via Stripe) via un popup natif à 2 boutons, pour les achats
 * rapides à un seul CTA (cœurs, gemmes, réparation de série, abonnement
 * familial) — contrairement à l'abonnement premium individuel qui a son
 * propre écran dédié (app/(app)/payment-method.tsx).
 *
 * Quand la carte est masquée (`CARD_PAYMENTS_ENABLED = false`), DexPay est le
 * seul moyen : on résout directement `'dexpay'` sans popup. Le checkout DexPay
 * s'affiche alors immédiatement — Mobile Money reste donc bien proposé.
 *
 * Résout `null` si l'utilisateur annule (pas de bouton "Annuler" explicite
 * ici : le popup se ferme sans résoudre tant qu'aucun choix n'est fait, donc
 * en pratique `null` n'arrive que si Alert.alert n'affiche rien, ex: web).
 */
export function askPaymentProvider(): Promise<PaymentProvider | null> {
  if (!CARD_PAYMENTS_ENABLED) return Promise.resolve('dexpay');
  return new Promise((resolve) => {
    Alert.alert(
      t('paymentProvider.title'),
      t('paymentProvider.message'),
      [
        { text: t('paymentProvider.mobileMoney'), onPress: () => resolve('dexpay') },
        { text: t('paymentProvider.card'), onPress: () => resolve('stripe') },
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
