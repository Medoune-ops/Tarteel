import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Otter from '../../../components/Otter';
import ProgressBar from '../../../components/ProgressBar';

const BADGES = [
  { icon: 'star' as const, color: '#F6B100', bg: '#FBEFD3', label: 'Al-Fatiha' },
  { icon: 'type' as const, color: '#6B4DFF', bg: '#DEE6FB', label: 'Alphabet' },
  { icon: 'zap' as const, color: '#F0820C', bg: '#FFE3E3', label: '7 jours' },
  { icon: 'music' as const, color: '#8A5CF0', bg: '#EBE3FC', label: 'Tajwid' },
  { icon: 'book-open' as const, color: '#2A9E1C', bg: '#DEF5E5', label: '10 Sourates' },
  { icon: 'award' as const, color: '#E0A02C', bg: '#FBEFD3', label: 'Ligue Or' },
];

const DAYS = Array.from({ length: 21 }, (_, i) => i + 1);

export default function ProfilScreen() {
  const router = useRouter();

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
              { value: '1 240', label: 'XP Total' },
              { value: '15', label: 'Jours streak', flame: true },
              { value: '12', label: 'Sourates' },
              { value: '94%', label: 'Précision' },
            ].map((s, i) => (
              <View key={i} style={styles.statCol}>
                <View style={styles.statValRow}>
                  {s.flame && <Feather name="zap" size={20} color="#F0820C" />}
                  <Text style={styles.statVal}>{s.value}</Text>
                </View>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Niveau */}
          <Text style={styles.sectionTitle}>Progression Niveau 4</Text>
          <View style={styles.levelRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={0.62} />
            </View>
            <Text style={styles.levelText}>1 240 / 2 000 XP</Text>
          </View>

          {/* Badges */}
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgeGrid}>
            {BADGES.map((b, i) => (
              <View key={i} style={[styles.badge, { backgroundColor: b.bg }]}>
                <Feather name={b.icon} size={17} color={b.color} />
                <Text style={styles.badgeLabel}>{b.label}</Text>
              </View>
            ))}
          </View>

          {/* Calendrier */}
          <View style={styles.calTitleRow}>
            <Text style={styles.sectionTitle}>Calendrier — Série active</Text>
            <Feather name="zap" size={20} color="#F0820C" />
          </View>
          <View style={styles.calGrid}>
            {DAYS.map((d) => {
              const done = d <= 15;
              const current = d === 15;
              const future = d > 15;
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
    width: '31.5%', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  badgeLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#1B2333' },
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
});
