import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAccessToken } from '../lib/api/tokens';
import { useAppConfigStore } from '../store/appConfigStore';

/**
 * Point d'entrée du deep link `tarteel://add?code=XXXXXX` (page publique de
 * redirection https://tarteel.sn/f/:code et QR code). Redirige vers l'écran
 * d'ajout d'ami avec le code pré-rempli ; si personne n'est connecté, on passe
 * par l'onboarding.
 */
export default function AddDeepLinkScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  // Règle 8 : un deep link d'ajout n'est honoré que si le serveur confirme que
  // la fonctionnalité Amis est active. Sinon on retombe sur l'accueil.
  const loaded = useAppConfigStore((s) => s.loaded);
  const friendsEnabled = useAppConfigStore((s) => s.friendsEnabled);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      const token = await getAccessToken();
      if (token && friendsEnabled) {
        router.replace({ pathname: '/(app)/friends-add', params: code ? { code } : {} });
      } else if (token) {
        router.replace('/(app)/(tabs)/parcours');
      } else {
        router.replace('/(onboarding)/signup');
      }
    })();
  }, [code, router, loaded, friendsEnabled]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6B4DFF' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}