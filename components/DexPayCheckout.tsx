/**
 * Checkout carte via DexPay (DEXCHANGE PAY) — la WebView charge `paymentUrl`
 * DIRECTEMENT, en occupant tout l'écran (navigation top-level), PAS dans un
 * cadre/iframe embarqué.
 *
 * Pourquoi pas le SDK popup officiel (`dexpay.js`) : la page de paiement
 * DexPay envoie `Content-Security-Policy: frame-ancestors 'none'` et
 * `X-Frame-Options: DENY` — elle refuse EXPLICITEMENT d'être affichée dans
 * une iframe, quel que soit le site qui l'embarque (protection anti-
 * clickjacking standard sur une page de paiement). Le SDK charge cette page
 * dans une iframe interne : le navigateur bloque silencieusement ce
 * chargement, d'où un écran qui tourne puis échoue sans jamais rien afficher.
 * En chargeant `paymentUrl` en navigation directe (toute la WebView, pas un
 * cadre à l'intérieur), on respecte cette règle et DexPay s'affiche.
 *
 * Le numéro de carte ne transite JAMAIS par notre code : il reste dans la
 * page DexPay affichée par la WebView (conformité PCI-DSS).
 *
 * Flux :
 *  1. La WebView charge `paymentUrl` (reçu de POST /billing/*) directement.
 *  2. On surveille la navigation (`onNavigationStateChange`) : DexPay
 *     redirige vers `success_url`/`failure_url` (nos pages
 *     dexpay.pages.ts) une fois le paiement terminé/annulé côté DexPay.
 *     Ce n'est qu'un SIGNAL UI — jamais une confirmation de paiement.
 *  3. Sur la redirection success, on POLLE `GET /billing/transactions/:reference`
 *     (toutes les POLL_INTERVAL_MS, jusqu'à POLL_TIMEOUT_MS) jusqu'à ce que
 *     `statut` devienne `success` ou `failed` — c'est le webhook, pas la
 *     redirection, qui fait foi.
 *  4. Sur `success`, on rehydrate le store (`refreshAfterPayment`) puis on
 *     notifie le parent via `onDone`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Modal, Linking } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { getTransaction, refreshAfterPayment, type TransactionStatut } from '../lib/api/billing';
import { useT } from '../lib/i18n';

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

type Phase = 'checkout' | 'verifying' | 'success' | 'failed' | 'cancelled';

interface DexPayCheckoutProps {
  visible: boolean;
  paymentUrl: string;
  reference: string;
  /** Appelé quand l'écran doit se fermer. `outcome` = résultat final observé. */
  onDone: (outcome: 'success' | 'failed' | 'cancelled') => void;
}

