import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn() }),
}));
jest.mock('../components/Otter', () => () => null);
jest.mock('expo-linear-gradient', () => ({ LinearGradient: () => null }));

const mockRequestGoogle = jest.fn();
const mockRequestApple = jest.fn();
let mockGoogleAvailable = true;
let mockAppleAvailable = false;
jest.mock('../lib/socialAuth', () => ({
  isGoogleSignInAvailable: () => mockGoogleAvailable,
  isAppleSignInAvailable: () => Promise.resolve(mockAppleAvailable),
  requestGoogleCredential: () => mockRequestGoogle(),
  requestAppleCredential: () => mockRequestApple(),
}));
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationButton: () => null,
  AppleAuthenticationButtonType: { CONTINUE: 1 },
  AppleAuthenticationButtonStyle: { BLACK: 2 },
}));

const mockSocialSignIn = jest.fn();
jest.mock('../lib/api', () => {
  return {
    ApiError: class ApiError extends Error { status = 0; code = ''; },
    socialSignIn: (...a: unknown[]) => mockSocialSignIn(...a),
    login: jest.fn(), register: jest.fn(), resendVerificationCode: jest.fn(),
  };
});
jest.mock('../lib/emailVerificationRedirect', () => ({ redirectToVerifyEmail: jest.fn() }));

import { ApiError } from '../lib/api';
import { useUserStore } from '../store/userStore';
import SignupScreen from '../app/(onboarding)/signup';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

async function render() {
  await act(async () => { current = TestRenderer.create(<SignupScreen />); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  return current!;
}

async function tapGoogle(r: TestRenderer.ReactTestRenderer) {
  const button = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes('Continuer avec Google'))
    .pop();
  await act(async () => { await button!.props.onPress(); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

describe('connexion avec Google / Apple sur l’écran d’inscription', () => {
  beforeEach(() => {
    mockGoogleAvailable = true;
    mockAppleAvailable = false;
    mockReplace.mockClear();
    mockRequestGoogle.mockReset();
    mockSocialSignIn.mockReset();
    mockRequestGoogle.mockResolvedValue({ provider: 'google', idToken: 'jeton' });
    useUserStore.setState({ onboardingDone: true });
  });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('n’affiche aucun bouton ni mention tant que la connexion n’est pas activée', async () => {
    mockGoogleAvailable = false;
    const r = await render();
    expect(textOf(r.root)).not.toContain('Continuer avec Google');
    expect(textOf(r.root)).not.toContain('En continuant');
  });

  it('affiche la mention des conditions avec le bouton', async () => {
    const r = await render();
    expect(textOf(r.root)).toContain('Continuer avec Google');
    expect(textOf(r.root)).toContain('En continuant, tu acceptes');
  });

  it('un nouveau compte part vers la configuration du profil', async () => {
    mockSocialSignIn.mockResolvedValue({ isNewUser: true });
    const r = await render();
    await tapGoogle(r);
    expect(mockSocialSignIn).toHaveBeenCalledWith({ provider: 'google', idToken: 'jeton' });
    expect(mockReplace).toHaveBeenCalledWith('/(setup)/niveau');
  });

  it('un compte existant configuré part vers le parcours', async () => {
    mockSocialSignIn.mockResolvedValue({ isNewUser: false });
    const r = await render();
    await tapGoogle(r);
    expect(mockReplace).toHaveBeenCalledWith('/(app)/(tabs)/parcours');
  });

  it('annuler chez Google n’appelle pas le serveur et n’affiche pas d’erreur', async () => {
    mockRequestGoogle.mockResolvedValue(null);
    const r = await render();
    await tapGoogle(r);
    expect(mockSocialSignIn).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(textOf(r.root)).not.toContain('erreur');
  });

  it('un compte à mot de passe existant renvoie vers la connexion avec un message clair', async () => {
    mockSocialSignIn.mockRejectedValue(Object.assign(new (ApiError as unknown as typeof Error)('pris'), { code: 'EMAIL_TAKEN' }));
    const r = await render();
    await tapGoogle(r);
    expect(textOf(r.root)).toContain('Connecte-toi avec ton mot de passe');
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
