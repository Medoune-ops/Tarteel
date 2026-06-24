import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Otter from '../../../components/Otter';

export default function FinishScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={{ height: 90 }} />
      <View style={styles.otterWrap}>
        <Otter size={124} />
      </View>
      <Text style={styles.title}>Leçon terminée !</Text>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statCol}>
          <Feather name="zap" size={28} color="#E0A800" />
          <Text style={styles.statVal}>+30 XP</Text>
          <Text style={styles.statLabel}>Points gagnés</Text>
        </View>
        <View style={styles.statCol}>
          <Feather name="target" size={28} color="#E0584F" />
          <Text style={styles.statVal}>87%</Text>
          <Text style={styles.statLabel}>Précision</Text>
        </View>
        <View style={styles.statCol}>
          <Feather name="clock" size={28} color="#6B7280" />
          <Text style={styles.statVal}>4:18</Text>
          <Text style={styles.statLabel}>Durée</Text>
        </View>
      </View>

      {/* Streak */}
      <View style={styles.streakBadge}>
        <Feather name="zap" size={20} color="#FFD27A" />
        <Text style={styles.streakText}>Série de 15 jours consécutifs !</Text>
      </View>

      {/* Niveau */}
      <View style={styles.levelTrack}>
        <View style={styles.levelFill} />
      </View>

      <View style={{ flex: 1 }} />

      <Pressable style={styles.cta} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
        <Text style={styles.ctaLabel}>Continuer</Text>
      </Pressable>
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
  levelFill: { width: '62%', height: '100%', backgroundColor: '#fff' },
  cta: {
    width: '100%', height: 62, borderRadius: 18, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 38,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#6B4DFF' },
});
