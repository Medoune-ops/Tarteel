/**
 * Amorçage de session au démarrage de l'app.
 *
 * À appeler depuis l'écran d'accueil (splash). Si un access token est stocké,
 * on tente GET /me pour hydrater le store (le client rafraîchit tout seul le
 * token si nécessaire). Renvoie true si l'utilisateur est connecté.
 */
import { getAccessToken, getRefreshToken } from './tokens';
import { fetchMe } from './me';
import { registerForPushNotifications } from '../pushNotifications';

export async function bootstrapSession(): Promise<boolean> {
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  if (!access && !refresh) return false; // jamais connecté
  try {
    await fetchMe(); // déclenche un auto-refresh si l'access token a expiré
    // Re-enregistre le token à chaque démarrage : couvre le cas où l'OS a
    // changé le token Expo (réinstall, restauration…) sans que l'utilisateur
    // ne se reconnecte. Best-effort, jamais bloquant pour l'ouverture de l'app.
    registerForPushNotifications();
    return true;
  } catch {
    return false; // session invalide/expirée → rester sur l'onboarding
  }
}
