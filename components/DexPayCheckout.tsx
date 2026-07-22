/**
 * Checkout carte via DexPay (DEXCHANGE PAY) — WebView chargeant le SDK JS
 * officiel (`dexpay.js`) dans une page HTML minimale, en mode carte
 * UNIQUEMENT (`paymentMethod: 'card'`, pas de mobile money).
 *
 * Le numéro de carte ne transite JAMAIS par notre code : il reste dans
 * l'iframe DexPay à l'intérieur de la WebView (conformité PCI-DSS).
 *
 * Flux :
 *  1. La WebView charge `paymentUrl` (reçu de POST /billing/*) via
 *     `DexPay.checkout(...)`.
 *  2. `onSuccess`/`onCancel`/`onError` du SDK ne sont que des signaux UI —
 *     JAMAIS une confirmation de paiement. On les utilise pour piloter
 *     l'affichage (fermer la WebView, afficher un état).
 *  3. Après `onSuccess`, on POLLE `GET /billing/transactions/:reference`
 *     (toutes les POLL_INTERVAL_MS, jusqu'à POLL_TIMEOUT_MS) jusqu'à ce que
 *     `statut` devienne `success` ou `failed` — c'est le webhook, pas le
 *     popup, qui fait foi.
 *  4. Sur `success`, on rehydrate le store (`refreshAfterPayment`) puis on
 *     notifie le parent via `onDone`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
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

function buildHtml(paymentUrl: string): string {
  // Le SDK DexPay attend d'être chargé dans une vraie page web ; on lui
  // injecte le paymentUrl reçu du backend et on relaie ses callbacks au RN
  // via `window.ReactNativeWebView.postMessage`.
  const safeUrl = JSON.stringify(paymentUrl);
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>html,body{margin:0;padding:0;background:#fff;height:100%;}</style>
</head>
<body>
<script src="https://checkout.dexpay.africa/dexpay.js"></script>
<script>
  function post(msg) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
  }
  try {
    DexPay.checkout({
      paymentUrl: ${safeUrl},
      paymentMethod: 'card',
      onReady: function () { post({ type: 'ready' }); },
      onSuccess: function (data) { post({ type: 'success', data: data }); },
      onCancel: function () { post({ type: 'cancel' }); },
      onError: function (data) { post({ type: 'error', data: data }); },
      onClose: function () { post({ type: 'close' }); },
    });
  } catch (e) {
    post({ type: 'error', data: { message: String(e) } });
  }
</script>
</body>
</html>`;
}

export default function DexPayCheckout({ visible, paymentUrl, reference, onDone }: DexPayCheckoutProps) {
  const tr = useT();
  const [phase, setPhase] = useState<Phase>('checkout');
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  // Réinitialise l'état à chaque nouvelle ouverture (une session par référence).
  useEffect(() => {
    if (visible) setPhase('checkout');
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

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      let msg: { type: string; data?: unknown };
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'success':
          // Signal UI uniquement — le paiement réel sera confirmé par le
          // webhook. On lance le polling, on ne crédite rien ici.
          startPolling();
          break;
        case 'cancel':
          setPhase('cancelled');
          break;
        case 'error':
          setPhase('failed');
          break;
        default:
          break;
      }
    },
    [startPolling],
  );

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
            source={{ html: buildHtml(paymentUrl) }}
            onMessage={handleMessage}
            style={styles.webview}
            startInLoadingState
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
