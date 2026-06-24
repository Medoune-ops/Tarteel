import React from 'react';
import { Pressable, Text, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CTAButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'violet' | 'green' | 'white' | 'red';
  style?: ViewStyle;
  disabled?: boolean;
}

export default function CTAButton({
  label, onPress, variant = 'violet', style, disabled,
}: CTAButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => { scale.value = withTiming(0.97, { duration: 80 }); };
  const handlePressOut = () => { scale.value = withTiming(1, { duration: 120 }); };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animStyle, styles.base, styles[variant], style]}
    >
      <Text style={[styles.label, styles[`label_${variant}` as keyof typeof styles]]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  violet: {
    backgroundColor: '#6B4DFF',
    shadowColor: 'rgba(107,77,255,1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 8,
  },
  green: {
    backgroundColor: '#34C724',
    borderBottomWidth: 5,
    borderBottomColor: '#2A9E1C',
  },
  white: {
    backgroundColor: '#FFFFFF',
  },
  red: {
    backgroundColor: '#FF4B4B',
    borderBottomWidth: 5,
    borderBottomColor: '#D43A3A',
  },
  label: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 20,
  },
  label_violet: { color: '#FFFFFF' },
  label_green: { color: '#FFFFFF' },
  label_white: { color: '#6B4DFF' },
  label_red: { color: '#FFFFFF' },
});
