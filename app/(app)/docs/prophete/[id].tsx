import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { DocHeader, Quote } from '../_components';
import { PROPHETES, usePropheteLocalized } from '../_prophetes-data';
import { useT } from '../../../../lib/i18n';

const C = '#D96E00';

export default function PropheteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tr = useT();
  const p = PROPHETES.find((x) => x.id === id) ?? PROPHETES[0];
  const { titre, histoire, verset } = usePropheteLocalized(p);
  const numero = PROPHETES.indexOf(p) + 1;

  return (
    <View style={styles.screen}>
      <DocHeader emoji={p.emoji} titre={p.nom} sous={p.fr ? `${p.arabe}  ·  ${p.fr}` : p.arabe} c1="#F0820C" c2="#D96E00" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Bandeau titre */}
        <View style={styles.banner}>
          <View style={styles.bannerNum}>
            <Text style={styles.bannerNumText}>{numero}</Text>
            <Text style={styles.bannerNumLbl}>{tr('docProphete.numOf25')}</Text>
          </View>
          <Text style={styles.bannerTitre}>{titre}</Text>
        </View>

        {/* Histoire */}
        <View style={styles.card}>
          <View style={styles.bar} />
          <Text style={styles.sectionTitre}>{tr('docProphete.hisStory')}</Text>
          {histoire.map((para, i) => (
            <Text key={i} style={styles.para}>{para}</Text>
          ))}
        </View>

        {/* Verset cité dans l'histoire (seulement quand le récit en cite un). */}
        {p.versetArabe && verset && (
          <Quote accent={C} arabe={p.versetArabe} arabeSize={16} arabeLineHeight={28}>{verset}</Quote>
        )}

        {/* Rappel — traduction + version arabe (RTL) */}
        <View style={styles.note}>
          <Text style={styles.noteArabe}>{tr('docProphete.noteArabe')}</Text>
          <Text style={styles.noteText}>
            🤍 {tr('docProphete.note')}
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { padding: 18, paddingBottom: 30 },
  banner: {
    backgroundColor: '#FFF0E0', borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14,
  },
  bannerNum: { alignItems: 'center', width: 48 },
  bannerNumText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#D96E00' },
  bannerNumLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 10, color: '#C08040', marginTop: -4 },
  bannerTitre: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333', lineHeight: 22 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  bar: { width: 36, height: 4, borderRadius: 2, backgroundColor: C, marginBottom: 10 },
  sectionTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: C, marginBottom: 10 },
  para: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#3A4150', lineHeight: 24, marginBottom: 12 },
  note: { backgroundColor: '#FFF8F0', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderLeftColor: C },
  noteArabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 14, lineHeight: 24, color: '#8A5A20',
    textAlign: 'right', writingDirection: 'rtl', marginBottom: 8,
  },
  noteText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#8A5A20', lineHeight: 22 },
});
