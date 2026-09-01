/**
 * Enregistrement des notifications push (Expo).
 *
 * ⚠️ Expo Go (SDK 53+) ne supporte plus les push notifications à distance —
 * il faut un development build (`expo prebuild` + `eas build --profile
 * development`, ou `npx expo run:ios`/`run:android`) pour tester réellement
 * l'envoi. Sur Expo Go, `registerForPushToken()` échoue silencieusement (pas
 * de crash), ce qui est le comportement voulu en attendant un vrai build.
 *
 * Flux :
 *   1. Demande la permission (no-op si déjà accordée/refusée).
 *   2. Récupère le token Expo push (nécessite un vrai appareil).
 *   3. L'enregistre côté serveur : POST /me/notifications/tokens.
 * Appelé une fois après login/register et à l'ouverture de l'app si déjà
 * connecté (voir app/_layout.tsx).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiFetch } from './api/client';
import { getDeviceId } from './api/tokens';

/**
 * Identifiant du projet EAS, exigé par getExpoPushTokenAsync() dans un build
 * autonome (App Store / Play Store).
 *
 * ⚠️ Sans lui, l'appel echoue — et comme tout est avalé par le catch plus bas,
 * l'échec est INVISIBLE : aucun token n'atteint le serveur, donc plus aucune
 * notification. Expo Go devinait le projet tout seul, ce qui masquait le
 * problème tant qu'on testait avec lui.
 */
function easProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    // easConfig : renseigné dans les builds EAS, absent en développement.
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

// Affiche les notifications reçues au premier plan (sinon iOS/Android les
// avalent silencieusement pendant que l'app est ouverte).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Demande la permission si nécessaire, récupère le token Expo push et
 * l'enregistre côté serveur. Best-effort : toute erreur (Expo Go, simulateur,
 * refus utilisateur, hors-ligne) est avalée — les notifications ne sont pas
 * un chemin bloquant pour le reste de l'app.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    // Un simulateur/émulateur n'a pas de service push — Notifications.
    // getExpoPushTokenAsync() lèverait une erreur bruyante sinon.
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return;

    const projectId = easProjectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const deviceId = await getDeviceId();

    await apiFetch('/me/notifications/tokens', {
      method: 'POST',
      json: { token, deviceId, platform: Platform.OS },
    });
  } catch (e) {
    // Refus utilisateur, simulateur, hors-ligne… jamais bloquant. On trace
    // quand même : cet échec est silencieux par nature et a déjà coûté toutes
    // les notifications d'un build store sans que rien ne l'indique.
    console.warn('[push] enregistrement du token échoué:', e);
  }
}

/** Désenregistre le token de cet appareil (best-effort, appelé au logout). */
export async function unregisterPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const projectId = easProjectId();
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    await apiFetch('/me/notifications/tokens', { method: 'DELETE', json: { token } });
  } catch {
    // Pas grave : le token restera enregistré mais /me/notifications/tokens
    // est scopé à req.auth — un token orphelin ne fuite aucune donnée.
  }
}
