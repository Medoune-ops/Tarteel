import { Pressable, View, StyleSheet } from 'react-native';

interface ToggleProps {
  value: boolean;
  onChange?: (v: boolean) => void;
}

export default function Toggle({ value, onChange }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onChange?.(!value)}
      style={[styles.track, { backgroundColor: value ? '#6B4DFF' : '#D4D7DD' }]}
    >
      <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 30, borderRadius: 16, justifyContent: 'center' },
  knob: {
    position: 'absolute', top: 3, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff',
  },
  knobOn: { right: 3 },
  knobOff: { left: 3 },
});
