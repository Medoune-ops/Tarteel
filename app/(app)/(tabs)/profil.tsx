import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Otter from '../../../components/Otter';
import ProgressBar from '../../../components/ProgressBar';
import { useUserStore } from '../../../store/userStore';

type Badge = { emoji: string; bg: string; border: string; label: string; route?: Href };

// Libellé du badge d'objectif de série.
function streakGoalLabel(streak: number, goal: number | null): string {
  if (goal == null) return 'Fixer un défi';
  if (streak >= goal) return '🎯 Atteint !';
  return `${streak}/${goal} j`;
}

function buildBadges(streak: number, streakGoal: number | null): Badge[] {
  return [
    { emoji: '✍️', bg: '#E8E4FF', border: '#6B4DFF', label: 'Alphabet'    },
    { emoji: '🔥', bg: '#FFE8E8', border: '#FF4B4B', label: streakGoalLabel(streak, streakGoal), route: '/(app)/streak-goal' },
    { emoji: '🎵', bg: '#F0E8FF', border: '#8A5CF0', label: 'Tajwid'      },
    { emoji: '📖', bg: '#E2F5E1', border: '#2A9E1C', label: '12 Sourates', route: '/(app)/sourates' },
    { emoji: '🏆', bg: '#FFF3CD', border: '#E0A02C', label: 'Ligue Or', route: '/(app)/podiums' },
  ];
}

export default function ProfilScreen() {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const streakGoal = useUserStore((s) => s.streakGoal);

  const badges = buildBadges(streak, streakGoal);
  // Calendrier : 3 semaines centrées autour de la série en cours.
  const CAL_DAYS = 21;
  const calDays = Array.from({ length: CAL_DAYS }, (_, i) => i + 1);
  // Le jour "courant" = position de la série dans la grille (max = CAL_DAYS).
  const todayIndex = Math.min(streak, CAL_DAYS);

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
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header gradient */}
        <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.header}>
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/(app)/settings')}>
            <Feather name="settings" size={24} color="#fff" />
          </Pressable>
          <View style={styles.avatar}>
            <Otter size={84} />
          </View>
          <Text style={styles.name}>Medoune</Text>
          <View style={styles.stars}>
            {[0, 1, 2].map((i) => <Feather key={i} name="star" size={18} color="#FFC83D" />)}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* Stats bar */}
          <View style={styles.statsCard}>
            {[
              { value: xp.toLocaleString('fr-FR'), label: 'XP Total' },
              { value: String(streak), label: 'Jours streak', flame: true },
              { value: '12', label: 'Sourates' },
              { value: '94%', label: 'Précision' },
            ].map((s, i) => (
              <View key={i} style={styles.statCol}>
                <View style={styles.statValRow}>
                  {s.flame && <Text style={{ fontSize: 20 }}>🔥</Text>}
                  <Text style={styles.statVal}>{s.value}</Text>
                </View>
                <Text style={styles.statLabel}>{s.label}</Text>
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
                <Text style={styles.sectionTitle}>Progression Niveau {level}</Text>
                <View style={styles.levelRow}>
                  <View style={{ flex: 1 }}>
                    <ProgressBar progress={inLevel / PER_LEVEL} />
                  </View>
                  <Text style={styles.levelText}>
                    {inLevel.toLocaleString('fr-FR')} / {PER_LEVEL.toLocaleString('fr-FR')} XP
                  </Text>
                </View>
              </>
            );
          })()}

          {/* Badges */}
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {badges.map((b, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.badge,
                  { backgroundColor: b.bg, borderColor: b.border },
                  b.route && pressed && { opacity: 0.7 },
                ]}
                onPress={b.route ? () => router.push(b.route!) : undefined}
              >
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={styles.badgeLabel}>{b.label}</Text>
                {b.route && (
                  <View style={styles.badgeArrow}>
                    <Feather name="chevron-right" size={12} color={b.border} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Calendrier */}
          <View style={styles.calTitleRow}>
            <Text style={styles.sectionTitle}>Calendrier — Série active</Text>
            <Text style={{ fontSize: 20 }}>🔥</Text>
          </View>
          <View style={styles.calGrid}>
            {calDays.map((d) => {
              const done = d <= todayIndex;
              const current = d === todayIndex;
              const future = d > todayIndex;
              return (
                <View
                  key={d}
                  style={[
                    styles.calCell,
                    done && styles.calDone,
                    current && styles.calCurrent,
                    future && styles.calFuture,
                  ]}
                >
                  <Text style={[styles.calNum, future ? styles.calNumFuture : styles.calNumDone]}>{d}</Text>
                </View>
              );
            })}
          </View>

          {/* Déconnexion */}
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
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
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
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
    backgroundColor: '#fff', borderRadius: 18, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  statCol: { alignItems: 'center' },
  statValRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  statLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99' },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#1B2333', marginTop: 24, marginBottom: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#8A8F99' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '31.5%', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 8,
    alignItems: 'center', justifyContent: 'center', gap: 6,
    borderBottomWidth: 4, borderWidth: 1.5,
  },
  badgeEmoji: { fontSize: 30 },
  badgeLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#1B2333', textAlign: 'center' },
  badgeArrow: { position: 'absolute', top: 6, right: 6 },
  calTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  calCell: {
    width: '12.7%', aspectRatio: 1, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  calDone: { backgroundColor: '#DEF5E5', borderWidth: 2, borderColor: '#34C724' },
  calCurrent: { backgroundColor: '#DEF5E5', borderWidth: 3, borderColor: '#2A9E1C' },
  calFuture: { backgroundColor: '#E6E8ED' },
  calNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  calNumDone: { color: '#2A9E1C' },
  calNumFuture: { color: '#B7BCC4', fontFamily: 'Nunito_700Bold' },
  logoutBtn: {
    marginTop: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: '#FFD9D9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  logoutText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#FF4B4B' },
});
