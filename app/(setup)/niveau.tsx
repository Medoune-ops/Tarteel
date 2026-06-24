import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import SegmentProgress from '../../components/SegmentProgress';
import OptionTile from '../../components/OptionTile';
import Otter from '../../components/Otter';
import { useUserStore } from '../../store/userStore';

type Level = 'debutant' | 'alphabet' | 'lent' | 'fluent';

const OPTIONS: {
  id: Level; icon: keyof typeof Feather.glyphMap; iconColor: string; iconBg: string;
  title: string; subtitle: string;
}[] = [
  { id: 'debutant', icon: 'type', iconColor: '#6B4DFF', iconBg: '#E6E8F6', title: 'Débutant absolu', subtitle: "Je ne connais pas l'alphabet" },
  { id: 'alphabet', icon: 'book-open', iconColor: '#2A9E1C', iconBg: '#E2F0E7', title: 'Alphabet connu', subtitle: 'Je connais les lettres' },
  { id: 'lent', icon: 'music', iconColor: '#E0820C', iconBg: '#FBE8D4', title: 'Lecteur lent', subtitle: 'Je lis avec difficultés' },
  { id: 'fluent', icon: 'star', iconColor: '#6B4DFF', iconBg: '#ECE5FB', title: 'Lecteur fluent', subtitle: 'Je veux mémoriser / comprendre' },
];

export default function NiveauScreen() {
  const router = useRouter();
  const setLevel = useUserStore((s) => s.setLevel);
  const [selected, setSelected] = useState<Level>('debutant');

  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <SegmentProgress total={4} filled={1} />

      <View style={styles.body}>
        <View style={styles.otterWrap}>
          <Otter size={70} />
        </View>
        <Text style={styles.title}>Quel est ton niveau en arabe ?</Text>

        {OPTIONS.map((o) => (
          <OptionTile
            key={o.id}
            icon={<Feather name={o.icon} size={24} color={o.iconColor} />}
            iconBg={o.iconBg}
            title={o.title}
            subtitle={o.subtitle}
            selected={selected === o.id}
            onPress={() => setSelected(o.id)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.cta}
          onPress={() => { setLevel(selected); router.push('/(setup)/objectif'); }}
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
  otterWrap: { alignItems: 'center' },
  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, color: '#1B2333',
    textAlign: 'center', marginTop: 14, marginBottom: 26, lineHeight: 37,
  },
  footer: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 30 },
  cta: {
    height: 60, borderRadius: 18, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 5, borderBottomColor: '#2A9E1C',
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
});
