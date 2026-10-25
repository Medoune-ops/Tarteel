import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Alert,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceStatusBar from '../../components/StatusBar';
import { FlameIcon, GemIcon } from '../../components/IslamicIcons';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../utils/useTheme';
import { playSound } from '../../constants/sounds';
import { streakReward } from '../../constants/rewards';
import { setStreakGoalApi, claimStreakGoal } from '../../lib/api/rewards';
import { useT } from '../../lib/i18n';

const PRESETS = [7, 14, 30, 50, 100, 365];
const MAX_GOAL = 9999;

// ─── Palette de la maquette (Tarteel Noms et Objectif) ─────────────────────
type Palette = {
  bg: string; card: string; ink: string; muted: string;
  fire: readonly [string, string, string];
  fireSoft: string; fireInk: string; iceBg: string; dockBg: string;
  xpBg: string; xpFg: string; goldBg: string; goldBorder: string;
};
const LIGHT: Palette = {
  bg: '#F4F3F8', card: '#FFFFFF', ink: '#1A1730', muted: '#6F6B84',
  fire: ['#FF9A3D', '#F4633A', '#E5484D'],
  fireSoft: '#FFEDE6', fireInk: '#E5543A', iceBg: '#E5F1FC', dockBg: 'rgba(244,243,248,0)',
  xpBg: '#FFF4D6', xpFg: '#A86A00', goldBg: '#FFF7E4', goldBorder: '#F0CD7A',
};
const DARK: Palette = {
  bg: '#0C0B12', card: '#17151F', ink: '#EEEDF5', muted: '#918DA6',
  fire: ['#E2772A', '#C9442E', '#A8303A'],
  fireSoft: 'rgba(255,120,80,0.14)', fireInk: '#FF8A66', iceBg: 'rgba(58,142,224,0.16)', dockBg: 'rgba(12,11,18,0)',
  xpBg: 'rgba(255,200,80,0.14)', xpFg: '#FFC850', goldBg: 'rgba(224,160,44,0.12)', goldBorder: 'rgba(224,160,44,0.4)',
};
const G150 = { start: { x: 0.25, y: 0 }, end: { x: 0.75, y: 1 } };

const RING = 132;
const R = 58;
const C = 2 * Math.PI * R;

