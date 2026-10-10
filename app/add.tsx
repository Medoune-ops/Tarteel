import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAccessToken } from '../lib/api/tokens';

/**
 * Point d'entrée du deep link `tarteel://add?code=XXXXXX` (page publique de
 * redirection https://tarteel.app/f/:code et QR code). Redirige vers l'écran
 * d'ajout d'ami avec le code pré-rempli ; si personne n'est connecté, on passe
 * par l'onboarding.
 */
export default function AddDeepLinkScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  useEffect(() => {
    (async () => {
      const token = await getAccessToken();
      if (token) {
        router.replace({ pathname: '/(app)/friends-add', params: code ? { code } : {} });
      } else {
        router.replace('/(onboarding)/signup');
      }
    })();
  }, [code, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6B4DFF' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}