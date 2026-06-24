import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withDelay, withRepeat, withSequence,
  Easing, FadeInDown,
} from 'react-native-reanimated';
import Otter from '../../components/Otter';
import Confetti from '../../components/Confetti';
import { useUserStore } from '../../store/userStore';

export default function PlanScreen() {
  const router = useRouter();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);

  const otterScale = useSharedValue(0);
  const otterRot   = useSharedValue(0);
  // micro-pulse de la barre vide pour signaler qu'elle attend d'être remplie
  const barOpacity = useSharedValue(0.35);

  useEffect(() => {
    otterScale.value = withSpring(1, { damping: 8, stiffness: 140, mass: 0.7 });
    otterRot.value = withDelay(
      350,
      withRepeat(
        withSequence(
          withTiming(-0.09, { duration: 320, easing: Easing.inOut(Easing.quad) }),
          withTiming( 0.09, { duration: 320, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
    barOpacity.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1,    { duration: 500 }),
          withTiming(0.35, { duration: 500 }),
        ),
        3,
        true,
      ),
    );
  }, []);

  const otterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: otterScale.value },
      { rotate: `${otterRot.value}rad` },
    ],
  }));

  const barStyle = useAnimatedStyle(() => ({
    opacity: barOpacity.value,
  }));

  const start = () => {
    completeOnboarding();
    router.replace('/(app)/(tabs)/parcours');
  };

  return (
    <View style={styles.screen}>
      <Confetti count={48} />

      <View style={{ height: 110 }} />

      <Animated.View style={[styles.otterWrap, otterStyle]}>
        <Otter size={124} />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(250).springify()} style={styles.title}>
        Ton plan est prêt !
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Feather name="book" size={22} color="#6B4DFF" />
          <Text style={styles.cardTitle}>Unité 1 — Alphabet Arabe</Text>
        </View>
        <Text style={styles.cardSub}>12 leçons · 3 semaines à 10 min/j</Text>
        <Animated.View style={[styles.emptyBar, barStyle]} />
        <Text style={styles.cardSub}>0 / 12 leçons complétées</Text>
        <View style={styles.streakRow}>
          <Feather name="zap" size={19} color="#F0820C" />
          <Text style={styles.streakText}>Streak quotidien activé</Text>
        </View>
        <Text style={styles.cardSubSmall}>Notification à 20h00 chaque jour</Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInDown.delay(700).springify()} style={{ width: '100%' }}>
        <Pressable style={styles.cta} onPress={start}>
          <Text style={styles.ctaLabel}>Commencer la leçon 1</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#6B4DFF', alignItems: 'center', paddingHorizontal: 28 },
  otterWrap: { alignItems: 'center' },
  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, color: '#fff',
    textAlign: 'center', marginTop: 22,
  },
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 24, marginTop: 30,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#1B2333' },
  cardSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 4 },
  cardSubSmall: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', marginTop: 2 },
  emptyBar: { height: 10, borderRadius: 6, backgroundColor: '#EAECF0', marginVertical: 16 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  streakText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#2A9E1C' },
  cta: {
    width: '100%', height: 62, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 38,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#6B4DFF' },
});
