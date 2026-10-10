import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'success' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Feather.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/** Bouton d'action du module Amis : scale au press + variantes cohérentes. */
export default function FriendButton({
  label, onPress, variant = 'primary', icon, loading, disabled, style,
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onIn = () => { scale.value = withTiming(0.97, { duration: 80 }); };
  const onOut = () => { scale.value = withTiming(1, { duration: 120 }); };

  const iconColor = variant === 'ghost' ? '#6B4DFF' : '#fff';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onIn}
      onPressOut={onOut}
      disabled={disabled || loading}
      style={[animStyle, styles.base, styles[variant], (disabled || loading) && { opacity: 0.55 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={18} color={iconColor} /> : null}
          <Text style={[styles.label, styles[`label_${variant}` as keyof typeof styles]]}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54, borderRadius: 16, width: '100%',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primary: {
    backgroundColor: '#6B4DFF', borderBottomWidth: 4, borderBottomColor: '#4A30CC',
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32, shadowRadius: 16, elevation: 6,
  },
  success: { backgroundColor: '#34C724', borderBottomWidth: 4, borderBottomColor: '#2A9E1C' },
  danger: { backgroundColor: '#E5484D', borderBottomWidth: 4, borderBottomColor: '#C13338' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#6B4DFF' },
  label: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },
  label_primary: { color: '#fff' },
  label_success: { color: '#fff' },
  label_danger: { color: '#fff' },
  label_ghost: { color: '#6B4DFF' },
});
