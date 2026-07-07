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
  user: { id: string; email: string; displayName: string; [k: string]: unknown };
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
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

/** Crée un compte, ouvre la session et hydrate le store. */
export async function register(input: RegisterInput): Promise<void> {
  // Le backend exige `deviceId` (lie le refresh token à cette installation).
  const deviceId = await getDeviceId();
  const data = await apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    json: { ...input, deviceId },
  });
  await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  await fetchMe();
  // Best-effort : ne bloque jamais l'inscription si l'utilisateur refuse la
  // permission ou si on est sur Expo Go / un simulateur.
  registerForPushNotifications();
}

/** Connexion : stocke les jetons et hydrate le store. */
export async function login(input: LoginInput): Promise<void> {
  const deviceId = await getDeviceId();
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
