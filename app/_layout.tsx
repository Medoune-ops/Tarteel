import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold,
  Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  Baloo2_700Bold, Baloo2_800ExtraBold,
} from '@expo-google-fonts/baloo-2';
import {
  ScheherazadeNew_400Regular, ScheherazadeNew_700Bold,
} from '@expo-google-fonts/scheherazade-new';
import { preloadSounds } from '../constants/sounds';
import { useTheme } from '../utils/useTheme';
import { useAppConfigStore } from '../store/appConfigStore';
import { useAudioDownloadStore } from '../store/audioDownloadStore';

SplashScreen.preventAutoHideAsync();

// En dessous de ce délai depuis le dernier chargement, un retour au premier
// plan ne redéclenche pas d'appel — évite les rafales sur des va-et-vient
// rapides (ex: notification système, changement d'app furtif).
const CONFIG_REFRESH_MIN_INTERVAL_MS = 30_000;

/**
 * Recharge GET /config quand l'app revient au premier plan : un admin peut
 * basculer paymentsEnabled côté back-office pendant que l'utilisateur a l'app
 * en arrière-plan — sans ce refresh, il ne verrait le changement qu'au
 * prochain relancement complet de l'app.
 */
function useRefreshAppConfigOnForeground() {
  const lastFetchAt = useRef(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      const cameToForeground = appState.current.match(/inactive|background/) && next === 'active';
      appState.current = next;
      if (!cameToForeground) return;
      if (Date.now() - lastFetchAt.current < CONFIG_REFRESH_MIN_INTERVAL_MS) return;
      lastFetchAt.current = Date.now();
      useAppConfigStore.getState().load();
    });
    return () => subscription.remove();
  }, []);
}

function ThemedApp() {
  const { statusBar } = useTheme();
  return (
    <>
      <StatusBar style={statusBar} />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(setup)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    Baloo2_700Bold,
    Baloo2_800ExtraBold,
    ScheherazadeNew_400Regular,
    ScheherazadeNew_700Bold,
  });

  useEffect(() => {
    preloadSounds();
    useAppConfigStore.getState().load();
    // Pré-téléchargement automatique du récitateur Sudais (mode Tajwid
    // hors-ligne) — fire-and-forget, ne bloque jamais le démarrage de l'app.
    const audioStore = useAudioDownloadStore.getState();
    if (!audioStore.sudaisReady && !audioStore.isDownloading) {
      audioStore.startDownload();
    }
  }, []);

  useRefreshAppConfigOnForeground();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemedApp />
    </SafeAreaProvider>
  );
}
