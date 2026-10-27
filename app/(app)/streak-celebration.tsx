/**
 * Célébration de la série — affichée après la PREMIÈRE leçon du jour, quand la
 * série renvoyée par le serveur (POST /lesson/complete) dépasse celle d'avant.
 * C'est `lesson/finish.tsx` qui détecte la hausse et nous ouvre ; on reçoit la
 * série et l'XP de la leçon en paramètres, tous deux issus de la réponse
 * serveur.
 *
 * Déroulé : une braise crépite, la flamme s'embrase (flash, anneau, éclats),
 * le compteur défile jusqu'à la série, puis la semaine se remplit jour par
 * jour. Les jours actifs viennent de GET /me/activity, pas d'un calcul local.
 *
 * Partage : la carte story (`StreakShareCard`) est capturée en PNG 1080×1920.
 * ⚠️ `react-native-view-shot`, `expo-sharing` et `expo-media-library` sont
 * natifs : absents d'Expo Go, d'où le chargement paresseux ci-dessous.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Defs, RadialGradient, Stop, Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence,
  interpolate, Easing, FadeIn, FadeInUp, ZoomIn, SlideInDown,
} from 'react-native-reanimated';
import Otter from '../../components/Otter';
import CountUp from '../../components/CountUp';
import { FlameLayer } from '../../components/StreakFlame';
import StreakShareCard, { SHARE_WIDTH, SHARE_HEIGHT, type WeekDay } from '../../components/StreakShareCard';
import { playSound } from '../../constants/sounds';
import { fetchActivity } from '../../lib/api';
import { useReviewPromptStore } from '../../store/reviewPromptStore';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../utils/useTheme';
import { useT } from '../../lib/i18n';

/** Instant où la braise devient flamme (ms) — tout le reste s'aligne dessus. */
const IGNITE = 1100;
const FLAME = 180;

const PALETTES = {
  light: {
    bg: '#FFF9F1', card: '#FFFFFF', ink: '#1C1A26', muted: '#8A8494',
    glow: '#FFC23D', glowOpacity: 0.32, groundShadow: 'rgba(255,170,60,0.28)',
    flameInk: '#E8601E', bubble: '#FFEFD9', empty: '#F0ECE6', soft: '#F4F1EC',
  },
  dark: {
    bg: '#100C0A', card: '#1B1614', ink: '#F4EFEA', muted: '#9A918A',
    glow: '#F4633A', glowOpacity: 0.3, groundShadow: 'rgba(255,120,50,0.25)',
    flameInk: '#FF8F4A', bubble: '#2A201B', empty: '#2A2320', soft: '#2A2320',
  },
};
type Palette = (typeof PALETTES)['light'];

/* ─── Modules natifs du partage (chargés à la demande) ─────────────────── */

type CaptureFn = (ref: unknown, opts: object) => Promise<string>;
interface SharingModule {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (url: string, options?: { mimeType?: string; UTI?: string }) => Promise<void>;
}
interface MediaLibraryModule {
  requestPermissionsAsync: (writeOnly?: boolean) => Promise<{ granted: boolean }>;
  saveToLibraryAsync: (uri: string) => Promise<void>;
}

function tryRequire<T>(load: () => T): T | null {
  try { return load(); } catch { return null; }
}
/* eslint-disable @typescript-eslint/no-require-imports */
const loadCapture = () =>
  tryRequire(() => (require('react-native-view-shot') as { captureRef?: CaptureFn }).captureRef ?? null);
const loadSharing = () =>
  tryRequire(() => {
    const m = require('expo-sharing') as Partial<SharingModule>;
    return m.isAvailableAsync && m.shareAsync ? (m as SharingModule) : null;
  });
const loadMediaLibrary = () =>
  tryRequire(() => {
    const m = require('expo-media-library') as Partial<MediaLibraryModule>;
    return m.requestPermissionsAsync && m.saveToLibraryAsync ? (m as MediaLibraryModule) : null;
  });
/* eslint-enable @typescript-eslint/no-require-imports */

