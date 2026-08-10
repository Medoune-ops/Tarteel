import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { fetchMe, fetchPendingGift, ackPendingGift, syncTimezone } from '../../lib/api/me';
import { registerForPushNotifications } from '../../lib/pushNotifications';
import GiftModal from '../../components/GiftModal';
import MiniPlayer from '../../components/MiniPlayer';
import { useGiftModalStore } from '../../store/giftModalStore';

/**
 * Enregistre le token push et la timezone du device au lancement de l'app
 * pour un utilisateur DÉJÀ connecté (session restaurée depuis les jetons
 * stockés). `register()`/`login()` (lib/api/auth.ts) le font déjà au moment
 * de la connexion, mais rien ne le refaisait au simple relancement de l'app —
 * un utilisateur déjà connecté avant l'ajout de ce code n'avait donc jamais
 * de token enregistré. Best-effort, ne bloque jamais l'affichage de l'app.
 */
function useRegisterPushOnMount() {
  useEffect(() => {
    registerForPushNotifications();
    syncTimezone();
  }, []);
}

// En dessous de ce délai depuis le dernier fetchMe(), un retour au premier
// plan ne redéclenche pas d'appel — évite les rafales sur des va-et-vient
// rapides (ex: notification système, changement d'app furtif).
const MIN_REFRESH_INTERVAL_MS = 30_000;

/**
 * Recharge GET /me quand l'app revient au premier plan : un admin peut créditer
 * cœurs/gemmes/premium côté back-office pendant que l'utilisateur a l'app en
 * arrière-plan — sans ce refresh, il ne les verrait qu'au prochain relancement
 * manuel de l'app ou à la prochaine action qui appelle fetchMe() elle-même.
 */
function useRefreshMeOnForeground() {
  const lastFetchAt = useRef(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground = appState.current.match(/inactive|background/) && next === 'active';
      appState.current = next;
      if (!cameToForeground) return;
      if (Date.now() - lastFetchAt.current < MIN_REFRESH_INTERVAL_MS) return;
      lastFetchAt.current = Date.now();
      fetchMe().catch(() => {}); // silencieux : simple rafraîchissement en tâche de fond
    });
    return () => subscription.remove();
  }, []);
}

// Intervalle de polling du cadeau admin en attente — voir usePendingGiftPolling.
const PENDING_GIFT_POLL_MS = 15_000;

/**
 * Poll GET /me/pending-gift toutes les 15s tant que l'app est au premier plan,
 * pour détecter un cadeau admin (cœurs/gemmes/premium offert depuis le
 * back-office, voir adminUsers.service.ts::notifyGrant) et déclencher la
 * modale cadeau animée en quasi temps réel. Choix polling plutôt que push :
 * fonctionne sur Expo Go et le simulateur (pas besoin de development build ni
 * de permissions notifications), ce qui est le principal terrain de test ici.
 * Dès qu'un cadeau est trouvé, GET /me est rappelé (compteurs à jour partout
 * via le store) puis le cadeau est marqué vu (ack) pour ne jamais le rejouer.
 */
function usePendingGiftPolling() {
  const isPolling = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (isPolling.current) return;
      isPolling.current = true;
      try {
        const gift = await fetchPendingGift();
        if (gift && !cancelled) {
          await fetchMe().catch(() => {});
          useGiftModalStore.getState().show(gift.kind, gift.amount);
          await ackPendingGift(gift.id).catch(() => {});
        }
      } catch {
        // hors-ligne / erreur réseau : on retentera au prochain tick
      } finally {
        isPolling.current = false;
      }
    };

    poll(); // premier check immédiat à l'ouverture
    const interval = setInterval(poll, PENDING_GIFT_POLL_MS);

    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') poll(); // retour au premier plan → check immédiat
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
}

export default function AppLayout() {
  useRegisterPushOnMount();
  useRefreshMeOnForeground();
  usePendingGiftPolling();
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', freezeOnBlur: true }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="langue" />
        <Stack.Screen name="sourates" />
        <Stack.Screen name="sourate/[numero]" />
        <Stack.Screen name="asma" />
        <Stack.Screen name="lecture-libre" />
        <Stack.Screen name="lecture/[numero]" />
        <Stack.Screen name="streak-goal" />
        <Stack.Screen name="streak" />
        <Stack.Screen name="gems" />
        <Stack.Screen name="tajwid" />
        <Stack.Screen name="coran-player" />
        <Stack.Screen name="household" />
        <Stack.Screen name="podiums" />
        <Stack.Screen name="widgets" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="hearts" />
        <Stack.Screen name="referral" />
        <Stack.Screen name="payment-method" />
        <Stack.Screen name="payment-card" />
        <Stack.Screen name="revision" />
        <Stack.Screen name="docs" />
        <Stack.Screen name="lesson" />
      </Stack>
      <MiniPlayer />
      <GiftModal />
    </>
  );
}