export default function DexPayCheckout({ visible, paymentUrl, reference, onDone }: DexPayCheckoutProps) {
  const tr = useT();
  const [phase, setPhase] = useState<Phase>('checkout');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef<number>(0);
  const redirected = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Réinitialise l'état à chaque nouvelle ouverture (une session par référence).
  useEffect(() => {
    if (visible) {
      setPhase('checkout');
      redirected.current = false;
    }
    return stopPolling;
  }, [visible, reference, stopPolling]);

  const finish = useCallback(
    (outcome: 'success' | 'failed' | 'cancelled') => {
      stopPolling();
      onDone(outcome);
    },
    [onDone, stopPolling],
  );

  // Poll GET /billing/transactions/:reference jusqu'à statut final ou timeout.
  const startPolling = useCallback(() => {
    setPhase('verifying');
    pollDeadline.current = Date.now() + POLL_TIMEOUT_MS;

    const check = async () => {
      try {
        const txn = await getTransaction(reference);
        const statut: TransactionStatut = txn.statut;
        if (statut === 'success') {
          stopPolling();
          await refreshAfterPayment().catch(() => {});
          setPhase('success');
          return;
        }
        if (statut === 'failed') {
          stopPolling();
          setPhase('failed');
          return;
        }
        // 'pending' / 'refunded' → on continue tant qu'on n'a pas dépassé le délai.
        if (Date.now() >= pollDeadline.current) {
          stopPolling();
          setPhase('failed');
        }
      } catch {
        // Erreur réseau ponctuelle : on retentera au prochain tick, sauf timeout.
        if (Date.now() >= pollDeadline.current) {
          stopPolling();
          setPhase('failed');
        }
      }
    };

    check(); // premier check immédiat
    pollTimer.current = setInterval(check, POLL_INTERVAL_MS);
  }, [reference, stopPolling]);

  // DexPay redirige vers success_url/failure_url (dexpay.pages.ts côté
  // backend) une fois le paiement terminé côté DexPay — un simple SIGNAL UI,
  // jamais une confirmation de paiement (voir doc DexPay : le webhook fait foi).
  const handleNavigationStateChange = useCallback(
    (nav: WebViewNavigation) => {
      if (redirected.current) return;
      if (nav.url.includes('/billing/dexpay/success')) {
        redirected.current = true;
        startPolling();
      } else if (nav.url.includes('/billing/dexpay/failure')) {
        redirected.current = true;
        setPhase('cancelled');
      }
    },
    [startPolling],
  );

  // Les moyens de paiement mobiles (Wave, Orange Money…) redirigent vers un
  // schéma d'app custom (`wave://`, `orange-money://`…) que la WebView ne sait
  // PAS charger (elle ne gère que http/https), d'où « Can't open url ». On
  // intercepte ces schémas et on les délègue au système via Linking, qui ouvre
  // l'app correspondante (ou le store si elle n'est pas installée). On laisse
  // la WebView charger normalement tout ce qui est http(s).
  const handleShouldStartLoad = useCallback((req: WebViewNavigation) => {
    const url = req.url;
    if (__DEV__) console.log('[DexPayCheckout] shouldStartLoad:', url);
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('about:')) {
      return true; // navigation web normale : la WebView s'en charge
    }
    // Schéma custom (wave://, tel:…) → on le délègue au système. Wave encode le
    // deep link sous la forme `wave://capture/https://pay.wave.com/...` : on
    // ouvre en PRIORITÉ l'URL https embarquée (universal link) — l'OS la route
    // vers l'app Wave si installée, sinon vers la page de paiement web —, et on
    // retombe sur le schéma brut si l'extraction ne donne rien.
    const embedded = url.match(/https?:\/\/[^\s]+/)?.[0];
    const target = embedded ?? url;
    Linking.openURL(target).catch(() => {
      // Cible indisponible : on tente le schéma brut en dernier recours.
      if (embedded) {
        Linking.openURL(url).catch(() => {
          if (__DEV__) console.warn('[DexPayCheckout] impossible d’ouvrir:', url);
        });
      } else if (__DEV__) {
        console.warn('[DexPayCheckout] impossible d’ouvrir le schéma:', url);
      }
    });
    return false; // on empêche la WebView de tenter (et d’échouer sur) ce schéma
  }, []);

  const renderOverlay = () => {
    if (phase === 'verifying') {
      return (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#F0820C" />
          <Text style={styles.overlayTitle}>{tr('dexpay.verifying')}</Text>
          <Text style={styles.overlayHint}>{tr('dexpay.verifyingHint')}</Text>
        </View>
      );
    }
    if (phase === 'success') {
      return (
        <View style={styles.overlay}>
          <View style={[styles.iconCircle, { backgroundColor: '#34C72422' }]}>
            <Feather name="check" size={32} color="#34C724" />
          </View>
          <Text style={styles.overlayTitle}>{tr('dexpay.successTitle')}</Text>
          <Text style={styles.overlayHint}>{tr('dexpay.successHint')}</Text>
          <Pressable style={styles.doneBtn} onPress={() => finish('success')}>
            <Text style={styles.doneBtnText}>{tr('dexpay.continue')}</Text>
          </Pressable>
        </View>
      );
    }
    if (phase === 'failed') {
      return (
        <View style={styles.overlay}>
          <View style={[styles.iconCircle, { backgroundColor: '#FF4B4B22' }]}>
            <Feather name="x" size={32} color="#FF4B4B" />
          </View>
          <Text style={styles.overlayTitle}>{tr('dexpay.failedTitle')}</Text>
          <Text style={styles.overlayHint}>{tr('dexpay.failedHint')}</Text>
          <Pressable style={[styles.doneBtn, { backgroundColor: '#8A8F99' }]} onPress={() => finish('failed')}>
            <Text style={styles.doneBtnText}>{tr('dexpay.close')}</Text>
          </Pressable>
        </View>
      );
    }
    if (phase === 'cancelled') {
      return (
        <View style={styles.overlay}>
          <View style={[styles.iconCircle, { backgroundColor: '#8A8F9922' }]}>
            <Feather name="slash" size={32} color="#8A8F99" />
          </View>
          <Text style={styles.overlayTitle}>{tr('dexpay.cancelledTitle')}</Text>
          <Pressable style={[styles.doneBtn, { backgroundColor: '#8A8F99' }]} onPress={() => finish('cancelled')}>
            <Text style={styles.doneBtnText}>{tr('dexpay.close')}</Text>
          </Pressable>
        </View>
      );
    }
    return null;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => finish('cancelled')}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            onPress={() => finish(phase === 'success' ? 'success' : 'cancelled')}
            hitSlop={10}
            style={styles.closeBtn}
          >
            <Feather name="x" size={22} color="#1B2333" />
          </Pressable>
          <Text style={styles.headerTitle}>{tr('dexpay.headerTitle')}</Text>
          <View style={{ width: 22 }} />
        </View>

        {phase === 'checkout' ? (
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            style={styles.webview}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            onError={(e) => {
              if (__DEV__) console.warn('[DexPayCheckout] WebView load error:', e.nativeEvent);
              setPhase('failed');
            }}
            onHttpError={(e) => {
              if (__DEV__) console.warn('[DexPayCheckout] WebView HTTP error:', e.nativeEvent);
            }}
            renderLoading={() => (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#F0820C" />
              </View>
            )}
          />
        ) : (
          renderOverlay()
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#F0F1F4',
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#1B2333' },
  webview: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  overlayTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#1B2333', textAlign: 'center' },
  overlayHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center' },
  doneBtn: {
    marginTop: 18, backgroundColor: '#F0820C', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  doneBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
});
