import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import SegmentProgress from '../../components/SegmentProgress';
import OptionTile from '../../components/OptionTile';
import { useUserStore } from '../../store/userStore';

type Objectif = 'lire' | 'hifz' | 'tafsir' | 'complet';

const OPTIONS: {
  id: Objectif; icon: keyof typeof Feather.glyphMap; iconColor: string; iconBg: string;
  bg: string; title: string; subtitle: string;
}[] = [
  { id: 'lire', icon: 'book', iconColor: '#3B6FD4', iconBg: '#DCE6FB', bg: '#DEE6FB', title: 'Apprendre à lire', subtitle: 'Alphabet → tajwid → lecture fluide' },
  { id: 'hifz', icon: 'star', iconColor: '#6B4DFF', iconBg: '#E7DEFB', bg: '#EBE3FC', title: 'Mémoriser (Hifz)', subtitle: 'Récitation + répétition espacée' },
  { id: 'tafsir', icon: 'moon', iconColor: '#E0A02C', iconBg: '#FBEFD3', bg: '#FBEFD3', title: 'Comprendre (Tafsir)', subtitle: 'Sens, contexte, Ibn Kathir' },
  { id: 'complet', icon: 'star', iconColor: '#F6B100', iconBg: '#ECEFF3', bg: '#ECEEF2', title: 'Complet — les trois', subtitle: 'Lecture + Hifz + Sens (Plus)' },
];

export default function ObjectifScreen() {
  const router = useRouter();
  const setObjectif = useUserStore((s) => s.setObjectif);
  const [selected, setSelected] = useState<Objectif>('hifz');

  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <SegmentProgress total={4} filled={2} />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Feather name="target" size={52} color="#E0584F" />
        </View>
        <Text style={styles.title}>Quel est ton objectif ?</Text>

        {OPTIONS.map((o) => (
          <OptionTile
            key={o.id}
            icon={<Feather name={o.icon} size={24} color={o.iconColor} />}
            iconBg={o.iconBg}
            title={o.title}
            subtitle={o.subtitle}
            selected={selected === o.id}
            ringColor="#6B4DFF"
            defaultBg={o.bg}
            selectedBg={o.bg}
            onPress={() => setSelected(o.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.cta}
          onPress={() => { setObjectif(selected); router.push('/(setup)/temps'); }}
        >
          <Text style={styles.ctaLabel}>Continuer →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  iconWrap: { alignItems: 'center' },
  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: '#1B2333',
    textAlign: 'center', marginTop: 14, marginBottom: 26,
  },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 30 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
});
