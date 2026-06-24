import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import DeviceStatusBar from '../../../components/StatusBar';
import { KaabaIcon, MosqueIcon, MinaretIcon } from '../../../components/IslamicIcons';
import { useUserStore } from '../../../store/userStore';

function Dashed() {
  return <View style={styles.dashed} />;
}

function CompletedNode({ align }: { align: 'left' | 'right' | 'center' }) {
  return (
    <View style={[styles.nodeRow, alignStyle(align)]}>
      <View style={styles.completed}>
        <KaabaIcon size={46} />
      </View>
    </View>
  );
}

function LockedNode({ align }: { align: 'left' | 'right' | 'center' }) {
  return (
    <View style={[styles.nodeRow, alignStyle(align)]}>
      <View style={styles.locked}>
        <MinaretIcon size={32} />
      </View>
    </View>
  );
}

function ActiveNode({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} style={[styles.nodeRow, { marginRight: 30 }]}>
      <View style={{ alignItems: 'center' }}>
        <Animated.View style={[styles.activeRing, ringStyle]}>
          <View style={styles.activeInner}>
            <MosqueIcon size={52} />
          </View>
        </Animated.View>
        <Text style={styles.activeLabel}>Leçon 4</Text>
      </View>
    </Pressable>
  );
}

function alignStyle(align: 'left' | 'right' | 'center') {
  if (align === 'left') return { marginLeft: 120 };
  if (align === 'right') return { marginRight: 120 };
  return {};
}

export default function ParcoursScreen() {
  const router = useRouter();
  const { streak, xp, hearts } = useUserStore();

  return (
    <View style={styles.screen}>
      <View style={styles.statusWrap}>
        <DeviceStatusBar />
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Feather name="zap" size={22} color="#F0820C" />
          <Text style={[styles.statText, { color: '#F0820C' }]}>{streak}</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="zap" size={22} color="#E8A800" />
          <Text style={[styles.statText, { color: '#E8A800' }]}>{xp} XP</Text>
        </View>
        <View style={styles.stat}>
          <Feather name="heart" size={22} color="#FF4B4B" />
          <Text style={[styles.statText, { color: '#FF4B4B' }]}>{hearts}</Text>
        </View>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionText}>Section 1 · Alphabet Arabe</Text>
        <Feather name="type" size={20} color="#fff" />
      </View>

      <ScrollView contentContainerStyle={styles.path} showsVerticalScrollIndicator={false}>
        <CompletedNode align="left" />
        <Dashed />
        <CompletedNode align="right" />
        <Dashed />
        <CompletedNode align="left" />
        <Dashed />
        <ActiveNode onPress={() => router.push('/(app)/lesson/listen')} />
        <Dashed />
        <LockedNode align="left" />
        <Dashed />
        <LockedNode align="right" />
        <Dashed />
        <LockedNode align="center" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  statusWrap: { backgroundColor: '#fff' },
  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 26, paddingVertical: 14, backgroundColor: '#fff',
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21 },
  sectionHeader: {
    backgroundColor: '#34C724', flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 26, paddingVertical: 18,
  },
  sectionText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  path: { alignItems: 'center', paddingVertical: 46 },
  nodeRow: { alignItems: 'center' },
  completed: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 6, borderBottomColor: '#2A9E1C',
  },
  locked: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#E2E4E9',
    alignItems: 'center', justifyContent: 'center', opacity: 0.6,
  },
  activeRing: {
    width: 118, height: 118, borderRadius: 59, backgroundColor: 'rgba(52,199,36,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  activeInner: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: '#34C724',
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 6, borderBottomColor: '#2A9E1C',
  },
  activeLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#2A9E1C', marginTop: 8 },
  dashed: {
    height: 30, borderLeftWidth: 3, borderColor: '#C9CDD4',
    borderStyle: 'dashed', width: 0,
  },
});
