/**
 * Authentification : register, login, logout.
 *
 * `POST /auth/register|login` renvoient `{ user, accessToken, refreshToken,
 * refreshExpiresAt }` (le `user` est la forme riche `serializeUser`). On stocke
 * les jetons, puis on appelle `fetchMe()` pour hydrater le store avec la forme
 * PLATE de `/me` (source de vérité unique, évite de mapper deux formes).
 */
import { apiFetch } from './client';
import { setTokens, clearTokens, getRefreshToken, getDeviceId } from './tokens';
import { fetchMe } from './me';
import { useUserStore } from '../../store/userStore';
import { registerForPushNotifications, unregisterPushToken } from '../pushNotifications';

interface AuthResponse {
  user: { id: string; email: string; displayName: string; emailVerified?: boolean; [k: string]: unknown };
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
  /** Présent uniquement si EMAIL_VERIFICATION_ENABLED côté serveur. */
  verificationEmailSent?: boolean;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  /** Pseudo public (affiché dans les ligues) — le nom complet reste privé. */
  username?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterResult {
  email: string;
  emailVerified: boolean;
}

/** Crée un compte, ouvre la session et hydrate le store si l'email est vérifié. */
export async function register(input: RegisterInput): Promise<RegisterResult> {
  // Le backend exige `deviceId` (lie le refresh token à cette installation).
  const deviceId = await getDeviceId();
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    json: { ...input, deviceId },
  });

  // Quand EMAIL_VERIFICATION_ENABLED=true, le backend n'émet PAS de tokens au
  // register — ils arrivent après POST /auth/verify-email. On ne stocke donc
  // les tokens QUE s'ils sont présents.
  if (data.accessToken && data.refreshToken) {
    await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  }

  // Strict : seul `true` compte comme vérifié. Si le flag serveur est actif,
  // `emailVerified` est false et `verificationEmailSent` est présent.
  const emailVerified =
    data.user.emailVerified === true && data.verificationEmailSent === undefined;

  if (emailVerified) {
    await fetchMe();
    registerForPushNotifications();
  } else {
    // Pas de GET /me possible — on stocke a minima l'email et le nom pour
    // l'écran de vérification. Le flag pendingEmailVerification permet à
    // bootstrapSession() de retrouver cet état après un redémarrage.
    useUserStore.setState({
      email: data.user.email,
      name: typeof data.user.displayName === 'string' ? data.user.displayName : '',
      pendingEmailVerification: true,
    });
  }

  return { email: data.user.email, emailVerified };
}


/** Connexion : stocke les jetons et hydrate le store. */
export async function login(input: LoginInput): Promise<void> {
  const deviceId = await getDeviceId();
  // Email en store AVANT login : si EMAIL_NOT_VERIFIED, le filet de redirection
  // a besoin de l'adresse pour ouvrir l'écran code.
  useUserStore.setState({ email: input.email });
  const data = await apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    json: { ...input, deviceId },
  });
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  await fetchMe();
  registerForPushNotifications();
}

/**
 * Déconnexion : révoque la session côté serveur (best-effort), efface les
 * jetons locaux et réinitialise le store.
 */
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  const deviceId = await getDeviceId();
  // Avant de couper les jetons : sinon la requête DELETE ne serait plus authentifiée.
  await unregisterPushToken();
  try {
    await apiFetch('/auth/logout', {
      method: 'POST',
      json: { refreshToken, deviceId },
    });
  } catch {
    // On se déconnecte localement même si le serveur est injoignable.
  }
  await clearTokens();
  useUserStore.getState().logout();
}
