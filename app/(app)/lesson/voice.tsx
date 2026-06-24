import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import LessonHeader from '../../../components/LessonHeader';
import Waveform from '../../../components/Waveform';
import ProgressBar from '../../../components/ProgressBar';

export default function VoiceScreen() {
  const router = useRouter();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  return (
    <View style={styles.screen}>
      <LessonHeader progress={0.88} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Récite cet ayat</Text>

        {/* Verset avec mot courant encadré */}
        <View style={styles.verseCard}>
          <Text style={styles.arabic}>
            اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ <Text style={styles.currentWord}>بِسْمِ</Text>
          </Text>
          <Text style={styles.translation}>
            Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux
          </Text>
        </View>

        {/* Waveform */}
        <View style={{ marginTop: 18, width: '100%' }}>
          <Waveform />
        </View>

        {/* Score en cours */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Score en cours :</Text>
          <View style={styles.scoreRow}>
            <View style={{ flex: 1 }}>
              <ProgressBar progress={0.87} />
            </View>
            <Text style={styles.scoreText}>87%</Text>
          </View>
        </View>

        {/* Bouton enregistrement */}
        <Pressable onPress={() => router.push('/(app)/lesson/feedback?ok=1')}>
          <Animated.View style={[styles.recordOuter, pulseStyle]}>
            <View style={styles.recordInner}>
              <Feather name="mic" size={40} color="#fff" />
            </View>
          </Animated.View>
        </Pressable>
        <Text style={styles.recording}>Enregistrement en cours...</Text>

        <View style={styles.tajwidRow}>
          <Feather name="zap" size={18} color="#6B4DFF" />
          <Text style={styles.tajwidText}>Règle : Madd Tabii (allonger 2 temps)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  content: { paddingHorizontal: 24, paddingTop: 8, alignItems: 'center' },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#1B2333', marginBottom: 18 },
  verseCard: { width: '100%', backgroundColor: '#E6E8ED', borderRadius: 20, paddingVertical: 26, paddingHorizontal: 20 },
  arabic: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 34, color: '#1B2333',
    lineHeight: 54, textAlign: 'center', writingDirection: 'rtl',
  },
  currentWord: {
    color: '#1B2333',
  },
  translation: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', marginTop: 12, textAlign: 'center' },
  scoreSection: { width: '100%', marginTop: 18 },
  scoreLabel: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#1B2333', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#2A9E1C' },
  recordOuter: {
    width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(255,75,75,0.16)',
    alignItems: 'center', justifyContent: 'center', marginTop: 28,
  },
  recordInner: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: '#FF4B4B',
    alignItems: 'center', justifyContent: 'center',
  },
  recording: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#FF4B4B', marginTop: 12 },
  tajwidRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, marginBottom: 24 },
  tajwidText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#6B4DFF' },
});
