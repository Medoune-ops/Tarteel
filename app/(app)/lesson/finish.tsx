import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay,
  withRepeat, withSequence, Easing, FadeInDown,
} from 'react-native-reanimated';
import Otter from '../../../components/Otter';
import Confetti from '../../../components/Confetti';
import { playSound } from '../../../constants/sounds';
import { useUserStore } from '../../../store/userStore';
import { completeLesson } from '../../../lib/api';

const LEVEL_TARGET = 0.62; // 62 %

/** Formate une durée en ms vers "m:ss" (ex: 258000 → "4:18"). */
function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function FinishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lessonId?: string;
    correct?: string;
    total?: string;
    durationMs?: string;
  }>();

  // Valeurs affichées : par défaut, l'état courant du store (déjà hydraté).
  const xp = useUserStore((s) => s.xp);
  const streak = useUserStore((s) => s.streak);
  const precision = useUserStore((s) => s.precision);

  const total = Number(params.total) || 0;
  const correct = Number(params.correct) || 0;
  const durationMs = Number(params.durationMs) || 0;
  // Précision de CETTE leçon si on a les compteurs, sinon précision globale du store.
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : precision;

  // XP gagnés sur cette leçon : delta avant/après l'appel /lesson/complete.
  const [xpGained, setXpGained] = useState<number | null>(null);
  // Évite un double appel (StrictMode / re-render).
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (!params.lessonId) return; // maquette / pas de leçon réelle : rien à enregistrer
    const xpBefore = useUserStore.getState().xp;
    completeLesson({
      lessonId: params.lessonId,
      correctAnswers: correct,
      totalAnswers: total,
      durationMs: durationMs || undefined,
    })
      .then(() => setXpGained(useUserStore.getState().xp - xpBefore))
      .catch(() => { /* hors-ligne : la progression reste locale, resync au prochain /me */ });
  }, []);

  const otterScale = useSharedValue(0);
  const otterY     = useSharedValue(0);
  const levelProgress = useSharedValue(0);

  useEffect(() => {
    // pop d'apparition
    otterScale.value = withSpring(1, { damping: 8, stiffness: 140, mass: 0.7 });
    // sauts enthousiastes répétés (bounce vertical)
    otterY.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(-28, { duration: 220, easing: Easing.out(Easing.quad) }),
          withTiming(  0, { duration: 280, easing: Easing.in(Easing.bounce) }),
          withTiming(  0, { duration: 180 }), // micro-pause au sol
        ),
        -1,
        false,
      ),
    );
    levelProgress.value = withDelay(
      600,
      withTiming(LEVEL_TARGET, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );

    // Fanfare de fin à l'apparition + petit "tick" quand la barre de niveau démarre.
    playSound('finish');
    const tick = setTimeout(() => playSound('progress'), 620);
    return () => clearTimeout(tick);
  }, []);

  const otterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: otterScale.value },
      { translateY: otterY.value },
    ],
  }));

  const levelStyle = useAnimatedStyle(() => ({
    width: `${levelProgress.value * 100}%`,
  }));

  return (
    <View style={styles.screen}>
      {/* Explosion de paillettes */}
      <Confetti count={48} />

      <View style={{ height: 90 }} />

      <Animated.View style={[styles.otterWrap, otterStyle]}>
        <Otter size={124} />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(250).springify()} style={styles.title}>
        Leçon terminée !
      </Animated.Text>

      {/* Stats */}
      <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.statsCard}>
        <View style={styles.statCol}>
          <Feather name="zap" size={28} color="#E0A800" />
          <Text style={styles.statVal}>{xpGained != null ? `+${xpGained}` : '+0'} XP</Text>
          <Text style={styles.statLabel}>Points gagnés</Text>
        </View>
        <View style={styles.statCol}>
          <Feather name="target" size={28} color="#E0584F" />
          <Text style={styles.statVal}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Précision</Text>
        </View>
        <View style={styles.statCol}>
          <Feather name="clock" size={28} color="#6B7280" />
          <Text style={styles.statVal}>{durationMs > 0 ? formatDuration(durationMs) : '—'}</Text>
          <Text style={styles.statLabel}>Durée</Text>
        </View>
      </Animated.View>

      {/* Streak */}
      <Animated.View entering={FadeInDown.delay(650).springify()} style={styles.streakBadge}>
        <Text style={{ fontSize: 20 }}>🔥</Text>
        <Text style={styles.streakText}>
          {streak > 0 ? `Série de ${streak} jour${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''} !` : 'Commence ta série !'}
        </Text>
      </Animated.View>

      {/* Niveau */}
      <Animated.View entering={FadeInDown.delay(800)} style={styles.levelTrack}>
        <Animated.View style={[styles.levelFill, levelStyle]} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInDown.delay(950).springify()} style={{ width: '100%' }}>
        <Pressable style={styles.cta} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
          <Text style={styles.ctaLabel}>Continuer</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#6B4DFF', alignItems: 'center', paddingHorizontal: 28 },
  otterWrap: { alignItems: 'center' },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, color: '#fff', textAlign: 'center', marginTop: 18 },
  statsCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 22, padding: 24,
    flexDirection: 'row', justifyContent: 'space-around', marginTop: 28,
  },
  statCol: { alignItems: 'center' },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#2A9E1C', marginTop: 4 },
  statLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
  streakBadge: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24,
  },
  streakText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  levelTrack: { width: '100%', height: 14, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden', marginTop: 24 },
  levelFill: { height: '100%', backgroundColor: '#fff', borderRadius: 8 },
  cta: {
    width: '100%', height: 62, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 38,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#6B4DFF' },
});
