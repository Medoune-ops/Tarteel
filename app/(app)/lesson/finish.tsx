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
import CountUp from '../../../components/CountUp';
import { playSound } from '../../../constants/sounds';
import { useUserStore } from '../../../store/userStore';
import { completeLesson } from '../../../lib/api';
import { invalidate } from '../../../lib/api/swr';
import { useT } from '../../../lib/i18n';

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
  const tr = useT();
  const params = useLocalSearchParams<{
    lessonId?: string;
    correct?: string;
    total?: string;
    durationMs?: string;
  }>();

  // Valeurs affichées : par défaut, l'état courant du store (déjà hydraté).
  const streak = useUserStore((s) => s.streak);
  const precision = useUserStore((s) => s.precision);

  const total = Number(params.total) || 0;
  const correct = Number(params.correct) || 0;
  const durationMs = Number(params.durationMs) || 0;
  // Précision de CETTE leçon si on a les compteurs, sinon précision globale du store.
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : precision;

  // XP gagnés sur cette leçon : lus directement de la réponse serveur (pas un
  // delta client) — c'est ce qui permet aussi de savoir si le boost ×2 était
  // actif, une info qu'un simple diff avant/après ne peut pas donner.
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [doubleXpWasActive, setDoubleXpWasActive] = useState(false);
  // Évite un double appel (StrictMode / re-render).
  const completedRef = useRef(false);

  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (!params.lessonId) return; // maquette / pas de leçon réelle : rien à enregistrer
    completeLesson({
      lessonId: params.lessonId,
      correctAnswers: correct,
      totalAnswers: total,
      durationMs: durationMs || undefined,
    })
      .then((data) => {
        console.log('[finish] completeLesson OK', data);
        setXpGained(data.xpGained ?? 0);
        setDoubleXpWasActive(!!data.doubleXpWasActive);
        // Leçon validée → parcours, classement et calendrier d'activité ont
        // changé : forcer un vrai re-fetch au prochain affichage.
        invalidate('sections');
        invalidate('league');
        invalidate(`activity:${new Date().toISOString().slice(0, 7)}`);
      })
      .catch((err) => {
        console.log('[finish] completeLesson FAILED', err);
        /* hors-ligne : la progression reste locale, resync au prochain /me */
      });
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
      1150,
      withTiming(LEVEL_TARGET, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );

    // Fanfare de fin à l'apparition + petit "tick" quand la barre de niveau démarre.
    playSound('finish');
    const tick = setTimeout(() => playSound('progress'), 1170);
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
        {tr('finish.title')}
      </Animated.Text>

      {/* Stats — chaque colonne apparaît en séquence, puis sa valeur défile indépendamment */}
      <View style={styles.statsCard}>
        <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.statCol}>
          <View style={[styles.statIconWrap, { backgroundColor: '#FFF3D6' }]}>
            <Feather name="zap" size={24} color="#E0A800" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <CountUp
              value={xpGained ?? 0}
              prefix="+"
              suffix=" XP"
              delay={550}
              duration={850}
              style={styles.statVal}
            />
            {doubleXpWasActive && (
              <View style={styles.doubleXpBadge}>
                <Text style={styles.doubleXpBadgeText}>×2</Text>
              </View>
            )}
          </View>
          <Text style={styles.statLabel}>{tr('finish.xpGained')}</Text>
        </Animated.View>
        <View style={styles.statDivider} />
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.statCol}>
          <View style={[styles.statIconWrap, { backgroundColor: '#FCE4E2' }]}>
            <Feather name="target" size={24} color="#E0584F" />
          </View>
          <CountUp value={accuracy} suffix="%" delay={700} duration={850} style={[styles.statVal, { marginTop: 10 }]} />
          <Text style={styles.statLabel}>{tr('finish.accuracy')}</Text>
        </Animated.View>
        <View style={styles.statDivider} />
        <Animated.View entering={FadeInDown.delay(750).springify()} style={styles.statCol}>
          <View style={[styles.statIconWrap, { backgroundColor: '#EBEDF0' }]}>
            <Feather name="clock" size={24} color="#6B7280" />
          </View>
          {durationMs > 0 ? (
            <CountUp
              value={durationMs}
              format={formatDuration}
              delay={850}
              duration={850}
              style={[styles.statVal, { marginTop: 10 }]}
            />
          ) : (
            <Text style={[styles.statVal, { marginTop: 10 }]}>—</Text>
          )}
          <Text style={styles.statLabel}>{tr('finish.duration')}</Text>
        </Animated.View>
      </View>

      {/* Streak */}
      <Animated.View entering={FadeInDown.delay(1000).springify()} style={styles.streakBadge}>
        <Text style={{ fontSize: 20 }}>🔥</Text>
        <Text style={styles.streakText}>
          {streak > 0 ? tr(streak > 1 ? 'finish.streakDays' : 'finish.streakDay', { n: streak }) : tr('finish.streakStart')}
        </Text>
      </Animated.View>

      {/* Niveau */}
      <Animated.View entering={FadeInDown.delay(1150)} style={styles.levelTrack}>
        <Animated.View style={[styles.levelFill, levelStyle]} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInDown.delay(1300).springify()} style={{ width: '100%' }}>
        <Pressable style={styles.cta} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
          <Text style={styles.ctaLabel}>{tr('finish.continue')}</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 6,
  },
  statCol: { alignItems: 'center', flex: 1 },
  statIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  statDivider: { width: 1, height: 48, backgroundColor: '#EDEDF2' },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  statLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
  doubleXpBadge: {
    backgroundColor: '#6B4DFF', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  doubleXpBadgeText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: '#fff' },
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
