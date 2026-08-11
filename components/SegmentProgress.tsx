import { View, StyleSheet } from 'react-native';

interface SegmentProgressProps {
  total: number;
  filled: number;
}

/** Barre de progression à segments (config onboarding). */
export default function SegmentProgress({ total, filled }: SegmentProgressProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: i < filled ? '#34C724' : '#DDE0E6' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingTop: 14 },
  seg: { flex: 1, height: 9, borderRadius: 5 },
});
