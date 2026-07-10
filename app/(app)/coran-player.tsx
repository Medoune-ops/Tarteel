import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TrackPlayer, { useActiveTrack, useProgress, useIsPlaying, RepeatMode } from 'react-native-track-player';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { RECITERS, reciterById } from '../../constants/reciters';
import { changeReciter, getCurrentReciterId, getCurrentSourates } from '../../constants/trackPlayer';

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

/** Formate des secondes en "m:ss". */
function fmt(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Lecteur audio du Coran (react-native-track-player). Lecture en arrière-plan
// + contrôles écran verrouillé gérés nativement. Ici : contrôles in-app
// (play/pause, précédent/suivant, vitesse, boucle) + choix du récitateur.
export default function CoranPlayerScreen() {
  const router = useRouter();
  const T = useTheme();
  const track = useActiveTrack();
  const { position, duration } = useProgress(500);
  const { playing } = useIsPlaying();

  const [speed, setSpeed] = useState(1);
  const [looping, setLooping] = useState(false);
  const [reciterId, setReciterId] = useState(getCurrentReciterId());

  // Boucle : RepeatMode.Track = répète la sourate ; sinon Queue = enchaîne.
  useEffect(() => {
    TrackPlayer.setRepeatMode(looping ? RepeatMode.Track : RepeatMode.Queue).catch(() => {});
  }, [looping]);

  const applySpeed = (rate: number) => {
    setSpeed(rate);
    TrackPlayer.setRate(rate).catch(() => {});
  };

  const onChangeReciter = async (id: string) => {
    if (id === reciterId) return;
    setReciterId(id);
    await changeReciter(reciterById(id));
    TrackPlayer.setRate(speed).catch(() => {}); // conserve la vitesse choisie
  };

  // Nom arabe de la sourate courante (via la file mémorisée).
  const numero = track?.id ? Number(track.id) : null;
  const arabe = getCurrentSourates().find((s) => s.numero === numero)?.nomArabe ?? '';
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <LinearGradient colors={['#9A6CF5', '#7C3AED']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-down" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerSmall}>Lecture en cours</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {!track ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 40 }}>🎧</Text>
            <Text style={[styles.emptyText, { color: T.textSecondary }]}>
              Aucune sourate en lecture. Choisis-en une dans la liste.
            </Text>
          </View>
        ) : (
          <>
            {/* Pochette / sourate courante */}
            <View style={styles.artWrap}>
              <LinearGradient colors={['#B79AF7', '#7C3AED']} style={styles.art}>
                <Text style={styles.artArabe}>{arabe}</Text>
              </LinearGradient>
            </View>
            <Text style={[styles.title, { color: T.text }]}>{track.title ?? ''}</Text>
            <Text style={[styles.artist, { color: T.textSecondary }]}>{track.artist ?? ''}</Text>

            {/* Barre de progression */}
            <View style={[styles.progressTrack, { backgroundColor: T.selectorBg }]}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={[styles.time, { color: T.textTertiary }]}>{fmt(position)}</Text>
              <Text style={[styles.time, { color: T.textTertiary }]}>{fmt(duration)}</Text>
            </View>

            {/* Contrôles principaux */}
            <View style={styles.controls}>
              <Pressable onPress={() => TrackPlayer.skipToPrevious().catch(() => {})} hitSlop={10}>
                <Feather name="skip-back" size={30} color={T.text} />
              </Pressable>
              <Pressable
                style={styles.playBtn}
                onPress={() => (playing ? TrackPlayer.pause() : TrackPlayer.play())}
              >
                <Feather name={playing ? 'pause' : 'play'} size={32} color="#fff" />
              </Pressable>
              <Pressable onPress={() => TrackPlayer.skipToNext().catch(() => {})} hitSlop={10}>
                <Feather name="skip-forward" size={30} color={T.text} />
              </Pressable>
            </View>

            {/* Boucle + vitesse */}
            <View style={styles.optRow}>
              <Pressable
                style={[styles.loopBtn, { borderColor: looping ? '#8A5CF0' : T.border, backgroundColor: looping ? '#8A5CF0' : T.cardBg }]}
                onPress={() => setLooping((v) => !v)}
              >
                <Feather name="repeat" size={16} color={looping ? '#fff' : T.textSecondary} />
                <Text style={[styles.loopText, { color: looping ? '#fff' : T.textSecondary }]}>
                  {looping ? 'Boucle activée' : 'Boucle'}
                </Text>
              </Pressable>
            </View>

            <Text style={[styles.optLabel, { color: T.textSecondary }]}>Vitesse</Text>
            <View style={styles.speedRow}>
              {SPEEDS.map((r) => {
                const active = r === speed;
                return (
                  <Pressable
                    key={r}
                    onPress={() => applySpeed(r)}
                    style={[styles.speedChip, { backgroundColor: active ? '#8A5CF0' : T.cardBg, borderColor: active ? '#8A5CF0' : T.border }]}
                  >
                    <Text style={[styles.speedText, { color: active ? '#fff' : T.text }]}>{r}×</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.optLabel, { color: T.textSecondary }]}>Récitateur</Text>
            <View style={styles.reciterRow}>
              {RECITERS.map((rc) => {
                const active = rc.id === reciterId;
                return (
                  <Pressable
                    key={rc.id}
                    onPress={() => onChangeReciter(rc.id)}
                    style={[styles.reciterChip, { backgroundColor: active ? '#8A5CF0' : T.cardBg, borderColor: active ? '#8A5CF0' : T.border }]}
                  >
                    <Text style={[styles.reciterText, { color: active ? '#fff' : T.text }]}>{rc.nom}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: 30 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 22, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 16, left: 18, zIndex: 2 },
  headerSmall: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: 'rgba(255,255,255,0.95)', marginTop: 4 },

  body: { padding: 22 },
  emptyBox: { alignItems: 'center', gap: 14, paddingVertical: 60 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center', paddingHorizontal: 20 },

  artWrap: { alignItems: 'center', marginTop: 10, marginBottom: 22 },
  art: { width: 220, height: 220, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  artArabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 64, color: '#fff' },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, textAlign: 'center' },
  artist: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', marginTop: 2 },

  progressTrack: { height: 6, borderRadius: 3, marginTop: 22, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#8A5CF0' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36, marginTop: 22 },
  playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#8A5CF0', alignItems: 'center', justifyContent: 'center' },

  optRow: { alignItems: 'center', marginTop: 22 },
  loopBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  loopText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  optLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  speedRow: { flexDirection: 'row', gap: 10 },
  speedChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5 },
  speedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  reciterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reciterChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1.5 },
  reciterText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
});
