// Les modules natifs manquent sur les versions déjà installées qu'une mise à jour
// OTA peut atteindre : tant que c'est masqué, ils ne doivent même pas être chargés.
jest.mock('expo-apple-authentication', () => { throw new Error('module Apple chargé'); });
jest.mock('@react-native-google-signin/google-signin', () => { throw new Error('module Google chargé'); });

import { isAppleSignInAvailable, isGoogleSignInAvailable } from '../lib/socialAuth';

describe('connexion Google / Apple masquée par défaut', () => {
  it('Google n’est pas disponible', () => {
    expect(process.env.EXPO_PUBLIC_SOCIAL_LOGIN_ENABLED).toBeUndefined();
    expect(isGoogleSignInAvailable()).toBe(false);
  });

  it('Apple n’est pas disponible', async () => {
    await expect(isAppleSignInAvailable()).resolves.toBe(false);
  });

  it('l’écran se charge sans ces modules natifs', () => {
    expect(() => require('../components/SocialSignInButtons')).not.toThrow();
  });
});
