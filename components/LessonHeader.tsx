import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from './StatusBar';
import ProgressBar from './ProgressBar';
import { useUserStore } from '../store/userStore';

interface LessonHeaderProps {
  progress: number; // 0–1
  /** Affiche le compteur de cœurs (branché sur le store). */
  showHearts?: boolean;
  progressColor?: string;
}

export default function LessonHeader({ progress, showHearts = true, progressColor = '#34C724' }: LessonHeaderProps) {
  const router = useRouter();
  const hearts = useUserStore((s) => s.hearts);
  const isPremium = useUserStore((s) => s.isPremium);

  return (
    <>
      <DeviceStatusBar />
      <View style={styles.row}>
        <Pressable onPress={() => router.replace('/(app)/(tabs)/parcours')}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ProgressBar progress={progress} color={progressColor} />
        </View>
        {showHearts && (
          <View style={styles.hearts}>
            <Feather name="heart" size={20} color="#FF4B4B" />
            <Text style={styles.heartCount}>{isPremium ? '∞' : hearts}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 12 },
  close: { fontSize: 24, color: '#9AA0AA' },
  hearts: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heartCount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#FF4B4B', minWidth: 16, textAlign: 'center' },
});
