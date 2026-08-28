import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as NativeSplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, Easing,
} from 'react-native-reanimated';
import Otter from '../../components/Otter';
import { bootstrapSession } from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

export default function SplashScreen() {
  const router = useRouter();
  const tr = useT();
  const loadingWidth = useSharedValue(0);

  useEffect(() => {
    // Le splash natif (image statique) reste affiché jusqu'ici — voir
    // app/_layout.tsx. On ne le masque qu'une fois CET écran (la mascotte
    // animée) réellement monté, pour un enchaînement sans frame vide entre
    // les deux.
    NativeSplashScreen.hideAsync();
    loadingWidth.value = withTiming(0.62, { duration: 2000, easing: Easing.out(Easing.quad) });

    let cancelled = false;
    // En parallèle de l'animation : tente de restaurer la session (token stocké).
    (async () => {
      const status = await bootstrapSession().catch(() => 'none' as const);
      if (cancelled) return;
      // On laisse l'animation se voir un minimum (~1.6s) avant de router.
      setTimeout(() => {
        if (cancelled) return;
        if (status === 'connected') router.replace('/(app)/(tabs)/parcours');
        else if (status === 'unverified') {
          router.replace({
            pathname: '/(onboarding)/verify-email',
            params: {
              email: useUserStore.getState().email,
              forceSetup: useUserStore.getState().onboardingDone ? '0' : '1',
            },
          });
        } else router.replace('/(onboarding)/onboarding-1');
      }, 1600);
    })();

    return () => { cancelled = true; };
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${loadingWidth.value * 100}%`,
  }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#5B3FD6', '#7C5BF0', '#9B7DF7']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.otterWrap}>
          <Otter size={186} showBook />
        </View>
        <Text style={styles.title}>Tarteel</Text>
        <Text style={styles.subtitle}>{tr('splash.subtitle')}</Text>

        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderFill, barStyle]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otterWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 26,
    elevation: 12,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 52,
    color: '#fff',
    marginTop: 26,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 20,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 4,
  },
  loaderTrack: {
    position: 'absolute',
    bottom: 120,
    width: 200,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },
  loaderFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 4,
  },
});
