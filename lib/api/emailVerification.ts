/**
 * Vérification d'email par code à 4 chiffres.
 *
 *  - `POST /auth/verify-email` { email, code } → tokens frais (ev:true).
 *    (deviceId non envoyé : le backend le récupère de la session active.)
 *  - `POST /auth/verify-email/resend` { email } → renvoie un nouveau code.
 */
import { apiFetch } from './client';
import { getDeviceId, setTokens } from './tokens';
import { fetchMe } from './me';
import { registerForPushNotifications } from '../pushNotifications';
import { useUserStore } from '../../store/userStore';


interface VerifyEmailResponse {
  accessToken: string;
  refreshToken: string;
}

/** Valide le code reçu par email, stocke les jetons et hydrate le store. */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const deviceId = await getDeviceId();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCode = (code || '').trim();
  // deviceId est requis : le backend n'a pas créé de session au register
  // (EMAIL_VERIFICATION_ENABLED=true), il doit donc créer la session ici.
  const data = await apiFetch<VerifyEmailResponse>('/auth/verify-email', {
    method: 'POST',
    auth: false,
    json: { email: cleanEmail, code: cleanCode, deviceId },
  });
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  // L'email est maintenant vérifié — on efface le flag de vérification en attente.
  useUserStore.setState({ pendingEmailVerification: false });
  await fetchMe();
  registerForPushNotifications();
}


/** Redemande un code frais (invalide le précédent). Public. */
export async function resendVerificationCode(email: string): Promise<void> {
  const cleanEmail = (email || '').trim().toLowerCase();
  await apiFetch('/auth/verify-email/resend', {
    method: 'POST',
    auth: false,
    json: { email: cleanEmail },
  });
}
