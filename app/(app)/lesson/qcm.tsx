import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import LessonHeader from '../../../components/LessonHeader';
import { correctFeedback, wrongFeedback } from '../../../constants/sounds';

const OPTIONS = [
  { id: 'A', text: "Le Créateur de l'univers" },
  { id: 'B', text: 'Le Tout Miséricordieux' },
  { id: 'C', text: 'Le Très Miséricordieux envers les croyants' },
  { id: 'D', text: 'Le Guide vers la vérité' },
];

const CORRECT_ID = 'C';

export default function QcmScreen() {
  const router = useRouter();
  const [answer, setAnswer] = useState<string>('C');

  const choose = (id: string) => {
    setAnswer(id);
    if (id === CORRECT_ID) correctFeedback();
    else wrongFeedback();
  };

  return (
    <View style={styles.screen}>
      <LessonHeader progress={0.65} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Que signifie ce mot ?</Text>

        {/* Mot arabe */}
        <View style={styles.wordCard}>
          <Text style={styles.arabic}>الرَّحِيمِ</Text>
          <Text style={styles.translit}>Ar-Raheem</Text>
        </View>

        {/* Options */}
        {OPTIONS.map((o) => {
          const active = answer === o.id;
          return (
            <Pressable
              key={o.id}
              style={[
                styles.option,
                active ? styles.optionActive : styles.optionInactive,
              ]}
              onPress={() => choose(o.id)}
            >
              <View style={[styles.badge, { backgroundColor: active ? '#34C724' : '#D7DBE0' }]}>
                <Text style={styles.badgeText}>{o.id}</Text>
              </View>
              <Text style={[styles.optionText, active && { fontFamily: 'Nunito_800ExtraBold' }]}>{o.text}</Text>
            </Pressable>
          );
        })}

        {/* Encadré Ibn Kathir */}
        <View style={styles.ibnBox}>
          <View style={styles.ibnTitleRow}>
            <Feather name="book-open" size={17} color="#2A9E1C" />
            <Text style={styles.ibnTitle}>Ibn Kathir :</Text>
          </View>
          <Text style={styles.ibnText}>
            Ar-Raheem désigne la miséricorde spéciale accordée aux croyants au Jour Dernier.
          </Text>
        </View>

        <Pressable style={styles.cta} onPress={() => router.push('/(app)/lesson/voice')}>
          <Text style={styles.ctaLabel}>Continuer</Text>
        </Pressable>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { paddingHorizontal: 24, paddingTop: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#1B2333', textAlign: 'center' },
  wordCard: { backgroundColor: '#E6E8ED', borderRadius: 18, padding: 22, alignItems: 'center', marginVertical: 18 },
  arabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 44, color: '#1B2333' },
  translit: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 4 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderRadius: 16, marginBottom: 12,
  },
  optionInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E7EC' },
  optionActive: { backgroundColor: '#E7F8E4', borderWidth: 3, borderColor: '#34C724' },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  optionText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },
  ibnBox: { backgroundColor: '#DEF5E5', borderRadius: 14, padding: 16, marginBottom: 18 },
  ibnTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ibnTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#2A9E1C' },
  ibnText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#3C7A30', marginTop: 4, lineHeight: 21 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: '#34C724', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
});
