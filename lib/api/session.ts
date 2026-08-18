/**
 * Amorçage de session au démarrage de l'app.
 *
 * À appeler depuis l'écran d'accueil (splash). Si un access token est stocké,
 * on tente GET /me pour hydrater le store (le client rafraîchit tout seul le
 * token si nécessaire).
 */
import { getAccessToken, getRefreshToken } from './tokens';
import { fetchMe } from './me';
import { ApiError, lastRefreshWasEmailNotVerified } from './client';
import { registerForPushNotifications } from '../pushNotifications';
import { useUserStore } from '../../store/userStore';


export type SessionStatus = 'connected' | 'unverified' | 'none';

export async function bootstrapSession(): Promise<SessionStatus> {
  const [access, refresh] = await Promise.all([getAccessToken(), getRefreshToken()]);
  if (!access && !refresh) {
    // Cas spécial : l'utilisateur s'est inscrit (EMAIL_VERIFICATION_ENABLED=true)
    // mais n'a pas encore validé son code. Le backend n'a pas émis de tokens,
    // mais on a stocké l'email + le flag en attente dans le store (persist).
    const { pendingEmailVerification, email } = useUserStore.getState();
    if (pendingEmailVerification && email) return 'unverified';
    return 'none'; // jamais connecté
  }

  try {
    await fetchMe(); // déclenche un auto-refresh si l'access token a expiré
    // Re-enregistre le token à chaque démarrage : couvre le cas où l'OS a
    // changé le token Expo (réinstall, restauration…) sans que l'utilisateur
    // ne se reconnecte. Best-effort, jamais bloquant pour l'ouverture de l'app.
    registerForPushNotifications();
    return 'connected';
  } catch (e) {
    // Cas 1 : l'access token est encore valide mais le backend exige la
    // vérification email (fetchMe retourne directement EMAIL_NOT_VERIFIED).
    if (e instanceof ApiError && e.code === 'EMAIL_NOT_VERIFIED') return 'unverified';
    // Cas 2 : l'access token était expiré ET le refresh a été bloqué par
    // EMAIL_NOT_VERIFIED. refreshTokens() a conservé les tokens mais retourné
    // false → fetchMe() échoue avec UNAUTHENTICATED. On distingue ce cas
    // grâce au flag exporté par client.ts.
    if (lastRefreshWasEmailNotVerified) return 'unverified';
    // Cas 3 : HORS-LIGNE (status 0 = fetch n'a jamais joint le serveur, cf.
    // client.ts). Ce n'est PAS une session invalide : les tokens sont intacts
    // (refreshTokens() ne les efface jamais sur erreur réseau) et le store est
    // persisté (AsyncStorage). Renvoyer 'none' ici déconnectait visuellement un
    // utilisateur déjà connecté dès qu'il ouvrait l'app sans réseau. On le
    // laisse entrer avec son état en cache ; /me resyncera au retour du réseau.
    if (e instanceof ApiError && e.status === 0) return 'connected';
    return 'none'; // session invalide/expirée → rester sur l'onboarding
  }
}
