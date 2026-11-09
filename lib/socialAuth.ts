/**
 * Récupère le jeton d'identité auprès de Google ou d'Apple. C'est le backend qui
 * le vérifie et ouvre la session (voir `socialSignIn` dans lib/api/auth.ts).
 *
 * Boutons cachés tant que EXPO_PUBLIC_SOCIAL_LOGIN_ENABLED ne vaut pas "1" : à
 * n'activer qu'une fois POST /auth/social déployé et configuré côté backend.
 */
import { Platform } from 'react-native';

export type SocialProvider = 'google' | 'apple';

export interface SocialCredential {
  provider: SocialProvider;
  idToken: string;
  /** Apple ne met pas le nom dans le jeton et ne le donne qu'à la 1re connexion. */
  displayName?: string;
}

const ENABLED = process.env.EXPO_PUBLIC_SOCIAL_LOGIN_ENABLED === '1';
// Client OAuth « Web » : indispensable pour obtenir un jeton d'identité. Le
// backend doit accepter ce client ET le client iOS (GOOGLE_CLIENT_IDS).
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
// Sur iOS, il faut aussi le plugin Expo avec le même client (iosUrlScheme dans
// app.json) : sans ce schéma d'URL, la connexion Google fait planter l'app.
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/**
 * Modules natifs chargés à la demande, jamais à l'import : ils sont absents
 * d'Expo Go et des versions déjà installées qu'une mise à jour OTA peut atteindre
 * (runtimeVersion = appVersion). Un import direct pourrait y faire planter l'app.
 */
function googleModule(): typeof import('@react-native-google-signin/google-signin') | null {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

export function appleModule(): typeof import('expo-apple-authentication') | null {
  try {
    return require('expo-apple-authentication');
  } catch {
    return null;
  }
}

export function isGoogleSignInAvailable(): boolean {
  if (!ENABLED || !GOOGLE_WEB_CLIENT_ID) return false;
  if (Platform.OS === 'ios' && !GOOGLE_IOS_CLIENT_ID) return false;
  return googleModule() !== null;
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (!ENABLED || Platform.OS !== 'ios') return false;
  try {
    return (await appleModule()?.isAvailableAsync()) ?? false;
  } catch {
    return false;
  }
}

/** Renvoie null si l'utilisateur annule : ce n'est pas une erreur à afficher. */
export async function requestGoogleCredential(): Promise<SocialCredential | null> {
  const google = googleModule();
  if (!google) throw new Error('Google sign-in unavailable');
  const { GoogleSignin, isErrorWithCode, statusCodes } = google;

  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Sinon Google reprend le dernier compte, sans laisser le choix après une déconnexion.
    await GoogleSignin.signOut().catch(() => {});
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') return null;
    if (!response.data.idToken) throw new Error('Google returned no identity token');
    return { provider: 'google', idToken: response.data.idToken };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) return null;
    throw error;
  }
}

/** Renvoie null si l'utilisateur annule : ce n'est pas une erreur à afficher. */
export async function requestAppleCredential(): Promise<SocialCredential | null> {
  const AppleAuthentication = appleModule();
  if (!AppleAuthentication) throw new Error('Apple sign-in unavailable');
  try {
    const result = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!result.identityToken) throw new Error('Apple returned no identity token');
    const displayName = [result.fullName?.givenName, result.fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return { provider: 'apple', idToken: result.identityToken, displayName: displayName || undefined };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
}
