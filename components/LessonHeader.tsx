import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from './StatusBar';
import ProgressBar from './ProgressBar';

interface LessonHeaderProps {
  progress: number; // 0–1
  hearts?: number; // si défini, affiche les coeurs
  progressColor?: string;
}

export default function LessonHeader({ progress, hearts, progressColor = '#34C724' }: LessonHeaderProps) {
  const router = useRouter();

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
        {hearts !== undefined && (
          <View style={styles.hearts}>
            {Array.from({ length: hearts }).map((_, i) => (
              <Feather key={i} name="heart" size={18} color="#FF4B4B" />
            ))}
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 12 },
  close: { fontSize: 24, color: '#9AA0AA' },
  hearts: { flexDirection: 'row', gap: 3 },
});
