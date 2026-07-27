import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
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
import { saveOnboarding, fetchSections } from '../../lib/api';
import { useT } from '../../lib/i18n';

const DAILY_MINUTES_LABELS: Record<number, string> = {
  5: '1 leçon courte par jour',
  10: '2 leçons par jour',
  20: '3–4 leçons par jour',
  30: '5–6 leçons + révisions SRS',
};

interface StartingSection {
  titre: string;
  lessonsTotal: number;
  lessonsDone: number;
}

export default function PlanScreen() {
  const router = useRouter();
  const tr = useT();
  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const dailyMinutes = useUserStore((s) => s.dailyMinutes);

  const [loading, setLoading] = useState(true);
  const [startingSection, setStartingSection] = useState<StartingSection | null>(null);

  const otterScale = useSharedValue(0);
  const otterRot   = useSharedValue(0);

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
  }, []);

  // Persiste les choix du setup + onboardingDone côté serveur DÈS l'arrivée
  // sur cet écran (pas seulement au clic final comme avant) : c'est ce qui
  // fait passer le point de départ réel du parcours (applyOnboardingStart) —
  // sans cet appel, impossible de savoir quelle unité/combien de leçons
  // afficher, le texte restait donc figé quel que soit le vrai choix de
  // l'utilisateur (niveau, sourates cochées).
  useEffect(() => {
    (async () => {
      const { level, objectif, dailyMinutes: dm, memorizedSourates } = useUserStore.getState();
      try {
        await saveOnboarding({ level, objectif, dailyMinutes: dm, sourates: memorizedSourates });
        const sections = await fetchSections();
        const active = sections.find((s) => s.nodes.some((n) => n.state === 'active'));
        if (active) {
          setStartingSection({
            titre: active.titre,
            lessonsTotal: active.nodes.length,
            lessonsDone: active.nodes.filter((n) => n.state === 'completed').length,
          });
        }
      } catch {
        // Hors-ligne : on continue quand même avec l'écran générique ; la
        // prochaine session /me rattrapera l'état une fois le réseau revenu.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const otterStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: otterScale.value },
      { rotate: `${otterRot.value}rad` },
    ],
  }));

  const start = () => {
    completeOnboarding();
    router.replace('/(app)/(tabs)/parcours');
  };

  const progressPct = startingSection && startingSection.lessonsTotal > 0
    ? Math.round((startingSection.lessonsDone / startingSection.lessonsTotal) * 100)
    : 0;

  return (
    <View style={styles.screen}>
      <Confetti count={48} />

      <View style={{ height: 110 }} />

      <Animated.View style={[styles.otterWrap, otterStyle]}>
        <Otter size={124} />
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(250).springify()} style={styles.title}>
        {tr('plan.title')}
      </Animated.Text>

      <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.card}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#6B4DFF" />
          </View>
        ) : (
          <>
            <View style={styles.cardTitleRow}>
              <Feather name="book" size={22} color="#6B4DFF" />
              <Text style={styles.cardTitle}>{startingSection?.titre ?? tr('plan.unit1')}</Text>
            </View>
            <Text style={styles.cardSub}>
              {startingSection
                ? `${startingSection.lessonsTotal} leçons · ${DAILY_MINUTES_LABELS[dailyMinutes] ?? `${dailyMinutes} min/j`}`
                : tr('plan.lessonsInfo')}
            </Text>
            <View style={styles.emptyBar}>
              <View style={[styles.filledBar, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.cardSub}>
              {startingSection
                ? `${startingSection.lessonsDone} / ${startingSection.lessonsTotal} leçons complétées`
                : tr('plan.progress')}
            </Text>
            <View style={styles.streakRow}>
              <Text style={{ fontSize: 19 }}>🔥</Text>
              <Text style={styles.streakText}>{tr('plan.streakActive')}</Text>
            </View>
          </>
        )}
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInDown.delay(700).springify()} style={{ width: '100%' }}>
        <Pressable style={styles.cta} onPress={start}>
          <Text style={styles.ctaLabel}>{tr('plan.startLesson1')}</Text>
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
    minHeight: 180, justifyContent: 'center',
  },
  loadingRow: { alignItems: 'center', paddingVertical: 20 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#1B2333' },
  cardSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 4 },
  emptyBar: { height: 10, borderRadius: 6, backgroundColor: '#EAECF0', marginVertical: 16, overflow: 'hidden' },
  filledBar: { height: '100%', borderRadius: 6, backgroundColor: '#34C724' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 },
  streakText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#2A9E1C' },
  cta: {
    width: '100%', height: 62, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 38,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#6B4DFF' },
});
