import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import FriendAvatar from './FriendAvatar';
import HeaderPattern from './HeaderPattern';

/** Dégradé d'identité du module Amis (3 temps, aligné sur asma/tajwid). */
export const FRIENDS_GRADIENT = ['#8B5CF6', '#6B4DFF', '#4A2FB8'] as const;

interface Props {
  title: string;
  subtitle?: string;
  /** Emoji affiché dans le médaillon (ignoré si `avatar` est fourni). */
  emoji?: string;
  /** Avatar d'ami affiché dans le médaillon (avec anneau blanc). */
  avatar?: { name: string; id?: string };
  /** Slot libre en haut à droite (badge non-lus, etc.). */
  right?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

/**
 * En-tête unifié des écrans Amis : dégradé 3 temps, filigrane « réseau »,
 * halos lumineux, médaillon (emoji ou avatar) et animation d'entrée.
 */
export default function FriendsHeader({
  title, subtitle, emoji, avatar, right, onBack, showBack = true,
}: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withDelay(60, withTiming(1, { duration: 440, easing: Easing.out(Easing.cubic) }));
  }, [progress]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 16 }],
  }));

  return (
    <LinearGradient
      colors={FRIENDS_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <HeaderPattern width={width} height={220} variant="network" opacity={0.16} />
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {showBack && (
        <Pressable onPress={onBack ?? (() => router.back())} style={styles.back} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
      )}
      {right ? <View style={styles.right}>{right}</View> : null}

      <Animated.View style={[styles.center, contentStyle]}>
        {avatar ? (
          <View style={styles.avatarRing}>
            <FriendAvatar name={avatar.name} id={avatar.id} size={64} />
          </View>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>{emoji ?? '👥'}</Text>
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <>
            <View style={styles.rule} />
            <Text style={styles.sub}>{subtitle}</Text>
          </>
        ) : null}
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 18, paddingBottom: 26, paddingHorizontal: 22,
    alignItems: 'center', overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    shadowColor: '#4A2FB8', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 6,
  },
  glow1: {
    position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  glow2: {
    position: 'absolute', bottom: -70, left: -40, width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  back: {
    position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  right: { position: 'absolute', top: 16, right: 16, zIndex: 2 },
  center: { alignItems: 'center', marginTop: 10 },
  badge: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  badgeEmoji: { fontSize: 30 },
  avatarRing: {
    width: 74, height: 74, borderRadius: 37,
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24, shadowRadius: 12, elevation: 5,
  },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', marginTop: 12 },
  rule: {
    width: 44, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: 8, marginBottom: 7,
  },
  sub: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13.5, color: 'rgba(255,255,255,0.92)',
    textAlign: 'center', paddingHorizontal: 8, lineHeight: 19,
  },
});
