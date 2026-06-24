import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import LessonHeader from '../../../components/LessonHeader';

const LEFT = [
  { id: 'allah', text: 'اللَّهِ', ring: '#34C724' },
  { id: 'rahman', text: 'الرَّحْمَٰنِ', ring: '#6FA0EC' },
  { id: 'rahim', text: 'الرَّحِيمِ', ring: '#E8B85A' },
  { id: 'hamd', text: 'الْحَمْدُ', ring: '#A98AEC' },
];

const RIGHT = [
  { id: 'allah', text: 'Allah' },
  { id: 'rahman', text: 'Le Tout Miséricordieux' },
  { id: 'rahim', text: 'Le Très Miséricordieux' },
  { id: 'hamd', text: 'La louange' },
];

export default function MatchScreen() {
  const router = useRouter();
  // 'allah' déjà matché dans le design d'origine
  const [matched, setMatched] = useState<Set<string>>(new Set(['allah']));
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const pickLeft = (id: string) => {
    if (matched.has(id)) return;
    setSelectedLeft(id);
  };

  const pickRight = (id: string) => {
    if (matched.has(id)) return;
    if (selectedLeft && selectedLeft === id) {
      setMatched((m) => new Set(m).add(id));
      setSelectedLeft(null);
    } else {
      setSelectedLeft(null);
    }
  };

  return (
    <View style={styles.screen}>
      <LessonHeader progress={0.5} />

      <View style={styles.body}>
        <Text style={styles.title}>Relie chaque mot à sa traduction</Text>

        <View style={styles.columns}>
          {/* Gauche : arabe */}
          <View style={styles.col}>
            {LEFT.map((w) => {
              const isMatched = matched.has(w.id);
              const isSel = selectedLeft === w.id;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => pickLeft(w.id)}
                  style={[
                    styles.leftTile,
                    { borderColor: isMatched ? '#34C724' : w.ring },
                    isMatched && { backgroundColor: '#DEF5E5' },
                    isSel && styles.selected,
                  ]}
                >
                  <Text style={styles.arabic}>{w.text}</Text>
                  {isMatched && <Feather name="check" size={18} color="#34C724" />}
                </Pressable>
              );
            })}
          </View>

          {/* Droite : traductions */}
          <View style={styles.col}>
            {RIGHT.map((t) => {
              const isMatched = matched.has(t.id);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => pickRight(t.id)}
                  style={[styles.rightTile, isMatched && styles.rightMatched]}
                >
                  <Text style={styles.transText}>{t.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={() => router.push('/(app)/lesson/qcm')}>
          <Text style={styles.ctaLabel}>Vérifier</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333', textAlign: 'center', lineHeight: 35, marginBottom: 24 },
  columns: { flexDirection: 'row', gap: 14 },
  col: { flex: 1, gap: 14 },
  leftTile: {
    borderRadius: 14, padding: 16, borderWidth: 2, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selected: { backgroundColor: '#EFEBFF', borderColor: '#6B4DFF' },
  arabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, color: '#1B2333' },
  rightTile: {
    backgroundColor: '#ECEEF2', borderRadius: 14, padding: 16,
    alignItems: 'center', justifyContent: 'center', minHeight: 62,
  },
  rightMatched: { backgroundColor: '#DEF5E5', borderWidth: 2, borderColor: '#34C724' },
  transText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#1B2333', textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 30 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: '#34C724', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
});
