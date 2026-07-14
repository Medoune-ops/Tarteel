import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Otter from '../../components/Otter';
import { useT } from '../../lib/i18n';

export default function Onboarding2() {
  const router = useRouter();
  const tr = useT();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { backgroundColor: '#FBEFD9' }]}>
        <Pressable style={styles.skip} onPress={() => router.replace('/(onboarding)/signup')}>
          <Text style={[styles.skipText, { color: '#C4B69B' }]}>{tr('onboarding.skip')}</Text>
        </Pressable>
        <Text style={{ fontSize: 50, marginBottom: 12 }}>🔥</Text>
        <Otter size={150} />
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{tr('onboarding2.title')}</Text>
        <Text style={styles.desc}>{tr('onboarding2.desc')}</Text>

        <View style={styles.flex} />

        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Pressable style={styles.cta} onPress={() => router.push('/(onboarding)/onboarding-3')}>
          <Text style={styles.ctaLabel}>{tr('onboarding.next')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: {
    height: 430,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: { position: 'absolute', top: 54, right: 28 },
  skipText: { fontFamily: 'Nunito_700Bold', fontSize: 17 },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 34,
    paddingTop: 46,
    paddingBottom: 30,
  },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: '#1B2333', textAlign: 'center' },
  desc: { fontFamily: 'Nunito_600SemiBold', fontSize: 19, color: '#7A828F', textAlign: 'center', marginTop: 14, lineHeight: 28 },
  flex: { flex: 1 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 26 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D9D5E8' },
  dotActive: { width: 26, backgroundColor: '#6B4DFF' },
  cta: {
    width: '100%', height: 62, borderRadius: 20, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 18, elevation: 8,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, color: '#fff' },
});
