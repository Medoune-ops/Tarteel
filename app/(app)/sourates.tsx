import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { getSouratesApprises } from '../../constants/parcours';

// Nombre de sourates apprises (= stat du profil ; viendra de l'API plus tard).
const APPRISES = 12;

export default function SouratesScreen() {
  const router = useRouter();
  const sourates = getSouratesApprises(APPRISES);
  const versets = sourates.reduce((t, s) => t + s.nombreVersets, 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Sourates apprises</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Résumé */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{sourates.length}</Text>
            <Text style={styles.summaryLabel}>Sourates</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{versets}</Text>
            <Text style={styles.summaryLabel}>Versets</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>📖</Text>
            <Text style={styles.summaryLabel}>Mémorisées</Text>
          </View>
        </View>

        {/* Liste */}
        <View style={styles.list}>
          {sourates.map((s, i) => (
            <View key={s.numero} style={[styles.row, i > 0 && styles.divider]}>
              <View style={styles.numBadge}>
                <Text style={styles.numText}>{s.numero}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>{s.nom}</Text>
                <Text style={styles.versets}>{s.nombreVersets} versets</Text>
              </View>
              <Text style={styles.arabe}>{s.nomArabe}</Text>
              <View style={styles.check}>
                <Feather name="check" size={15} color="#fff" />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.note}>
          Continue ton parcours pour débloquer de nouvelles sourates 🚀
        </Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { fontSize: 34, color: '#1B2333', lineHeight: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  content: { paddingHorizontal: 22, paddingVertical: 18 },

  summary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: '#E2F5E1', borderRadius: 18, paddingVertical: 18, marginBottom: 18,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#2A9E1C' },
  summaryLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#4C8B3E', marginTop: 2 },
  summaryDivider: { width: 1, height: 36, backgroundColor: '#C6E6C2' },

  list: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
  numBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#E2F5E1',
    alignItems: 'center', justifyContent: 'center',
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#2A9E1C' },
  nom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  versets: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 1 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 24, color: '#1B2333', marginRight: 4 },
  check: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
  },
  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
});
