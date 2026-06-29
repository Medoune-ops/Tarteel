import { useEffect } from 'react';
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

SplashScreen.preventAutoHideAsync();

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
  }, []);

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
