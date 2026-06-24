import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../../components/StatusBar';

type Theme = {
  id: string;
  emoji: string;
  titre: string;
  sous: string;
  route: string;
  c1: string;
  c2: string;
};

const THEMES: Theme[] = [
  { id: 'coran',     emoji: '📖', titre: 'Le Saint Coran',     sous: 'Histoire, révélation, structure',   route: '/(app)/docs/coran',     c1: '#7C5CFF', c2: '#6B4DFF' },
  { id: 'islam',     emoji: '☪️', titre: "L'Islam",             sous: 'Les 5 piliers, la foi, les valeurs', route: '/(app)/docs/islam',     c1: '#34C724', c2: '#2A9E1C' },
  { id: 'prophetes', emoji: '👤', titre: 'Les Prophètes',       sous: 'Les 25 prophètes cités dans le Coran', route: '/(app)/docs/prophetes', c1: '#F0820C', c2: '#D96E00' },
  { id: 'ablutions', emoji: '💧', titre: 'Les Ablutions',       sous: 'Le Wudû étape par étape',           route: '/(app)/docs/ablutions', c1: '#0FB5C4', c2: '#0894A1' },
  { id: 'priere',    emoji: '🕌', titre: 'La Prière',           sous: 'La Salât : gestes et invocations',  route: '/(app)/docs/priere',    c1: '#E0387E', c2: '#C42968' },
];

const FAITS = [
  { val: '114',   lbl: 'Sourates' },
  { val: '6 236', lbl: 'Versets' },
  { val: '25',    lbl: 'Prophètes' },
];

export default function CoranScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
          <Text style={styles.headerTitle}>Savoir</Text>
          <Text style={styles.headerSub}>Découvre le Coran et l'Islam dans la joie ✨</Text>
          <View style={styles.faits}>
            {FAITS.map((f, i) => (
              <View key={i} style={styles.fait}>
                <Text style={styles.faitVal}>{f.val}</Text>
                <Text style={styles.faitLbl}>{f.lbl}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={styles.sectionTitle}>Explore les thèmes</Text>
          {THEMES.map((t) => (
            <Pressable
              key={t.id}
              style={styles.card}
              onPress={() => router.push(t.route as never)}
            >
              <LinearGradient colors={[t.c1, t.c2]} style={styles.cardIcon}>
                <Text style={styles.cardEmoji}>{t.emoji}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitre}>{t.titre}</Text>
                <Text style={styles.cardSous}>{t.sous}</Text>
              </View>
              <Feather name="chevron-right" size={22} color="#C9CDD4" />
            </Pressable>
          ))}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: { paddingTop: 16, paddingBottom: 26, paddingHorizontal: 24 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: 20 },
  faits: { flexDirection: 'row', gap: 12 },
  fait: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    paddingVertical: 12, alignItems: 'center', gap: 2,
  },
  faitVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff' },
  faitLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  body: { padding: 18 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#1B2333', marginTop: 6, marginBottom: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 28 },
  cardTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: '#1B2333' },
  cardSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
});