/* ─── Semaine en cours (lundi → dimanche) ──────────────────────────────── */

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Jours actifs de la semaine, lus sur GET /me/activity (un appel par mois
 * touché : la semaine peut chevaucher deux mois). Aujourd'hui est compté
 * d'office — on arrive ici justement parce qu'une leçon vient d'être validée.
 */
function useWeek(lang: string) {
  const today = useMemo(() => new Date(), []);
  const todayIdx = (today.getDay() + 6) % 7;
  const [active, setActive] = useState<Set<string>>(() => new Set([dayKey(today)]));

  useEffect(() => {
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIdx);
    const months = Array.from(new Set([dayKey(monday).slice(0, 7), dayKey(today).slice(0, 7)]));
    let alive = true;
    Promise.all(months.map((m) => fetchActivity(m)))
      .then((lists) => {
        if (!alive) return;
        setActive(new Set([dayKey(today), ...lists.flat()]));
      })
      .catch(() => { /* hors-ligne : on garde au moins aujourd'hui */ });
    return () => { alive = false; };
  }, [today, todayIdx]);

  return useMemo(() => {
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIdx);
    const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        label: d.toLocaleDateString(lang, { weekday: 'narrow' }).toUpperCase(),
        done: i <= todayIdx && active.has(dayKey(d)),
        today: i === todayIdx,
      };
    });
    // Jours d'affilée terminés aujourd'hui, dans la semaine.
    let run = 0;
    for (let i = todayIdx; i >= 0 && days[i]!.done; i--) run++;
    return { days, todayIdx, run };
  }, [active, today, todayIdx, lang]);
}

/* ─── Pièces animées de la flamme ──────────────────────────────────────── */

/** Lueur chaude derrière tout l'écran, qui respire. */
function Glow({ color, opacity }: { color: string; opacity: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 1], [0.75, 1]),
    transform: [{ scale: interpolate(v.value, [0, 1], [1, 1.08]) }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, style]}>
      <Svg width={520} height={520}>
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.62" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={260} cy={260} r={260} fill="url(#glow)" />
      </Svg>
    </Animated.View>
  );
}

