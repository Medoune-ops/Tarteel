import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toggle from '../../components/Toggle';

const ITEMS = [
  { id: 'reminder', iconBg: '#FF4B4B', icon: 'bell' as const, title: 'Rappel quotidien', sub: 'Tous les jours à 20:30', default: true },
  { id: 'streak', iconBg: '#F0820C', icon: null as unknown as 'zap', title: 'Alerte de série', sub: 'Avant de perdre ton streak', default: true },
  { id: 'ligues', iconBg: '#E07A0C', icon: 'award' as const, title: 'Mises à jour des ligues', sub: 'Changements de classement', default: false },
  { id: 'verset', iconBg: '#6B4DFF', icon: 'book-open' as const, title: 'Verset du jour', sub: 'Chaque matin à 07:00', default: true },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(ITEMS.map((i) => [i.id, i.default]))
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications & rappels</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {ITEMS.map((item, i) => (
            <View key={item.id} style={[styles.row, i > 0 && styles.divider]}>
              <View style={[styles.rowIcon, { backgroundColor: item.iconBg }]}>
                {item.icon ? <Feather name={item.icon} size={22} color="#fff" /> : <Text style={{ fontSize: 22 }}>🔥</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSub}>{item.sub}</Text>
              </View>
              <Toggle
                value={states[item.id]}
                onChange={(v) => setStates((s) => ({ ...s, [item.id]: v }))}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>HEURE DU RAPPEL</Text>
        <View style={styles.timeCard}>
          <Text style={styles.time}>20 : 30</Text>
          <Text style={styles.timeSub}>Touche pour modifier l'heure</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 18, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  back: { fontSize: 30, color: '#6B4DFF', lineHeight: 32 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333' },
  content: { paddingHorizontal: 22, paddingVertical: 18 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
  rowIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  rowSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 22, marginBottom: 10 },
  timeCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  time: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 46, color: '#6B4DFF' },
  timeSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', marginTop: 6 },
});
