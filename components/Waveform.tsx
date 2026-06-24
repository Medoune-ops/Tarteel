import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

const BARS = [30, 60, 90, 50, 80, 100, 45, 75, 55, 90, 35, 65];

function Bar({ base, delay }: { base: number; delay: number }) {
  const h = useSharedValue(base);
  useEffect(() => {
    const target = Math.min(100, base + 30);
    const low = Math.max(20, base - 25);
    h.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(target, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(low, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ height: `${h.value}%` }));
  return <Animated.View style={[styles.bar, style]} />;
}

export default function Waveform() {
  return (
    <View style={styles.container}>
      {BARS.map((b, i) => (
        <Bar key={i} base={b} delay={i * 50} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%', backgroundColor: '#DCF5D6', borderRadius: 18, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 84,
  },
  bar: { width: 8, backgroundColor: '#34C724', borderRadius: 4 },
});
