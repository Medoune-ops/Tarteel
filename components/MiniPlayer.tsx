import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../utils/useTheme';
import { useActiveTrack, useProgress, useIsPlaying, audioControls } from '../constants/trackPlayer';

// Écrans avec la tab bar visible (76px + safe area) → le mini-player flotte
// juste au-dessus. Ailleurs (écrans empilés sans tab bar), il colle au bas.
const TAB_ROUTES = new Set(['/parcours', '/revisions', '/ligues', '/coran', '/profil']);

// Mini-lecteur flottant : reste visible partout dans l'app (hors l'écran plein
// écran du lecteur lui-même) tant qu'une sourate est chargée, pour pouvoir
// mettre en pause/reprendre/changer de sourate sans revenir sur cet écran.
export default function MiniPlayer() {
  const router = useRouter();
  const pathname = usePathname();
  const T = useTheme();
  const track = useActiveTrack();
  const { position, duration } = useProgress(500);
  const { playing } = useIsPlaying();

  if (!track || pathname === '/coran-player') return null;

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const hasTabBar = TAB_ROUTES.has(pathname);

  return (
    <Pressable
      style={[styles.wrap, { backgroundColor: T.cardBg, borderColor: T.border, bottom: hasTabBar ? 84 : 16 }]}
      onPress={() => router.push('/(app)/coran-player')}
    >
      <View style={[styles.progressTrack, { backgroundColor: T.selectorBg }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.artNote}>
          <Feather name="headphones" size={18} color="#8A5CF0" />
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: T.text }]} numberOfLines={1}>{track.title ?? ''}</Text>
          <Text style={[styles.artist, { color: T.textSecondary }]} numberOfLines={1}>{track.artist ?? ''}</Text>
        </View>
        <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); audioControls.skipToPrevious(); }}>
          <Feather name="skip-back" size={20} color={T.text} />
        </Pressable>
        <Pressable
          hitSlop={10}
          style={styles.playBtn}
          onPress={(e) => { e.stopPropagation(); playing ? audioControls.pause() : audioControls.play(); }}
        >
          <Feather name={playing ? 'pause' : 'play'} size={18} color="#fff" />
        </Pressable>
        <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); audioControls.skipToNext(); }}>
          <Feather name="skip-forward" size={20} color={T.text} />
        </Pressable>
        <Pressable hitSlop={10} onPress={(e) => { e.stopPropagation(); audioControls.stop(); }}>
          <Feather name="x" size={20} color={T.textSecondary} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute', left: 8, right: 8,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 6,
  },
  progressTrack: { height: 2.5, width: '100%' },
  progressFill: { height: 2.5, backgroundColor: '#8A5CF0' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 9 },
  artNote: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#EFE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13.5 },
  artist: { fontFamily: 'Nunito_600SemiBold', fontSize: 11.5, marginTop: 1 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#8A5CF0',
    alignItems: 'center', justifyContent: 'center',
  },
});
