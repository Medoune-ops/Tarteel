import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Otter from '../../../components/Otter';
import ProgressBar from '../../../components/ProgressBar';
import { useUserStore } from '../../../store/userStore';
import { useTheme } from '../../../utils/useTheme';
import { fetchActivity } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';

type Badge = { emoji: string; bg: string; bgDark: string; border: string; label: string; route?: Href };

// Libellé du badge d'objectif de série.
function streakGoalLabel(streak: number, goal: number | null): string {
  if (goal == null) return 'Fixer un défi';
  if (streak >= goal) return '🎯 Atteint !';
  return `${streak}/${goal} j`;
}

function buildBadges(streak: number, streakGoal: number | null, sourates: number): Badge[] {
  return [
    { emoji: '🎧', bg: '#E8E4FF', bgDark: '#241F3D', border: '#6B4DFF', label: 'Lecture libre', route: '/(app)/lecture-libre' },
    { emoji: '🔥', bg: '#FFE8E8', bgDark: '#3A1F26', border: '#FF4B4B', label: streakGoalLabel(streak, streakGoal), route: '/(app)/streak-goal' },
    { emoji: '🎵', bg: '#F0E8FF', bgDark: '#2A2140', border: '#8A5CF0', label: 'Tajwid', route: '/(app)/tajwid' },
    { emoji: '📖', bg: '#E2F5E1', bgDark: '#1B3220', border: '#2A9E1C', label: `${sourates} Sourate${sourates > 1 ? 's' : ''}`, route: '/(app)/sourates' },
    { emoji: '🏆', bg: '#FFF3CD', bgDark: '#332A14', border: '#E0A02C', label: 'Mes podiums', route: '/(app)/podiums' },
  ];
}

export default function ProfilScreen() {
  const router = useRouter();
  const T = useTheme();
  const logout = useUserStore((s) => s.logout);
  const name = useUserStore((s) => s.name);
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const streakGoal = useUserStore((s) => s.streakGoal);
  const sourates = useUserStore((s) => s.sourates);
  const precision = useUserStore((s) => s.precision);

  const badges = buildBadges(streak, streakGoal, sourates);

  // ── Vrai calendrier du mois en cours ──
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Décalage pour démarrer la semaine le lundi (getDay(): 0 = dimanche).
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const monthLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // "YYYY-MM"
  // Cases de la grille : décalage de début (null) puis les jours du mois.
  const calCells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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
      'Se déconnecter',
      'Es-tu sûr de vouloir te déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header gradient */}
        <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.header}>
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/(app)/settings')}>
            <Feather name="settings" size={24} color="#fff" />
          </Pressable>
          <View style={styles.avatar}>
            <Otter size={84} />
          </View>
          <Text style={styles.name}>{name || 'Toi'}</Text>
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => <Feather key={i} name="star" size={18} color="#FFC83D" />)}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Stats bar */}
          <View style={[styles.statsCard, { backgroundColor: T.cardBg }]}>
            {[
              { value: xp.toLocaleString('fr-FR'), label: 'XP Total' },
              { value: String(streak), label: 'Jours streak', flame: true },
              { value: String(sourates), label: 'Sourates' },
              { value: precision > 0 ? `${precision}%` : '—', label: 'Précision' },
            ].map((s, i) => (
              <View key={i} style={styles.statCol}>
                <View style={styles.statValRow}>
                  {s.flame && <Text style={{ fontSize: 20 }}>🔥</Text>}
                  <Text style={[styles.statVal, { color: T.text }]}>{s.value}</Text>
                </View>
                <Text style={[styles.statLabel, { color: T.textSecondary }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Niveau — 2000 XP par niveau */}
          {(() => {
            const PER_LEVEL = 2000;
            const level = Math.floor(xp / PER_LEVEL) + 1;
            const inLevel = xp % PER_LEVEL;
            return (
              <>
                <Text style={[styles.sectionTitle, { color: T.text }]}>Progression Niveau {level}</Text>
                <View style={styles.levelRow}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={inLevel / PER_LEVEL} bgColor={T.isDark ? '#2A2940' : '#E2E4E9'} />
                  </View>
                  <Text style={[styles.levelText, { color: T.textSecondary }]}>
                    {inLevel.toLocaleString('fr-FR')} / {PER_LEVEL.toLocaleString('fr-FR')} XP
                  </Text>
                </View>
              </>
            );
          })()}

          {/* Badges */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>Badges</Text>
          <View style={styles.badgeGrid}>
            {badges.map((b, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.badge,
                  { backgroundColor: T.isDark ? b.bgDark : b.bg, borderColor: b.border },
                  b.route && pressed && { opacity: 0.7 },
                ]}
                onPress={b.route ? () => router.push(b.route!) : undefined}
              >
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={[styles.badgeLabel, { color: T.isDark ? b.border : T.text }]}>{b.label}</Text>
                {b.route && (
                  <View style={styles.badgeArrow}>
                    <Feather name="chevron-right" size={12} color={b.border} />
                  </View>
                )}
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
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={[styles.calWeekday, { color: T.textTertiary }]}>{w}</Text>
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
            <Text style={styles.logoutText}>Se déconnecter</Text>
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
    borderRadius: 18, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  statCol: { alignItems: 'center' },
  statValRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22 },
  statLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginTop: 24, marginBottom: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '31.5%', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderBottomWidth: 4, borderWidth: 1.5,
  },
  badgeEmoji: { fontSize: 30 },
  badgeLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, textAlign: 'center' },
  badgeArrow: { position: 'absolute', top: 6, right: 6 },
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