export default function StreakGoalScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = T.isDark ? DARK : LIGHT;
  const insets = useSafeAreaInsets();
  const streak = useUserStore((s) => s.streak);
  const streakGoal = useUserStore((s) => s.streakGoal);
  const [saving, setSaving] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const defaultGoal = streakGoal ?? PRESETS.find((p) => p > streak) ?? 30;
  const [picked, setPicked] = useState<number>(
    streakGoal != null && !PRESETS.includes(streakGoal) ? 30 : defaultGoal,
  );
  // Si l'objectif courant n'est pas un preset, on le met directement dans le champ libre.
  const [custom, setCustom] = useState<string>(
    streakGoal != null && !PRESETS.includes(streakGoal) ? String(streakGoal) : '',
  );

  // L'objectif effectif : le champ libre prime s'il est renseigné et valide.
  const customNum = parseInt(custom, 10);
  const customValid = custom !== '' && customNum >= 1 && customNum <= MAX_GOAL;
  const target = customValid ? customNum : picked;

  const goalReached = streakGoal != null && streak >= streakGoal;
  const ringProgress = Math.min(1, streak / target);
  const left = Math.max(0, target - streak);

  const claim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const gained = await claimStreakGoal();
      if (gained > 0) {
        playSound('finish');
        Alert.alert(tr('streakGoal.claimAlertTitle'), tr('streakGoal.claimAlertMsg', { n: gained }));
      }
    } catch {
      Alert.alert(tr('streakGoal.headerTitle'), tr('streakGoal.claimError'));
    } finally {
      setClaiming(false);
    }
  };

  const save = async () => {
    if (target < 1 || saving) return;
    setSaving(true);
    try {
      await setStreakGoalApi(target);
      playSound('start');
      router.back();
    } catch {
      Alert.alert(tr('streakGoal.headerTitle'), tr('streakGoal.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const pickPreset = (p: number) => {
    setPicked(p);
    setCustom(''); // un preset annule la saisie libre
  };

  const shadow = T.isDark ? styles.borderDark : styles.shadow;
  const presetSub = (d: number) => tr(`streakGoal.preset.${d}` as 'streakGoal.preset.7');

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      {/* Sur Android, `behavior={undefined}` ne fait RIEN : le clavier
          recouvre le champ actif sans que l'écran ne remonte. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Héros feu ── */}
          <LinearGradient colors={P.fire} locations={[0, 0.55, 1]} {...G150} style={styles.hero}>
            <DeviceStatusBar />
            <View style={styles.heroBar}>
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
                <Feather name="chevron-left" size={24} color="#B4361C" />
              </Pressable>
              <Text style={styles.heroTitle}>{tr('streakGoal.headerTitle')}</Text>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.ring}>
                <Svg width={RING} height={RING} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={10} />
                  <Circle
                    cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="#fff" strokeWidth={10}
                    strokeLinecap="round" strokeDasharray={`${Math.max(0.001, ringProgress * C)} ${C}`}
                  />
                </Svg>
                <FlameIcon size={30} color="#FFE07A" inner="#FFF3C2" />
                <Text style={styles.ringNum}>{streak}</Text>
                <Text style={styles.ringUnit}>{tr('streakGoal.unitDays')}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.heroLabel}>{tr('streakGoal.heroLabelCaps')}</Text>
                <Text style={styles.goalTitle}>{tr('streakGoal.goalTitle', { n: target })}</Text>
                <Text style={styles.goalLeft}>
                  {streak >= target
                    ? tr('streakGoal.goalReached')
                    : streak === 0
                      ? tr('streakGoal.goalStart', { n: target })
                      : tr('streakGoal.goalLeft', { n: left })}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* ── Cadeau à réclamer si l'objectif enregistré est atteint ── */}
          {goalReached && (
            <Pressable
              style={[styles.claim, { backgroundColor: P.goldBg, borderColor: P.goldBorder }, claiming && { opacity: 0.7 }]}
              onPress={claim}
              disabled={claiming}
            >
              <GemIcon size={26} color="#E0A02C" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.claimTitle, { color: P.ink }]}>{tr('streakGoal.claimTitle')}</Text>
                <Text style={[styles.claimSub, { color: P.muted }]}>
                  {tr('streakGoal.claimSub', { n: streakReward(streakGoal!).toLocaleString('fr-FR') })}
                </Text>
              </View>
              <View style={styles.claimBtn}>
                {claiming ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="gift" size={16} color="#fff" />}
              </View>
            </Pressable>
          )}

          {/* ── Choix de l'objectif ── */}
          <Text style={[styles.section, { color: P.muted }]}>
            {goalReached ? tr('streakGoal.sectionNewGoal') : tr('streakGoal.sectionChooseGoal')}
          </Text>
          <View style={styles.grid}>
            {PRESETS.map((d) => {
              const sel = !customValid && picked === d;
              return (
                <Pressable
                  key={d}
                  onPress={() => pickPreset(d)}
                  style={[
                    styles.preset, shadow,
                    { backgroundColor: sel ? P.fireSoft : P.card, borderColor: sel ? P.fireInk : 'transparent' },
                  ]}
                >
                  <Text style={[styles.presetNum, { color: sel ? P.fireInk : P.ink }]}>{d}</Text>
                  <Text style={[styles.presetSub, { color: P.muted }]}>{presetSub(d)}</Text>
                  <View style={[styles.xpPill, { backgroundColor: P.xpBg }]}>
                    <Text style={[styles.xpText, { color: P.xpFg }]}>
                      +{streakReward(d).toLocaleString('fr-FR')} XP
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* ── Objectif personnalisé ── */}
          <Text style={[styles.section, { color: P.muted }]}>{tr('streakGoal.sectionCustom')}</Text>
          <View
            style={[
              styles.custom, shadow,
              { backgroundColor: P.card, borderColor: customValid ? P.fireInk : 'transparent' },
            ]}
          >
            <Feather name="flag" size={20} color={P.muted} />
            <TextInput
              style={[styles.customInput, { color: P.ink }]}
              value={custom}
              onChangeText={(v) => setCustom(v.replace(/\D/g, '').slice(0, 4))}
              placeholder={tr('streakGoal.customPlaceholder')}
              placeholderTextColor={P.muted}
              keyboardType="number-pad"
              maxLength={4}
            />
            <Text style={[styles.customUnit, { color: P.muted }]}>{tr('streakGoal.unitDays')}</Text>
          </View>

          {/* ── Comment ça marche ── */}
          <View style={[styles.howCard, { backgroundColor: P.card }, shadow]}>
            <Text style={[styles.howTitle, { color: P.ink }]}>{tr('streakGoal.howTitle')}</Text>
            <View style={styles.howRow}>
              <View style={[styles.howIcon, { backgroundColor: P.iceBg }]}>
                <Feather name="wind" size={16} color="#3A8EE0" />
              </View>
              <Text style={[styles.howText, { color: P.muted }]}>
                <Text style={[styles.howBold, { color: P.ink }]}>{tr('streakGoal.howFreezeBold')}</Text>
                {tr('streakGoal.howFreezeRest')}
              </Text>
            </View>
            <View style={styles.howRow}>
              <View style={[styles.howIcon, { backgroundColor: P.fireSoft }]}>
                <Feather name="rotate-ccw" size={16} color={P.fireInk} />
              </View>
              <Text style={[styles.howText, { color: P.muted }]}>
                <Text style={[styles.howBold, { color: P.ink }]}>{tr('streakGoal.howResetBold')}</Text>
                {tr('streakGoal.howResetRest')}
              </Text>
            </View>
            <Text style={[styles.howNote, { color: P.muted }]}>{tr('streakGoal.howNote')}</Text>
          </View>
        </ScrollView>

        {/* ── Barre d'action fixe ── */}
        <LinearGradient
          colors={[P.dockBg, P.bg, P.bg]}
          locations={[0, 0.3, 1]}
          style={[styles.dock, { paddingBottom: 16 + insets.bottom }]}
          pointerEvents="box-none"
        >
          <Pressable onPress={save} disabled={saving} style={[styles.ctaWrap, saving && { opacity: 0.7 }]}>
            <LinearGradient colors={P.fire} locations={[0, 0.55, 1]} {...G150} style={styles.cta}>
              {saving ? (
                <ActivityIndicator color="#fff" style={{ flex: 1 }} />
              ) : (
                <>
                  <Text style={styles.ctaText}>
                    {streakGoal == null || streakGoal === target
                      ? tr('streakGoal.ctaKeep')
                      : tr('streakGoal.ctaAim', { n: target })}
                  </Text>
                  <View style={styles.ctaXp}>
                    <GemIcon size={15} color="#FFE07A" />
                    <Text style={styles.ctaXpText}>+{streakReward(target).toLocaleString('fr-FR')} XP</Text>
                  </View>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shadow: {
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  borderDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

  hero: {
    paddingHorizontal: 20, paddingBottom: 26, overflow: 'hidden',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
  heroBody: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 22 },
  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 32, color: '#fff', marginTop: 2 },
  ringUnit: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  heroLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1, color: 'rgba(255,255,255,0.75)' },
  goalTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 28, color: '#fff', marginTop: 4 },
  goalLeft: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  claim: {
    marginTop: 16, marginHorizontal: 18, paddingVertical: 14, paddingLeft: 16, paddingRight: 14,
    borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  claimTitle: { fontFamily: 'Nunito_900Black', fontSize: 14 },
  claimSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  claimBtn: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: '#E0A02C',
    alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: '#B47E12',
  },

  section: {
    fontFamily: 'Nunito_900Black', fontSize: 12, letterSpacing: 1,
    paddingTop: 24, paddingHorizontal: 22, paddingBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 18 },
  preset: {
    width: '31%', flexGrow: 1, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 6,
    borderRadius: 20, borderWidth: 2, alignItems: 'center',
  },
  presetNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, lineHeight: 32 },
  presetSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  xpPill: { marginTop: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  xpText: { fontFamily: 'Nunito_900Black', fontSize: 11 },

  custom: {
    marginHorizontal: 18, height: 56, borderRadius: 18, borderWidth: 2,
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16,
  },
  customInput: { flex: 1, minWidth: 0, fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, paddingVertical: 0 },
  customUnit: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  howCard: { marginTop: 18, marginHorizontal: 18, borderRadius: 20, padding: 16 },
  howTitle: { fontFamily: 'Nunito_900Black', fontSize: 14 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  howIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  howText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 18 },
  howBold: { fontFamily: 'Nunito_800ExtraBold' },
  howNote: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 12 },

  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 14, paddingHorizontal: 18 },
  ctaWrap: {
    borderRadius: 18,
    shadowColor: '#E54834', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 6,
  },
  cta: {
    height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8,
  },
  ctaText: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  ctaXp: {
    height: 40, paddingHorizontal: 12, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  ctaXpText: { fontFamily: 'Nunito_900Black', fontSize: 14, color: '#fff' },
});
