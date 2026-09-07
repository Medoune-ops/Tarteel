import { router } from 'expo-router';
import { useUserStore } from '../store/userStore';

/** Redirige vers l'écran de saisie du code (filet de sécurité EMAIL_NOT_VERIFIED). */
export function redirectToVerifyEmail(opts?: { email?: string; forceSetup?: boolean }) {
  const state = useUserStore.getState();
  const email = (opts?.email ?? state.email)?.trim();
  if (!email) return;
  router.replace({
    pathname: '/(onboarding)/verify-email',
    params: {
      email,
      forceSetup: (opts?.forceSetup ?? !state.onboardingDone) ? '1' : '0',
    },
  });
}
