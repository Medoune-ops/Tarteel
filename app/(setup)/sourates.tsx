import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import SegmentProgress from '../../components/SegmentProgress';
import { useUserStore } from '../../store/userStore';
import { playSound } from '../../constants/sounds';

/**
 * Sélection des sourates DÉJÀ MÉMORISÉES (onboarding, avant l'écran « plan »).
 * Les sourates cochées seront marquées comme acquises côté serveur → le parcours
 * démarre directement au premier contenu que l'utilisateur ne connaît pas.
 *
 * Liste = Al-Fatiha + Juz 'Amma (78→114), dans l'ordre du parcours (décroissant),
 * car ce sont de loin les sourates les plus fréquemment mémorisées.
 */
type Sourate = { numero: number; nom: string; arabe: string; versets: number };

// Ordre décroissant (An-Nas d'abord) pour coller à l'ordre du parcours.
const SOURATES: Sourate[] = [
  { numero: 1,   nom: 'Al-Fatiha',    arabe: 'الفاتحة',    versets: 7 },
  { numero: 114, nom: 'An-Nas',       arabe: 'الناس',      versets: 6 },
  { numero: 113, nom: 'Al-Falaq',     arabe: 'الفلق',      versets: 5 },
  { numero: 112, nom: 'Al-Ikhlas',    arabe: 'الإخلاص',    versets: 4 },
  { numero: 111, nom: 'Al-Masad',     arabe: 'المسد',      versets: 5 },
  { numero: 110, nom: 'An-Nasr',      arabe: 'النصر',      versets: 3 },
  { numero: 109, nom: 'Al-Kafirun',   arabe: 'الكافرون',   versets: 6 },
  { numero: 108, nom: 'Al-Kawthar',   arabe: 'الكوثر',     versets: 3 },
  { numero: 107, nom: "Al-Ma'un",     arabe: 'الماعون',    versets: 7 },
  { numero: 106, nom: 'Quraysh',      arabe: 'قريش',       versets: 4 },
  { numero: 105, nom: 'Al-Fil',       arabe: 'الفيل',      versets: 5 },
  { numero: 104, nom: 'Al-Humazah',   arabe: 'الهمزة',     versets: 9 },
  { numero: 103, nom: "Al-'Asr",      arabe: 'العصر',      versets: 3 },
  { numero: 102, nom: 'At-Takathur',  arabe: 'التكاثر',    versets: 8 },
  { numero: 101, nom: "Al-Qari'ah",   arabe: 'القارعة',    versets: 11 },
  { numero: 100, nom: "Al-'Adiyat",   arabe: 'العاديات',   versets: 11 },
  { numero: 99,  nom: 'Az-Zalzalah',  arabe: 'الزلزلة',    versets: 8 },
  { numero: 98,  nom: 'Al-Bayyinah',  arabe: 'البينة',     versets: 8 },
  { numero: 97,  nom: 'Al-Qadr',      arabe: 'القدر',      versets: 5 },
  { numero: 96,  nom: "Al-'Alaq",     arabe: 'العلق',      versets: 19 },
  { numero: 95,  nom: 'At-Tin',       arabe: 'التين',      versets: 8 },
  { numero: 94,  nom: 'Ash-Sharh',    arabe: 'الشرح',      versets: 8 },
  { numero: 93,  nom: 'Ad-Duha',      arabe: 'الضحى',      versets: 11 },
  { numero: 92,  nom: 'Al-Layl',      arabe: 'الليل',      versets: 21 },
  { numero: 91,  nom: 'Ash-Shams',    arabe: 'الشمس',      versets: 15 },
  { numero: 90,  nom: 'Al-Balad',     arabe: 'البلد',      versets: 20 },
  { numero: 89,  nom: 'Al-Fajr',      arabe: 'الفجر',      versets: 30 },
  { numero: 88,  nom: 'Al-Ghashiyah', arabe: 'الغاشية',    versets: 26 },
  { numero: 87,  nom: "Al-A'la",      arabe: 'الأعلى',     versets: 19 },
  { numero: 86,  nom: 'At-Tariq',     arabe: 'الطارق',     versets: 17 },
  { numero: 85,  nom: 'Al-Buruj',     arabe: 'البروج',     versets: 22 },
  { numero: 84,  nom: 'Al-Inshiqaq',  arabe: 'الإنشقاق',   versets: 25 },
  { numero: 83,  nom: 'Al-Mutaffifin', arabe: 'المطففين',  versets: 36 },
  { numero: 82,  nom: 'Al-Infitar',   arabe: 'الإنفطار',   versets: 19 },
  { numero: 81,  nom: 'At-Takwir',    arabe: 'التكوير',    versets: 29 },
  { numero: 80,  nom: 'Abasa',        arabe: 'عبس',        versets: 42 },
  { numero: 79,  nom: "An-Nazi'at",   arabe: 'النازعات',   versets: 46 },
  { numero: 78,  nom: 'An-Naba',      arabe: 'النبأ',      versets: 40 },
];

export default function SouratesScreen() {
  const router = useRouter();
  const setMemorizedSourates = useUserStore((s) => s.setMemorizedSourates);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (numero: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(numero)) next.delete(numero);
      else next.add(numero);
      return next;
    });
  };

  const onContinue = () => {
    playSound('start');
    setMemorizedSourates([...selected]);
    router.push('/(setup)/temps');
  };

  const count = selected.size;

  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <SegmentProgress total={5} filled={3} />

      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Feather name="book-open" size={46} color="#6B4DFF" />
        </View>
        <Text style={styles.title}>Connais-tu déjà des sourates ?</Text>
        <Text style={styles.subtitle}>
          Coche celles que tu as mémorisées — on les marquera comme acquises et ton
          parcours commencera directement au bon endroit.
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {SOURATES.map((s) => {
          const on = selected.has(s.numero);
          return (
            <Pressable
              key={s.numero}
              onPress={() => toggle(s.numero)}
              style={[styles.row, on && styles.rowOn]}
            >
              <View style={[styles.check, on && styles.checkOn]}>
                {on && <Feather name="check" size={16} color="#fff" />}
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowNom}>{s.nom}</Text>
                <Text style={styles.rowMeta}>{s.versets} versets</Text>
              </View>
              <Text style={styles.rowArabe}>{s.arabe}</Text>
            </Pressable>
          );
        })}
        <View style={{ height: 12 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.cta} onPress={onContinue}>
          <Text style={styles.ctaLabel}>
            {count > 0 ? `Continuer (${count}) →` : 'Je débute — passer →'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: { paddingHorizontal: 24, paddingTop: 14 },
  iconWrap: { alignItems: 'center' },
  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#1B2333',
    textAlign: 'center', marginTop: 12, lineHeight: 33,
  },
  subtitle: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#7A828F',
    textAlign: 'center', marginTop: 8, lineHeight: 20,
  },
  list: { flex: 1, marginTop: 16 },
  listContent: { paddingHorizontal: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E4E7EC',
    paddingVertical: 12, paddingHorizontal: 14, marginBottom: 10,
  },
  rowOn: { borderColor: '#6B4DFF', backgroundColor: '#F3F0FF' },
  check: {
    width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: '#D0D3DA',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  checkOn: { backgroundColor: '#6B4DFF', borderColor: '#6B4DFF' },
  rowText: { flex: 1 },
  rowNom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  rowMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#9AA0AA', marginTop: 1 },
  rowArabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 26, color: '#6B4DFF' },
  footer: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 30 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
});
