import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import {
  useActiveTrack, useProgress, useIsPlaying, RepeatMode, audioControls,
  getCurrentSourates,
} from '../../constants/trackPlayer';
import { fetchVersets, type SourateVersets } from '../../lib/api';
import { swrFetch } from '../../lib/api/swr';
import { sourateMeaning } from '../../constants/sourateMeaning';
import { LISTEN_LIGHT, LISTEN_DARK, G150, fmtTime, waveFor } from '../../constants/coranListenTheme';
import { PlayGlyph, PauseGlyph, PrevGlyph, NextGlyph, HeartGlyph, LoopGlyph } from '../../components/ListenIcons';
import { useCoranListenStore, SPEEDS } from '../../store/coranListenStore';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

// Lecteur audio du Coran plein écran (moteur expo-audio, voir
// constants/audioPlayer.ts). Lecture en arrière-plan + contrôles écran
// verrouillé gérés nativement. Ici : pochette, verset estimé, forme d'onde
// cliquable, boucle / précédent / lecture / suivant / vitesse, favori.
export default function CoranPlayerScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const P = T.isDark ? LISTEN_DARK : LISTEN_LIGHT;
  const language = useUserStore((s) => s.language);

  const track = useActiveTrack();
  const { position, duration } = useProgress(500);
  const { playing } = useIsPlaying();

  const speed = useCoranListenStore((s) => s.speed);
  const setSpeed = useCoranListenStore((s) => s.setSpeed);
  const looping = useCoranListenStore((s) => s.loop);
  const setLoop = useCoranListenStore((s) => s.setLoop);
  const favorites = useCoranListenStore((s) => s.favorites);
  const toggleFavorite = useCoranListenStore((s) => s.toggleFavorite);

  // Boucle : RepeatMode.Track = répète la sourate ; sinon Queue = enchaîne.
  useEffect(() => {
    audioControls.setRepeatMode(looping ? RepeatMode.Track : RepeatMode.Queue);
  }, [looping]);

  const cycleSpeed = () => {
    const i = SPEEDS.indexOf(speed as (typeof SPEEDS)[number]);
    const next = SPEEDS[(i + 1) % SPEEDS.length]!;
    setSpeed(next);
    audioControls.setRate(next);
  };

  const numero = track?.id ? Number(track.id) : null;
  const lite = numero != null ? getCurrentSourates().find((s) => s.numero === numero) : undefined;

  // Versets de la sourate en cours (texte + traduction de la carte « verset »).
  const [versets, setVersets] = useState<SourateVersets | null>(null);
  useEffect(() => {
    setVersets(null);
    if (numero == null) return;
    let cancelled = false;
    swrFetch(`versets:${numero}:${language}`, () => fetchVersets(numero, language))
      .then((d) => { if (!cancelled) setVersets(d); })
      // Hors-ligne : la carte retombe sur le nom de la sourate, l'audio continue.
      .catch(() => {});
    return () => { cancelled = true; };
  }, [numero, language]);

  const [waveW, setWaveW] = useState(0);

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const total = versets?.versets.length || lite?.nombreVersets || 0;
  /*
   * Verset ESTIMÉ au prorata du temps écoulé : l'API ne fournit pas les
   * horodatages de chaque verset dans le fichier de la sourate complète.
   * TODO backend : exposer les timings (début/fin) par verset et par
   * récitateur pour un suivi exact.
   */
  const vIdx = total > 0 ? Math.min(total - 1, Math.floor(progress * total)) : 0;
  const verse = versets?.versets[vIdx];
  const fr = numero != null ? sourateMeaning(numero, language) : null;
  const nom = lite?.nom ?? track?.title ?? '';
  const place =
    lite?.revelation === 'madinah' ? tr('lectureLibre.medinan')
      : lite?.revelation === 'makkah' ? tr('lectureLibre.meccan') : null;
  const fav = numero != null && favorites.includes(numero);
  const wave = waveFor(numero ?? 1);

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      <LinearGradient colors={P.playerBg} locations={[0, P.playerBgEnd]} style={StyleSheet.absoluteFill} />
      <DeviceStatusBar />

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: 26 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityLabel={tr('coranPlayer.close')}
            style={[styles.squareBtn, { backgroundColor: P.card }, T.isDark ? styles.borderDark : styles.shadow]}
          >
            <Feather name="chevron-down" size={22} color={P.ink} />
          </Pressable>
          <View style={styles.topMid}>
            <Text style={[styles.topLabel, { color: P.muted }]}>{tr('coranPlayer.headerSmall').toUpperCase()}</Text>
            <Text style={[styles.topReciter, { color: P.ink }]} numberOfLines={1}>{track?.artist ?? ''}</Text>
          </View>
          <Pressable
            onPress={() => { if (numero != null) toggleFavorite(numero); }}
            hitSlop={8}
            disabled={numero == null}
            accessibilityLabel={fav ? tr('coranPlayer.favRemove') : tr('coranPlayer.favAdd')}
            accessibilityState={{ selected: fav }}
            style={[styles.squareBtn, { backgroundColor: P.card }, T.isDark ? styles.borderDark : styles.shadow]}
          >
            <HeartGlyph size={20} color={fav ? '#E0584F' : '#8E8AA3'} filled={fav} />
          </Pressable>
        </View>

        {!track ? (
          <View style={styles.emptyBox}>
            <Feather name="headphones" size={40} color={P.accent} />
            <Text style={[styles.emptyText, { color: P.muted }]}>{tr('coranPlayer.noTrack')}</Text>
          </View>
        ) : (
          <>
            {/* Pochette : cercles décoratifs + nom arabe de la sourate. */}
            <LinearGradient colors={P.art} {...G150} style={[styles.art, T.isDark ? styles.artShDark : styles.artSh]}>
              <View style={[styles.ring, { width: 360, height: 360, borderRadius: 180 }]} />
              <View style={[styles.ring, { width: 270, height: 270, borderRadius: 135, borderColor: 'rgba(255,255,255,0.14)' }]} />
              <View style={styles.disc} />
              <Text style={styles.artWord}>سُورَة</Text>
              <Text style={styles.artArabe} numberOfLines={1} adjustsFontSizeToFit>{lite?.nomArabe ?? ''}</Text>
              {place ? (
                <View style={styles.artBadge}>
                  <Text style={styles.artBadgeText}>{place.toUpperCase()}</Text>
                </View>
              ) : null}
            </LinearGradient>

            <View style={styles.titleRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.title, { color: P.ink }]} numberOfLines={1}>
                  {numero != null ? `${numero}. ${nom}` : nom}
                </Text>
                <Text style={[styles.sub, { color: P.muted }]} numberOfLines={1}>
                  {[fr, total ? tr('tajwid.versetsCount', { n: total }) : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {total > 0 ? (
                <Text style={[styles.versePill, { backgroundColor: P.accentSoft, color: P.accent }]}>
                  {tr('lectureLibre.verseOf', { v: vIdx + 1, n: total })}
                </Text>
              ) : null}
            </View>

            <View style={[styles.verseCard, { backgroundColor: P.card }, T.isDark ? styles.borderDark : styles.shadow]}>
              <Text style={[styles.verseAr, { color: P.ink }]}>{verse?.texteArabe ?? lite?.nomArabe ?? ''}</Text>
              <Text style={[styles.verseFr, { color: P.muted }]}>
                {verse?.traduction?.texte ?? [nom, fr].filter(Boolean).join(' · ')}
              </Text>
            </View>

            {/* Forme d'onde : touche = saut à cette position. */}
            <Pressable
              style={styles.wave}
              onLayout={(e) => setWaveW(e.nativeEvent.layout.width)}
              accessibilityLabel={tr('coranPlayer.seek')}
              onPress={(e) => {
                if (waveW <= 0 || duration <= 0) return;
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / waveW));
                audioControls.seekTo(ratio * duration);
              }}
            >
              {wave.map((h, i) => (
                <View
                  key={i}
                  style={[styles.bar, { height: h, backgroundColor: ((i + 0.5) / wave.length) <= progress ? P.accent : P.track }]}
                />
              ))}
              <View pointerEvents="none" style={[styles.head, { left: `${progress * 100}%`, backgroundColor: P.ink }]} />
            </Pressable>
            <View style={styles.timeRow}>
              <Text style={[styles.time, { color: P.muted }]}>{fmtTime(position)}</Text>
              <Text style={[styles.time, { color: P.muted }]}>-{fmtTime(duration - position)}</Text>
            </View>

            <View style={styles.controls}>
              <Pressable
                onPress={() => setLoop(!looping)}
                accessibilityLabel={tr('coranPlayer.loop')}
                accessibilityState={{ selected: looping }}
                style={[styles.sideBtn, { backgroundColor: looping ? P.accent : 'transparent' }]}
              >
                <LoopGlyph size={20} color={looping ? '#fff' : '#8E8AA3'} />
              </Pressable>
              <Pressable onPress={() => audioControls.skipToPrevious()} accessibilityLabel={tr('coranPlayer.prev')} style={styles.skipBtn}>
                <PrevGlyph size={28} color={P.ink} />
              </Pressable>
              <Pressable
                onPress={() => (playing ? audioControls.pause() : audioControls.play())}
                accessibilityLabel={playing ? tr('lectureNumero.pause') : tr('lectureNumero.play')}
                style={[styles.playBtn, { backgroundColor: P.accent, shadowColor: P.accent }]}
              >
                {playing ? <PauseGlyph size={30} color="#fff" /> : <PlayGlyph size={30} color="#fff" />}
              </Pressable>
              <Pressable onPress={() => audioControls.skipToNext()} accessibilityLabel={tr('coranPlayer.next')} style={styles.skipBtn}>
                <NextGlyph size={28} color={P.ink} />
              </Pressable>
              <Pressable
                onPress={cycleSpeed}
                accessibilityLabel={tr('coranPlayer.speed')}
                style={[styles.sideBtn, { backgroundColor: P.accentSoft }]}
              >
                <Text style={[styles.speed, { color: P.accent }]}>{speed}×</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 22, flexGrow: 1 },
  shadow: {
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  borderDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

  top: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  squareBtn: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topMid: { flex: 1, alignItems: 'center' },
  topLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1 },
  topReciter: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center', paddingHorizontal: 20 },

  art: {
    alignSelf: 'center', marginTop: 22, width: 250, height: 250, borderRadius: 36, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  artSh: { shadowColor: '#5B3FD6', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.35, shadowRadius: 50, elevation: 12 },
  artShDark: { shadowColor: '#6E50FF', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.28, shadowRadius: 60, elevation: 12 },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  disc: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)' },
  artWord: { fontFamily: 'ScheherazadeNew_400Regular', fontSize: 20, lineHeight: 32, color: 'rgba(255,255,255,0.75)', marginBottom: -6 },
  artArabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 72, lineHeight: 94, color: '#fff', paddingHorizontal: 16 },
  artBadge: { position: 'absolute', bottom: 16, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.18)' },
  artBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 0.66, color: '#fff' },

  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 24 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 27, lineHeight: 35 },
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, marginTop: 2 },
  versePill: {
    fontFamily: 'Nunito_900Black', fontSize: 12, paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 10, overflow: 'hidden',
  },

  verseCard: { marginTop: 14, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, minHeight: 92 },
  verseAr: { fontFamily: 'ScheherazadeNew_400Regular', fontSize: 23, lineHeight: 36, textAlign: 'right', writingDirection: 'rtl' },
  verseFr: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19, marginTop: 4 },

  wave: { marginTop: 18, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bar: { width: 3, borderRadius: 2 },
  head: { position: 'absolute', top: 2, bottom: 2, width: 2, marginLeft: -1, borderRadius: 1 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  time: { fontFamily: 'Nunito_700Bold', fontSize: 12, fontVariant: ['tabular-nums'] },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  sideBtn: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.42, shadowRadius: 28, elevation: 8,
  },
  speed: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15 },
});
