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
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiFetch } from './api/client';
import { getDeviceId } from './api/tokens';

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

    const { data: token } = await Notifications.getExpoPushTokenAsync();
    const deviceId = await getDeviceId();

    await apiFetch('/me/notifications/tokens', {
      method: 'POST',
      json: { token, deviceId, platform: Platform.OS },
    });
  } catch {
    // Expo Go, pas de projectId configuré, refus, hors-ligne… jamais bloquant.
  }
}

/** Désenregistre le token de cet appareil (best-effort, appelé au logout). */
export async function unregisterPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await apiFetch('/me/notifications/tokens', { method: 'DELETE', json: { token } });
  } catch {
    // Pas grave : le token restera enregistré mais /me/notifications/tokens
    // est scopé à req.auth — un token orphelin ne fuite aucune donnée.
  }
}