/** Disque à dégradé radial (braise, flash). */
function RadialDot({ size, stops }: { size: number; stops: [string, number][] }) {
  const id = `r${size}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {stops.map(([c, o], i) => <Stop key={i} offset={o} stopColor={c} stopOpacity={i === stops.length - 1 ? 0 : 1} />)}
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Braise qui couve avant l'embrasement. */
function Ember() {
  const s = useSharedValue(0.2);
  const o = useSharedValue(0);
  useEffect(() => {
    const t = (v: number, d: number) => withTiming(v, { duration: d, easing: Easing.in(Easing.quad) });
    o.value = withSequence(withTiming(1, { duration: 230 }), withDelay(IGNITE - 230, withTiming(0, { duration: 120 })));
    s.value = withSequence(t(0.7, 230), t(0.55, 290), t(1, 290), t(0.8, 170), t(1.6, 170));
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[styles.abs, { left: 78, top: 136 }, style]}>
      <RadialDot size={24} stops={[['#FFF6E4', 0], ['#FFC23D', 0.4], ['#F4633A', 0.72]]} />
    </Animated.View>
  );
}

/** Étincelle projetée par la braise. */
function Spark({ angle, delay, color, size }: { angle: number; delay: number; color: string; size: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.25, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(p.value, [0, 0.25, 1], [0, -10, -46]) },
      { scale: interpolate(p.value, [0, 0.25, 1], [0.3, 1, 0.2]) },
    ],
  }));
  return (
    <View style={[styles.abs, { left: 88, top: 148, transform: [{ rotate: `${angle}deg` }] }]}>
      <Animated.View
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color,
          shadowColor: color, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, style]}
      />
    </View>
  );
}

/** Flash + onde de choc à l'embrasement. */
function Blast() {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(IGNITE, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, []);
  const flash = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.78, 1], [p.value > 0 ? 1 : 0, 0, 0]),
    transform: [{ scale: interpolate(p.value, [0, 0.78], [0.15, 1.7], 'clamp') }],
  }));
  const ring = useAnimatedStyle(() => ({
    opacity: p.value > 0 ? 1 - p.value : 0,
    transform: [{ scale: interpolate(p.value, [0, 1], [0.2, 1.9]) }],
  }));
  return (
    <>
      <Animated.View style={[styles.abs, { left: -10, top: 10 }, flash]}>
        <RadialDot size={200} stops={[['#FFF6E4', 0], ['#FFD36B', 0.35], ['#FF9A3D', 0.7]]} />
      </Animated.View>
      <Animated.View style={[styles.abs, styles.ring, ring]} />
    </>
  );
}

/** Éclat de flamme projeté vers l'extérieur. */
function Shard({ angle, delay, big, color }: { angle: number; delay: number; big: boolean; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 750, easing: Easing.bezier(0.15, 0.7, 0.3, 1) }));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: p.value > 0 ? 1 - p.value : 0,
    transform: [
      { translateY: interpolate(p.value, [0, 1], [0, -120]) },
      { scale: interpolate(p.value, [0, 1], [0.4, 0.15]) },
    ],
  }));
  const w = big ? 10 : 7;
  return (
    <View style={[styles.abs, { left: 88, top: 110, transform: [{ rotate: `${angle}deg` }] }]}>
      <Animated.View style={[{ width: w, height: w * 2.2, borderRadius: w, backgroundColor: color }, style]} />
    </View>
  );
}

/** La flamme elle-même : jaillit, puis vacille en boucle. */
function Flame() {
  const ignite = useSharedValue(0);
  const flick = useSharedValue(0);
  const inner = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.quad);
    ignite.value = withDelay(IGNITE, withSequence(
      withTiming(1, { duration: 315, easing: e }),
      withTiming(2, { duration: 225, easing: e }),
      withTiming(3, { duration: 180, easing: e }),
      withTiming(4, { duration: 180, easing: e }),
    ));
    flick.value = withDelay(IGNITE + 900, withRepeat(withTiming(4, { duration: 1800, easing: Easing.linear }), -1));
    inner.value = withRepeat(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const igniteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ignite.value, [0, 0.3, 1], [0, 1, 1]),
    transform: [
      { scaleX: interpolate(ignite.value, [0, 1, 2, 3, 4], [0, 1.3, 0.92, 1.06, 1]) },
      { scaleY: interpolate(ignite.value, [0, 1, 2, 3, 4], [0, 1.55, 1.05, 0.97, 1]) },
    ],
  }));
  const flickStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: interpolate(flick.value, [0, 1, 2, 3, 4], [1, 1.03, 0.97, 1.02, 1]) },
      { scaleY: interpolate(flick.value, [0, 1, 2, 3, 4], [1, 0.97, 1.04, 0.98, 1]) },
      { rotate: `${interpolate(flick.value, [0, 1, 2, 3, 4], [0, -2, 1.5, -1, 0])}deg` },
    ],
  }));
  const innerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(inner.value, [0, 1], [0, -5]) },
      { scaleX: interpolate(inner.value, [0, 1], [1, 1.06]) },
      { scaleY: interpolate(inner.value, [0, 1], [1, 0.96]) },
    ],
  }));

  return (
    <Animated.View style={[styles.flameBox, igniteStyle]}>
      <Animated.View style={[styles.flameBox, flickStyle]}>
        <View style={styles.abs}><FlameLayer part="outer" size={FLAME} /></View>
        <Animated.View style={[styles.flameBox, innerStyle]}><FlameLayer part="inner" size={FLAME} /></Animated.View>
        <View style={styles.abs}><FlameLayer part="core" size={FLAME} /></View>
      </Animated.View>
    </Animated.View>
  );
}

/** Petite étoile scintillante autour de la flamme. */
function Twinkle({ size, color, delay, period, pos }: {
  size: number; color: string; delay: number; period: number;
  pos: { left?: number; right?: number; top?: number; bottom?: number };
}) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: period / 2, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 1], [0.25, 1]),
    transform: [{ scale: interpolate(v.value, [0, 1], [0.6, 1.1]) }, { rotate: `${v.value * 20}deg` }],
  }));
  return (
    <Animated.View entering={FadeIn.delay(delay - 200)} style={[styles.abs, pos]}>
      <Animated.View style={style}>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 0c1 6 5 10 12 12-7 2-11 6-12 12-1-6-5-10-12-12 7-2 11-6 12-12z" fill={color} />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const SPARKS = [-70, -35, 10, 50, -15, 75, -55, 30, 0, -80, 60, -25]
  .map((angle, i) => ({ angle, delay: [0, 120, 50, 200, 330, 400, 500, 580, 700, 780, 850, 920][i]!, i }));
const SHARDS = [0, 33.7, 51.4, 85.1, 102.9, 136.6, 154.3, 188, 205.7, 239.4, 257.1, 290.9, 308.6, 342.3];
const SHARD_COLORS = ['#FFC23D', '#F4633A', '#FFE7A0'];

/* ─── Loutre essoufflée ────────────────────────────────────────────────── */

function PantingOtter() {
  const pant = useSharedValue(0);
  const blush = useSharedValue(0);
  useEffect(() => {
    pant.value = withRepeat(withTiming(1, { duration: 250, easing: Easing.inOut(Easing.sin) }), -1, true);
    blush.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
  }, []);
  const pantStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 + pant.value * 0.03 }, { scaleY: 1 - pant.value * 0.03 }],
  }));
  const blushStyle = useAnimatedStyle(() => ({ opacity: 0.75 + blush.value * 0.25 }));

  return (
    <View style={{ width: 78, height: 78, marginBottom: -6 }}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.bottomOrigin, pantStyle]}>
        <Otter size={78} />
        <Animated.View style={[styles.blush, { left: 22 }, blushStyle]} />
        <Animated.View style={[styles.blush, { left: 46 }, blushStyle]} />
        <SweatDrop left={58} top={9} w={6} delay={0} />
        <SweatDrop left={17} top={12} w={5} delay={700} />
      </Animated.View>
      <View style={styles.heatRow}>
        {[0, 250, 500].map((d) => <HeatWave key={d} delay={d} />)}
      </View>
    </View>
  );
}

function SweatDrop({ left, top, w, delay }: { left: number; top: number; w: number; delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1400, easing: Easing.in(Easing.quad) }), -1));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.15, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(p.value, [0, 0.15, 1], [0, 0, 16]) },
      { scale: interpolate(p.value, [0, 0.15, 1], [0.6, 1, 0.8]) },
    ],
  }));
  return (
    <Animated.View
      style={[styles.abs, { left, top, width: w, height: w * 1.35, borderRadius: w, borderTopLeftRadius: w * 0.3,
        backgroundColor: '#7FD3FF', transform: [{ rotate: '45deg' }] }, style]}
    />
  );
}

function HeatWave({ delay }: { delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }), -1));
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.3, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(p.value, [0, 0.5, 1], [4, -2, -10]) },
      { skewX: `${interpolate(p.value, [0, 0.5, 1], [0, 18, -18])}deg` },
    ],
  }));
  return <Animated.View style={[styles.heat, style]} />;
}

/* ─── Écran ────────────────────────────────────────────────────────────── */

export default function StreakCelebrationScreen() {
  const router = useRouter();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const P: Palette = T.isDark ? PALETTES.dark : PALETTES.light;
  const lang = useUserStore((s) => s.language);
  const storeStreak = useUserStore((s) => s.streak);
  const params = useLocalSearchParams<{ streak?: string; xp?: string; review?: string }>();

  const streak = Number(params.streak) || storeStreak;
  const xp = Number(params.xp) || 0;
  const { days, todayIdx, run } = useWeek(lang);
  const unitLabel = tr(streak > 1 ? 'streakCelebration.daysInARow' : 'streakCelebration.dayInARow');

  useEffect(() => {
    const t = setTimeout(() => {
      playSound('progress');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, IGNITE);
    return () => clearTimeout(t);
  }, []);

  const goNext = useCallback(() => {
    // La pré-question de notation a été décidée sur l'écran de fin ; on la
    // déclenche ici, une fois la célébration passée.
    if (params.review === '1') {
      const review = useReviewPromptStore.getState();
      if (review.canPrompt()) review.show();
    }
    router.replace('/(app)/(tabs)/parcours');
  }, [params.review, router]);

  /* Partage */
  const [shareOpen, setShareOpen] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<View>(null);
  const capture = useRef(loadCapture()).current;
  const sharing = useRef(loadSharing()).current;
  const media = useRef(loadMediaLibrary()).current;
  const canShare = !!capture && !!sharing;
  const canSave = !!capture && !!media;

  const snap = useCallback(async () => {
    if (!capture) throw new Error('no view-shot');
    return capture(cardRef, { format: 'png', quality: 1, width: SHARE_WIDTH, height: SHARE_HEIGHT, result: 'tmpfile' });
  }, [capture]);

  const onShare = useCallback(async () => {
    if (!canShare || busy) return;
    setBusy(true);
    try {
      const uri = await snap();
      if (await sharing!.isAvailableAsync()) {
        await sharing!.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
      }
    } catch {
      /* partage annulé : rien à signaler */
    } finally {
      setBusy(false);
    }
  }, [canShare, busy, snap, sharing]);

  const onSave = useCallback(async () => {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      const perm = await media!.requestPermissionsAsync(true);
      if (!perm.granted) throw new Error('denied');
      await media!.saveToLibraryAsync(await snap());
      setStatus({ ok: true, msg: tr('streakCelebration.saved') });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => { setShareOpen(false); setStatus(null); }, 1400);
    } catch {
      setStatus({ ok: false, msg: tr('streakCelebration.saveFailed') });
    } finally {
      setBusy(false);
    }
  }, [canSave, busy, media, snap, tr]);

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }),
    [lang],
  );

  const firstDone = todayIdx - run + 1;

  return (
    <View style={[styles.screen, { backgroundColor: P.bg, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
      <Glow color={P.glow} opacity={P.glowOpacity} />

      {/* En-tête */}
      <View style={styles.topRow}>
        <Pressable
          onPress={goNext}
          accessibilityLabel={tr('streakCelebration.close')}
          style={[styles.iconBtn, { backgroundColor: P.card }, T.isDark ? styles.darkEdge : styles.shadow]}
        >
          <Feather name="x" size={20} color={P.ink} />
        </Pressable>
        {xp > 0 && (
          <Animated.View
            entering={ZoomIn.delay(1300).duration(500)}
            style={[styles.xpPill, { backgroundColor: P.card }, T.isDark ? styles.darkEdge : styles.shadow]}
          >
            <Feather name="zap" size={14} color="#6B4DFF" />
            <Text style={styles.xpText}>+{xp} XP</Text>
          </Animated.View>
        )}
      </View>

      {/* Flamme */}
      <View style={styles.flameWrap}>
        <View style={styles.flameStage}>
          <Animated.View entering={FadeIn.delay(IGNITE).duration(300)} style={[styles.groundShadow, { backgroundColor: P.groundShadow }]} />
          <Ember />
          {SPARKS.map((s) => (
            <Spark key={s.i} angle={s.angle} delay={s.delay} size={s.i % 3 === 0 ? 6 : 4} color={s.i % 2 ? '#FFD36B' : '#FF9A3D'} />
          ))}
          <Blast />
          <Flame />
          {SHARDS.map((a, i) => (
            <Shard key={i} angle={a} big={i % 2 === 0} delay={IGNITE + (i % 3) * 30} color={SHARD_COLORS[i % 3]!} />
          ))}
          <Twinkle size={28} color="#FFC23D" delay={1500} period={1600} pos={{ right: -18, top: 14 }} />
          <Twinkle size={18} color="#FF9A3D" delay={1600} period={1900} pos={{ left: -14, top: 70 }} />
          <Twinkle size={14} color="#FFC23D" delay={1700} period={2200} pos={{ right: -4, bottom: 30 }} />
        </View>
      </View>

      {/* Compteur */}
      <CountUp value={streak} delay={IGNITE + 50} duration={1100} style={styles.count} />
      <Animated.Text entering={FadeInUp.delay(500).duration(500)} style={[styles.unit, { color: P.flameInk }]}>
        {unitLabel}
      </Animated.Text>

      {/* Semaine */}
      <Animated.View
        entering={FadeInUp.delay(700).duration(500)}
        style={[styles.weekCard, { backgroundColor: P.card }, T.isDark ? styles.darkEdge : styles.shadow]}
      >
        {days.map((d, i) => {
          const prev = d.done && !!days[i - 1]?.done;
          const next = d.done && !!days[i + 1]?.done;
          const r = (on: boolean) => (on ? 0 : 19);
          return (
            <View key={i} style={styles.dayCol}>
              <Text style={[styles.dayLabel, { color: d.today ? P.flameInk : P.muted }]}>{d.label}</Text>
              <View style={{ alignSelf: 'stretch', paddingLeft: prev ? 0 : 3, paddingRight: next ? 0 : 3 }}>
                {d.done ? (
                  <Animated.View
                    entering={ZoomIn.delay(900 + Math.max(0, i - firstDone) * 180).duration(450)}
                    style={[styles.dayPill, styles.dayDone, {
                      borderTopLeftRadius: r(prev), borderBottomLeftRadius: r(prev),
                      borderTopRightRadius: r(next), borderBottomRightRadius: r(next),
                    }]}
                  >
                    <Feather name="check" size={17} color="#fff" />
                  </Animated.View>
                ) : (
                  <View style={[styles.dayPill, { backgroundColor: P.empty, borderRadius: 19 }]} />
                )}
              </View>
            </View>
          );
        })}
      </Animated.View>

      {/* Loutre */}
      <Animated.View entering={FadeInUp.delay(1500).duration(500)} style={styles.otterRow}>
        <PantingOtter />
        <View style={[styles.bubble, { backgroundColor: P.bubble }]}>
          <Text style={[styles.bubbleText, { color: P.ink }]}>
            {tr('streakCelebration.bubbleLead')}{' '}
            <Text style={{ color: P.flameInk, fontFamily: 'Nunito_900Black' }}>
              {tr(run > 1 ? 'streakCelebration.bubbleRun' : 'streakCelebration.bubbleRunOne', { n: run })}
            </Text>{' '}
            {tr('streakCelebration.bubbleTail')}
          </Text>
        </View>
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* Actions */}
      <Animated.View entering={FadeInUp.delay(1700).duration(500)} style={styles.actions}>
        <Pressable
          onPress={() => { setStatus(null); setShareOpen(true); }}
          style={[styles.shareBtn, { backgroundColor: P.card }, T.isDark ? styles.darkEdge : styles.shadow]}
        >
          <Feather name="share" size={19} color={P.ink} />
          <Text style={[styles.shareLabel, { color: P.ink }]}>{tr('streakCelebration.share')}</Text>
        </Pressable>
        <Pressable onPress={goNext} style={styles.cta}>
          <Text style={styles.ctaLabel}>{tr('streakCelebration.continue')}</Text>
        </Pressable>
      </Animated.View>

      {/* Feuille de partage */}
      <Modal visible={shareOpen} transparent animationType="none" onRequestClose={() => setShareOpen(false)} statusBarTranslucent>
        <View style={styles.sheetRoot}>
          <Animated.View entering={FadeIn.duration(250)} style={StyleSheet.absoluteFill}>
            <Pressable style={styles.backdrop} onPress={() => setShareOpen(false)} />
          </Animated.View>
          <Animated.View
            entering={SlideInDown.duration(350)}
            style={[styles.sheet, { backgroundColor: P.card, paddingBottom: insets.bottom + 24 }]}
          >
            <View style={[styles.grabber, { backgroundColor: P.muted }]} />
            <View style={styles.sheetHead}>
              <Text style={[styles.sheetTitle, { color: P.ink }]}>{tr('streakCelebration.sheetTitle')}</Text>
              <Text style={[styles.sheetFormat, { color: P.muted }]}>{tr('streakCelebration.sheetFormat')}</Text>
            </View>

            <View style={styles.cardShadow}>
              <View ref={cardRef} collapsable={false}>
                <StreakShareCard
                  streak={streak}
                  unitLabel={unitLabel}
                  dateLabel={dateLabel}
                  tagline={tr('streakCelebration.cardTagline')}
                  week={days}
                />
              </View>
            </View>

            {canShare || canSave ? (
              <View style={styles.targets}>
                {canSave && (
                  <Pressable onPress={onSave} disabled={busy} style={[styles.target, { backgroundColor: P.soft, opacity: busy ? 0.6 : 1 }]}>
                    <Feather name="download" size={20} color={P.ink} />
                    <Text style={[styles.targetLabel, { color: P.ink }]}>{tr('streakCelebration.save')}</Text>
                  </Pressable>
                )}
                {canShare && (
                  <Pressable onPress={onShare} disabled={busy} style={[styles.target, styles.targetMain, { opacity: busy ? 0.6 : 1 }]}>
                    <Feather name="send" size={20} color="#fff" />
                    <Text style={[styles.targetLabel, { color: '#fff' }]}>{tr('streakCelebration.shareAction')}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <Text style={[styles.status, { color: P.muted }]}>{tr('streakCelebration.unavailable')}</Text>
            )}
            {status && (
              <Text style={[styles.status, { color: status.ok ? '#2E9A5A' : '#E0584F' }]}>{status.msg}</Text>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 22, overflow: 'hidden' },
  abs: { position: 'absolute' },
  glow: { position: 'absolute', alignSelf: 'center', top: 70 },
  shadow: {
    shadowColor: '#502800', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  darkEdge: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  xpPill: { height: 34, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpText: { fontFamily: 'Nunito_900Black', fontSize: 13, color: '#6B4DFF' },

  flameWrap: { alignItems: 'center', marginTop: 26 },
  flameStage: { width: FLAME, height: FLAME },
  flameBox: { position: 'absolute', left: 0, top: 0, width: FLAME, height: FLAME, transformOrigin: '50% 92%' },
  groundShadow: { position: 'absolute', left: 30, right: 30, bottom: 2, height: 22, borderRadius: 60 },
  ring: { left: 20, top: 40, width: 140, height: 140, borderRadius: 70, borderWidth: 5, borderColor: '#FFC23D' },

  count: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 104, lineHeight: 112, textAlign: 'center', marginTop: 14,
    color: '#F4633A', letterSpacing: -2,
    textShadowColor: 'rgba(255,177,61,0.55)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 12,
  },
  unit: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, textAlign: 'center', marginTop: -8 },

  weekCard: { flexDirection: 'row', marginTop: 28, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 12, borderRadius: 24 },
  dayCol: { flex: 1, alignItems: 'center', gap: 8 },
  dayLabel: { fontFamily: 'Nunito_900Black', fontSize: 13 },
  dayPill: { height: 38, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  dayDone: { backgroundColor: '#F4633A', borderWidth: 2.5, borderColor: '#FFC23D' },

  otterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 18 },
  bottomOrigin: { transformOrigin: '50% 100%' },
  blush: {
    position: 'absolute', top: 23, width: 10, height: 7, borderRadius: 5, backgroundColor: 'rgba(255,80,60,0.7)',
  },
  heatRow: { position: 'absolute', left: 24, top: -14, flexDirection: 'row', gap: 7 },
  heat: { width: 3, height: 12, borderRadius: 2, backgroundColor: 'rgba(255,140,60,0.7)' },
  bubble: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderBottomLeftRadius: 6 },
  bubbleText: { fontFamily: 'Nunito_700Bold', fontSize: 14, lineHeight: 20 },

  actions: { flexDirection: 'row', gap: 10 },
  shareBtn: { height: 56, paddingHorizontal: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 8 },
  shareLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },
  cta: {
    flex: 1, height: 56, borderRadius: 18, backgroundColor: '#F4633A', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: '#C9441E',
    shadowColor: '#F4633A', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },

  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, paddingHorizontal: 20 },
  grabber: { width: 40, height: 5, borderRadius: 3, opacity: 0.4, alignSelf: 'center', marginBottom: 14 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19 },
  sheetFormat: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  cardShadow: {
    alignSelf: 'center', marginTop: 14, borderRadius: 24,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 17, shadowOffset: { width: 0, height: 14 }, elevation: 8,
  },
  targets: { flexDirection: 'row', gap: 10, marginTop: 18 },
  target: { flex: 1, height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  targetMain: { backgroundColor: '#F4633A' },
  targetLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },
  status: { marginTop: 14, textAlign: 'center', fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
});
