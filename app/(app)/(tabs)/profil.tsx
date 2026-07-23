import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import Otter from '../../../components/Otter';
import ProgressBar from '../../../components/ProgressBar';
import { useUserStore } from '../../../store/userStore';
import { useTheme } from '../../../utils/useTheme';
import { useScrollToTopOnTabPress } from '../../../utils/useScrollToTopOnTabPress';
import { fetchActivity } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { useT, t, type I18nKey } from '../../../lib/i18n';

type Badge = { emoji: string; bg: string; bgDark: string; border: string; label: string; route?: Href };

// Couleurs des stats reprises du palier des badges juste en dessous (or =
// XP, orange = série, vert = sourates, violet = précision) pour que le
// bandeau de stats et les badges se lisent comme un seul ensemble cohérent.
const STAT_META = [
  { icon: 'zap' as const,       emoji: null,  color: '#E8A800', bg: '#FFF3CD', bgDark: '#332A14' },
  { icon: null,                 emoji: '🔥',  color: '#F0820C', bg: '#FFE7D2', bgDark: '#3A2712' },
  { icon: 'book-open' as const, emoji: null,  color: '#2A9E1C', bg: '#E2F5E1', bgDark: '#1B3220' },
  { icon: 'target' as const,    emoji: null,  color: '#6B4DFF', bg: '#EDE8FF', bgDark: '#241F3D' },
];

// Libellé du badge d'objectif de série.
function streakGoalLabel(streak: number, goal: number | null): string {
  if (goal == null) return t('profil.badge.streakGoalSet');
  if (streak >= goal) return t('profil.badge.streakGoalReached');
  return t('profil.badge.streakGoalProgress', { streak, goal });
}

function buildBadges(streak: number, streakGoal: number | null, sourates: number): Badge[] {
  return [
    { emoji: '📚', bg: '#E8E4FF', bgDark: '#241F3D', border: '#6B4DFF', label: t('profil.badge.lectureLibre'), route: '/(app)/lecture-libre' },
    { emoji: '🔥', bg: '#FFE8E8', bgDark: '#3A1F26', border: '#FF4B4B', label: streakGoalLabel(streak, streakGoal), route: '/(app)/streak-goal' },
    { emoji: '🎧', bg: '#F0E8FF', bgDark: '#2A2140', border: '#8A5CF0', label: t('profil.badge.tajwid'), route: '/(app)/tajwid' },
    { emoji: '📖', bg: '#E2F5E1', bgDark: '#1B3220', border: '#2A9E1C', label: t(sourates > 1 ? 'profil.badge.sourates' : 'profil.badge.sourate', { n: sourates }), route: '/(app)/sourates' },
    { emoji: '🏆', bg: '#FFF3CD', bgDark: '#332A14', border: '#E0A02C', label: t('profil.badge.podiums'), route: '/(app)/podiums' },
  ];
}

