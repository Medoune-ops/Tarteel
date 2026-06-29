import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';

const LANGUES = [
  { id: 'fr' as const, drapeau: '🇫🇷', nom: 'Français',  natif: 'Français' },
  { id: 'en' as const, drapeau: '🇬🇧', nom: 'Anglais',   natif: 'English'  },
  { id: 'ar' as const, drapeau: '🇸🇦', nom: 'Arabe',     natif: 'العربية'  },
];

export default function LangueScreen() {
  const router = useRouter();
  const language = useUserStore((s) => s.language);
  const setLanguage = useUserStore((s) => s.setLanguage);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Langue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>LANGUE DE L'INTERFACE</Text>
        <View style={styles.card}>
          {LANGUES.map((l, i) => {
            const actif = language === l.id;
            return (
              <Pressable
                key={l.id}
                style={[styles.row, i > 0 && styles.divider]}
                onPress={() => setLanguage(l.id)}
              >
                <Text style={styles.drapeau}>{l.drapeau}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{l.nom}</Text>
                  <Text style={styles.rowSub}>{l.natif}</Text>
                </View>
                <View style={[styles.radio, actif && styles.radioActif]}>
                  {actif && <Feather name="check" size={16} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.note}>
          La langue de récitation et du texte coranique reste l'arabe.
        </Text>
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
  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
  drapeau: { fontSize: 30 },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  rowSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 2 },
  radio: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#C9CDD4',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActif: { borderColor: '#6B4DFF', backgroundColor: '#6B4DFF' },
  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 18, paddingHorizontal: 12 },
});
