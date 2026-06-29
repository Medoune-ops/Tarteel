import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import LessonHeader from '../../../components/LessonHeader';
import { playSound } from '../../../constants/sounds';

// Mots disponibles (couleurs pastel selon le design)
const WORDS = [
  { id: 'rahim', text: 'الرَّحِيمِ', bg: '#FBE4E4', ring: '#F2A7A7' },
  { id: 'allah', text: 'اللَّهِ', bg: '#DEE9FB', ring: '#A9C2EE' },
  { id: 'rahman', text: 'الرَّحْمَٰنِ', bg: '#FBEFD3', ring: '#E8CA8A' },
];

export default function ArrangeScreen() {
  const router = useRouter();
  // 1er mot déjà placé : بِسْمِ ; 3 emplacements à remplir
  const [placed, setPlaced] = useState<string[]>([]);

  const available = WORDS.filter((w) => !placed.includes(w.id));
  const emptySlots = 3 - placed.length;

  return (
    <View style={styles.screen}>
      <LessonHeader progress={0.25} />

      <View style={styles.body}>
        <Text style={styles.title}>Remets les mots dans le bon ordre</Text>
        <Text style={styles.subtitle}>(de droite à gauche — arabe)</Text>

        {/* Zone réponse RTL */}
        <View style={styles.answerZone}>
          <Text style={styles.fixedWord}>بِسْمِ</Text>
          {placed.map((id) => {
            const w = WORDS.find((x) => x.id === id)!;
            return <Text key={id} style={styles.placedWord}>{w.text}</Text>;
          })}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <View key={i} style={styles.slot} />
          ))}
        </View>

        <Text style={styles.label}>Mots disponibles :</Text>
        <View style={styles.wordsRow}>
          {available.map((w) => (
            <Pressable
              key={w.id}
              style={[styles.wordTile, { backgroundColor: w.bg, borderColor: w.ring }]}
              onPress={() => { playSound('progress'); setPlaced((p) => [...p, w.id]); }}
            >
              <Text style={styles.wordText}>{w.text}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.hint}>Touche un mot pour le placer dans la zone (droite à gauche)</Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={() => { playSound('correct'); router.push('/(app)/lesson/match'); }}>
          <Text style={styles.ctaLabel}>Vérifier</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333', textAlign: 'center', lineHeight: 35 },
  subtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', textAlign: 'center', marginTop: 8 },
  answerZone: {
    backgroundColor: '#E6E8ED', borderRadius: 18, minHeight: 110, marginTop: 24,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 18, paddingHorizontal: 24, flexWrap: 'wrap',
  },
  fixedWord: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 40, color: '#1B2333' },
  placedWord: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 40, color: '#1B2333' },
  slot: { flex: 1, minWidth: 50, borderBottomWidth: 3, borderColor: '#C9CDD4', height: 0 },
  label: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#1B2333', marginTop: 24, marginBottom: 14 },
  wordsRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  wordTile: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 22, borderWidth: 2 },
  wordText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 32, color: '#1B2333' },
  hint: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', textAlign: 'center', marginTop: 18, lineHeight: 22 },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 30 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: '#34C724', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
});
