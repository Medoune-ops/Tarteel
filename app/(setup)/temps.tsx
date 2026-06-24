import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import SegmentProgress from '../../components/SegmentProgress';
import OptionTile from '../../components/OptionTile';
import { useUserStore } from '../../store/userStore';

const OPTIONS: {
  id: number; icon: keyof typeof Feather.glyphMap; iconColor: string; iconBg: string;
  title: string; subtitle: string;
}[] = [
  { id: 5, icon: 'zap', iconColor: '#E0A800', iconBg: '#FBF0CF', title: '5 min — Casual', subtitle: '1 leçon courte par jour' },
  { id: 10, icon: 'zap', iconColor: '#F0820C', iconBg: '#FBE3D2', title: '10 min — Régulier', subtitle: '2 leçons par jour' },
  { id: 20, icon: 'trending-up', iconColor: '#2A9E1C', iconBg: '#E2F0E7', title: '20 min — Sérieux', subtitle: '3–4 leçons par jour' },
  { id: 30, icon: 'award', iconColor: '#E0A02C', iconBg: '#FBEFD0', title: '30 min+ — Intensif', subtitle: '5–6 leçons + révisions SRS' },
];

export default function TempsScreen() {
  const router = useRouter();
  const setDailyMinutes = useUserStore((s) => s.setDailyMinutes);
  const [selected, setSelected] = useState(10);

  return (
    <View style={styles.screen}>
      <DeviceStatusBar />
      <SegmentProgress total={4} filled={3} />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Feather name="clock" size={52} color="#6B7280" />
        </View>
        <Text style={styles.title}>Combien de temps par jour ?</Text>

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
          onPress={() => { setDailyMinutes(selected); router.push('/(setup)/plan'); }}
        >
          <Text style={styles.ctaLabel}>C'est parti ! 🚀</Text>
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