export default function ProfilScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const language = useUserStore((s) => s.language);
  const logout = useUserStore((s) => s.logout);
  const name = useUserStore((s) => s.name);
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const streakGoal = useUserStore((s) => s.streakGoal);
  const sourates = useUserStore((s) => s.sourates);
  const precision = useUserStore((s) => s.precision);

  const badges = buildBadges(streak, streakGoal, sourates);
  const scrollRef = useScrollToTopOnTabPress();

  // ── Rotation continue de l'engrenage des paramètres ──
  const gearSpin = useSharedValue(0);
  useEffect(() => {
    gearSpin.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1, // infini
      false, // pas d'aller-retour : rotation dans un seul sens
    );
  }, []);
  const gearStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gearSpin.value}deg` }],
  }));

  // ── Vrai calendrier du mois en cours ──
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Décalage pour démarrer la semaine le lundi (getDay(): 0 = dimanche).
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const localeTag = language === 'en' ? 'en-US' : language === 'ar' ? 'ar' : 'fr-FR';
  const monthLabel = now.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' });
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // "YYYY-MM"
  // Cases de la grille : décalage de début (null) puis les jours du mois.
  const calCells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const WEEKDAY_KEYS: I18nKey[] = [
    'profil.weekday.mon', 'profil.weekday.tue', 'profil.weekday.wed',
    'profil.weekday.thu', 'profil.weekday.fri', 'profil.weekday.sat', 'profil.weekday.sun',
  ];

  // Jours RÉELLEMENT actifs du mois (GET /me/activity) — set des numéros de jour.
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set());
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // "2026-06-07" → 7. On ne garde que le numéro de jour.
      const apply = (days: string[]) => {
        if (!cancelled) setActiveDays(new Set(days.map((d) => Number(d.slice(8, 10)))));
      };
      // SWR : calendrier affiché immédiatement depuis le cache, refresh en fond.
      swrFetch(`activity:${monthKey}`, () => fetchActivity(monthKey), apply)
        .then(apply)
        .catch(() => { /* hors-ligne : calendrier vide, pas d'erreur bloquante */ });
      return () => { cancelled = true; };
    }, [monthKey]),
  );

  const handleLogout = () => {
    Alert.alert(
      tr('profil.logoutConfirmTitle'),
      tr('profil.logoutConfirmMsg'),
      [
        { text: tr('profil.logoutCancel'), style: 'cancel' },
        {
          text: tr('profil.logoutAction'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(onboarding)/signup');
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
        {/* Header gradient */}
        <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.header}>
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/(app)/settings')} hitSlop={10}>
            <Animated.View style={gearStyle}>
              <Feather name="settings" size={24} color="#fff" />
            </Animated.View>
          </Pressable>
          <View style={styles.avatar}>
            <Otter size={84} />
          </View>
          <Text style={styles.name}>{name || tr('profil.defaultName')}</Text>
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => <Feather key={i} name="star" size={18} color="#FFC83D" />)}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Stats bar */}
          <View style={[styles.statsCard, { backgroundColor: T.cardBg }]}>
            {[
              { value: xp.toLocaleString(localeTag), label: tr('profil.xpTotal') },
              { value: String(streak), label: tr('profil.streakDays') },
              { value: String(sourates), label: tr('profil.sourates') },
              { value: precision > 0 ? `${precision}%` : '—', label: tr('profil.precision') },
            ].map((s, i) => {
              const meta = STAT_META[i];
              return (
                <View key={i} style={styles.statColWrap}>
                  <View style={styles.statCol}>
                    <View style={[styles.statIconWrap, { backgroundColor: T.isDark ? meta.bgDark : meta.bg }]}>
                      {meta.icon
                        ? <Feather name={meta.icon} size={15} color={meta.color} />
                        : <Text style={styles.statIconEmoji}>{meta.emoji}</Text>}
                    </View>
                    <Text style={[styles.statVal, { color: T.text }]}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: T.textSecondary }]} numberOfLines={1}>{s.label}</Text>
                  </View>
                  {i < 3 && <View style={[styles.statDivider, { backgroundColor: T.divider, opacity: T.isDark ? 0.6 : 0.8 }]} />}
                </View>
              );
            })}
          </View>

          {/* Niveau — 2000 XP par niveau */}
          {(() => {
            const PER_LEVEL = 2000;
            const level = Math.floor(xp / PER_LEVEL) + 1;
            const inLevel = xp % PER_LEVEL;
            return (
              <>
                <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('profil.levelProgress', { level })}</Text>
                <View style={styles.levelRow}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={inLevel / PER_LEVEL} bgColor={T.isDark ? '#2A2940' : '#E2E4E9'} />
                  </View>
                  <Text style={[styles.levelText, { color: T.textSecondary }]}>
                    {inLevel.toLocaleString(localeTag)} / {PER_LEVEL.toLocaleString(localeTag)} XP
                  </Text>
                </View>
              </>
            );
          })()}

          {/* Badges */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('profil.badgesTitle')}</Text>
          <View style={styles.badgeGrid}>
            {badges.map((b, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.badge,
                  { backgroundColor: T.isDark ? b.bgDark : b.bg, borderColor: b.border },
                  b.route && pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
                ]}
                onPress={b.route ? () => router.push(b.route!) : undefined}
              >
                {b.route && (
                  <View style={[styles.badgeChevron, { backgroundColor: b.border }]}>
                    <Feather name="chevron-right" size={10} color="#fff" />
                  </View>
                )}
                <View style={[styles.badgeMedal, { backgroundColor: T.cardBg, borderColor: b.border }]}>
                  <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                </View>
                <Text style={[styles.badgeLabel, { color: T.isDark ? b.border : T.text }]} numberOfLines={2}>{b.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Calendrier du mois en cours */}
          <View style={styles.calTitleRow}>
            <Text style={[styles.sectionTitle, { color: T.text, textTransform: 'capitalize' }]}>{monthLabel}</Text>
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </View>

          {/* En-tête jours de la semaine */}
          <View style={styles.calWeekHeader}>
            {WEEKDAY_KEYS.map((w, i) => (
              <Text key={i} style={[styles.calWeekday, { color: T.textTertiary }]}>{tr(w)}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calCells.map((d, i) => {
              if (d === null) return <View key={`b${i}`} style={styles.calCell} />;
              const isToday = d === today;
              const isActive = activeDays.has(d); // jour réellement actif (backend)
              const future = d > today;
              return (
                <View key={d} style={styles.calCell}>
                  <View
                    style={[
                      styles.calCellInner,
                      isActive && [styles.calDone, T.isDark && { backgroundColor: '#173322' }],
                      isToday && [styles.calCurrent, T.isDark && { backgroundColor: '#173322' }],
                      !isActive && !isToday && future && [styles.calFuture, { backgroundColor: T.selectorBg }],
                    ]}
                  >
                    <Text style={[styles.calNum, (isActive || isToday) ? [styles.calNumDone, T.isDark && { color: '#4ED83A' }] : [styles.calNumFuture, { color: future ? T.textTertiary : T.textSecondary }]]}>{d}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Déconnexion */}
          <Pressable style={[styles.logoutBtn, { backgroundColor: T.cardBg, borderColor: T.isDark ? '#4A2330' : '#FFD9D9' }]} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#FF4B4B" />
            <Text style={styles.logoutText}>{tr('profil.logout')}</Text>
          </Pressable>

          <View style={{ height: 14 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 46, paddingBottom: 30, alignItems: 'center' },
  settingsBtn: { position: 'absolute', top: 54, right: 24 },
  avatar: {
    width: 104, height: 104, borderRadius: 52, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#fff', marginTop: 14 },
  stars: { flexDirection: 'row', gap: 3, marginTop: 5 },
  body: { padding: 22 },
  statsCard: {
    borderRadius: 18, paddingVertical: 18, paddingHorizontal: 8,
    flexDirection: 'row', alignItems: 'stretch',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  statColWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  statCol: { flex: 1, alignItems: 'center', gap: 3 },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 10, marginBottom: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  statIconEmoji: { fontSize: 15 },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20 },
  statLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 11.5 },
  statDivider: { width: 1, height: 28, alignSelf: 'center' },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginTop: 24, marginBottom: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  badge: {
    width: '30%', borderRadius: 18, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'flex-start', gap: 8,
    borderBottomWidth: 4, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1,
  },
  badgeMedal: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, textAlign: 'center', lineHeight: 15 },
  badgeChevron: {
    position: 'absolute', top: 8, right: 8,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  calTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calWeekHeader: { flexDirection: 'row', marginBottom: 6 },
  // 7 colonnes = 100 %/7. Pas de `gap` (sinon 7×largeur + gaps > 100 % et la
  // 7ᵉ colonne — dimanche — passe à la ligne). L'espacement est géré par un
  // padding interne sur chaque case.
  calWeekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: 'Nunito_700Bold', fontSize: 12 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7}%`, aspectRatio: 1, padding: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  // Fond/bordure appliqués au contenu interne pour conserver l'espacement.
  calCellInner: {
    width: '100%', height: '100%', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  calDone: { backgroundColor: '#DEF5E5', borderWidth: 2, borderColor: '#34C724' },
  calCurrent: { backgroundColor: '#DEF5E5', borderWidth: 3, borderColor: '#2A9E1C' },
  calFuture: {},
  calNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  calNumDone: { color: '#2A9E1C' },
  calNumFuture: { fontFamily: 'Nunito_700Bold' },
  logoutBtn: {
    marginTop: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#FFD9D9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  logoutText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#FF4B4B' },
});
