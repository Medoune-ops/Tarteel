import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import LessonHeader from '../../../components/LessonHeader';

const SPEEDS = ['0.5', '0.75', '1', '1.5'];

export default function ListenScreen() {
  const router = useRouter();
  const [speed, setSpeed] = useState('0.75');

  return (
    <View style={styles.screen}>
      <LessonHeader progress={0.42} hearts={5} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Verset */}
        <View style={styles.verseCard}>
          <Text style={styles.arabic}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
          <Text style={styles.translation}>Au nom d'Allah, le Tout Miséricordieux</Text>
        </View>

        <View style={styles.instructionRow}>
          <Feather name="volume-2" size={22} color="#1B2333" />
          <Text style={styles.instruction}>Écoute et répète cet ayat</Text>
        </View>

        {/* Sélecteur vitesse */}
        <View style={styles.speedBar}>
          {SPEEDS.map((s) => {
            const active = speed === s;
            return (
              <Pressable
                key={s}
                style={[styles.speedChip, active && styles.speedChipActive]}
                onPress={() => setSpeed(s)}
              >
                <Text style={[styles.speedText, { color: active ? '#2A9E1C' : '#6B7280' }]}>{s}×</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bouton lecture */}
        <Pressable style={styles.playBtn}>
          <Feather name="volume-2" size={46} color="#2A9E1C" />
        </Pressable>

        {/* Boucle */}
        <Pressable style={styles.loopChip}>
          <Feather name="repeat" size={18} color="#6B7280" />
          <Text style={styles.loopText}>Boucle</Text>
        </Pressable>

        {/* Micro */}
        <Pressable style={styles.micBtn} onPress={() => router.push('/(app)/lesson/arrange')}>
          <Feather name="mic" size={42} color="#fff" />
        </Pressable>
        <Text style={styles.micLabel}>Appuie pour parler</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  verseCard: { width: '100%', backgroundColor: '#E6E8ED', borderRadius: 22, paddingVertical: 34, paddingHorizontal: 20, alignItems: 'center' },
  arabic: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 46, color: '#1B2333',
    lineHeight: 78, textAlign: 'center', writingDirection: 'rtl',
  },
  translation: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 10, textAlign: 'center' },
  instructionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 26 },
  instruction: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#1B2333' },
  speedBar: { flexDirection: 'row', gap: 6, backgroundColor: '#E6E8ED', borderRadius: 14, padding: 5, width: '100%' },
  speedChip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 10 },
  speedChipActive: { backgroundColor: '#DCF5D6' },
  speedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  playBtn: {
    width: 108, height: 108, borderRadius: 54, backgroundColor: '#DCF5D6',
    alignItems: 'center', justifyContent: 'center', marginTop: 34,
  },
  loopChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E6E8ED', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, marginTop: 14,
  },
  loopText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#6B7280' },
  micBtn: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center', marginTop: 30,
    borderBottomWidth: 6, borderBottomColor: '#2A9E1C',
  },
  micLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: '#7A828F', marginTop: 12, marginBottom: 24 },
});
