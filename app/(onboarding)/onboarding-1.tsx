import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Otter from '../../components/Otter';

const DOTS = [true, false, false];

export default function Onboarding1() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#E9E4FB' }]}>
        <Pressable style={styles.skip} onPress={() => router.replace('/(onboarding)/signup')}>
          <Text style={[styles.skipText, { color: '#A9A2C2' }]}>Passer</Text>
        </Pressable>
        <Text style={{ fontSize: 50, marginBottom: 12 }}>🎧</Text>
        <Otter size={150} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.title}>Écoute et répète</Text>
        <Text style={styles.desc}>Améliore ta prononciation avec l'intelligence artificielle</Text>

        <View style={styles.flex} />

        {/* Pagination */}
        <View style={styles.dots}>
          {DOTS.map((active, i) => (
            <View key={i} style={[styles.dot, active && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => router.push('/(onboarding)/onboarding-2')}
        >
          <Text style={styles.ctaLabel}>Suivant →</Text>
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
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 34,
    color: '#1B2333',
    textAlign: 'center',
  },
  desc: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 19,
    color: '#7A828F',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 28,
  },
  flex: { flex: 1 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 26 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D9D5E8' },
  dotActive: { width: 26, backgroundColor: '#6B4DFF' },
  cta: {
    width: '100%',
    height: 62,
    borderRadius: 20,
    backgroundColor: '#6B4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B4DFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, color: '#fff' },
});
