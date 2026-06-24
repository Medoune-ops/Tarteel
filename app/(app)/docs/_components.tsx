import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

/** En-tête dégradé avec bouton retour, emoji, titre. */
export function DocHeader({ emoji, titre, sous, c1, c2 }: {
  emoji: string; titre: string; sous?: string; c1: string; c2: string;
}) {
  const router = useRouter();
  return (
    <LinearGradient colors={[c1, c2]} style={s.header}>
      <Pressable style={s.back} onPress={() => router.back()} hitSlop={10}>
        <Feather name="arrow-left" size={24} color="#fff" />
      </Pressable>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={s.titre}>{titre}</Text>
      {sous && <Text style={s.sous}>{sous}</Text>}
    </LinearGradient>
  );
}

/** Carte de section avec titre coloré. */
export function Section({ titre, children, accent = '#6B4DFF' }: {
  titre: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <View style={s.section}>
      <View style={[s.sectionBar, { backgroundColor: accent }]} />
      <Text style={[s.sectionTitre, { color: accent }]}>{titre}</Text>
      {children}
    </View>
  );
}

/** Paragraphe de texte. */
export function P({ children }: { children: React.ReactNode }) {
  return <Text style={s.p}>{children}</Text>;
}

/** Mot/segment en gras inline (à utiliser dans un P). */
export function B({ children }: { children: React.ReactNode }) {
  return <Text style={s.b}>{children}</Text>;
}

/** Citation / encadré mis en valeur. */
export function Quote({ children, accent = '#6B4DFF' }: { children: React.ReactNode; accent?: string }) {
  return (
    <View style={[s.quote, { borderLeftColor: accent, backgroundColor: `${accent}12` }]}>
      <Text style={[s.quoteText, { color: accent }]}>{children}</Text>
    </View>
  );
}

/** Élément de liste numérotée (étape). */
export function Step({ num, titre, children, accent = '#6B4DFF' }: {
  num: number; titre: string; children?: React.ReactNode; accent?: string;
}) {
  return (
    <View style={s.step}>
      <View style={[s.stepNum, { backgroundColor: accent }]}>
        <Text style={s.stepNumText}>{num}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.stepTitre}>{titre}</Text>
        {children && <Text style={s.stepText}>{children}</Text>}
      </View>
    </View>
  );
}

/** Fait clé en chiffre. */
export function Fact({ val, lbl, accent = '#6B4DFF' }: { val: string; lbl: string; accent?: string }) {
  return (
    <View style={s.fact}>
      <Text style={[s.factVal, { color: accent }]}>{val}</Text>
      <Text style={s.factLbl}>{lbl}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 54, paddingBottom: 26, paddingHorizontal: 24, alignItems: 'center' },
  back: { position: 'absolute', top: 54, left: 18 },
  emoji: { fontSize: 50, marginBottom: 8 },
  titre: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', textAlign: 'center' },
  sous: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },

  section: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  sectionBar: { width: 36, height: 4, borderRadius: 2, marginBottom: 10 },
  sectionTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 10 },
  p: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#3A4150', lineHeight: 24, marginBottom: 10 },
  b: { fontFamily: 'Nunito_800ExtraBold', color: '#1B2333' },
  quote: {
    borderLeftWidth: 4, borderRadius: 10, padding: 14, marginBottom: 10,
  },
  quoteText: { fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },
  step: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  stepNum: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#fff' },
  stepTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333', marginTop: 4 },
  stepText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#6A7280', lineHeight: 21, marginTop: 3 },
  fact: {
    flex: 1, backgroundColor: '#F4F5F9', borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 2,
  },
  factVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24 },
  factLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: '#8A8F99', textAlign: 'center' },
});

/** Conteneur scroll standard pour une page doc. */
export function DocScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

export const docStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  factsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
});
