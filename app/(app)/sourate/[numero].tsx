import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchVersets, type SourateVersets, type Verset } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { playRemoteAudio, playRemoteAudioAsync, stopRemoteAudio } from '../../../constants/sounds';
import { useUserStore } from '../../../store/userStore';
import { useT } from '../../../lib/i18n';

export default function SourateReaderScreen() {
  const router = useRouter();
  const tr = useT();
  const { numero } = useLocalSearchParams<{ numero?: string }>();
  const language = useUserStore((s) => s.language);

  const [data, setData] = useState<SourateVersets | null>(null);
  const [error, setError] = useState(false);
  // Mot en cours de lecture : "versetId:position" (surlignage).
  const [playing, setPlaying] = useState<string | null>(null);
  // Lecture automatique mot par mot en cours ?
  const [autoPlaying, setAutoPlaying] = useState(false);

  // Drapeau de la boucle d'auto-lecture (source de vérité synchrone).
  const autoRef = useRef(false);
  // ScrollView + position verticale de chaque verset → surlignage qui défile.
  const scrollRef = useRef<ScrollView>(null);
  const verseY = useRef<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!numero) { setError(true); return; }
    setError(false);
    try {
      // Le texte coranique ne change jamais → cache mémoire, affichage instantané
      // quand on rouvre la même sourate dans la session.
      setData(await swrFetch(`versets:${numero}:${language}`, () => fetchVersets(numero, language)));
    } catch {
      setError(true);
    }
  }, [numero, language]);

  // Stoppe l'auto-lecture et coupe l'audio.
  const stopAuto = useCallback(() => {
    autoRef.current = false;
    setAutoPlaying(false);
    setPlaying(null);
    stopRemoteAudio();
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Quitter l'écran (ou changer de sourate) coupe toute lecture en cours.
    return () => stopAuto();
  }, [load, stopAuto]));

  // Fait défiler la vue vers le verset dont un mot est en cours de lecture.
  useEffect(() => {
    if (!playing) return;
    const versetId = playing.split(':')[0];
    const y = verseY.current[versetId];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
  }, [playing]);

  const playWord = (versetId: string, position: number, url: string | null) => {
    if (!url) return;
    // Un tap manuel prend la main sur l'auto-lecture.
    if (autoRef.current) stopAuto();
    const key = `${versetId}:${position}`;
    setPlaying(key);
    playRemoteAudio(url);
    // Repère visuel court (l'audio d'un mot dure < 2 s).
    setTimeout(() => setPlaying((p) => (p === key ? null : p)), 1500);
  };

  const playVerse = (url: string | null) => {
    if (autoRef.current) stopAuto();
    if (url) playRemoteAudio(url);
  };

  // Lance la lecture continue : enchaîne tous les mots (avec audio) de tous les
  // versets, dans l'ordre, en déplaçant le surlignage au fil de la récitation.
  const startAuto = useCallback(async () => {
    if (!data) return;
    const steps: { key: string; url: string }[] = [];
    for (const v of data.versets) {
      for (const m of v.mots) {
        if (m.audioUrl) steps.push({ key: `${v.id}:${m.position}`, url: m.audioUrl });
      }
    }
    if (steps.length === 0) return;

    autoRef.current = true;
    setAutoPlaying(true);
    for (const step of steps) {
      if (!autoRef.current) break;
      setPlaying(step.key);
      await playRemoteAudioAsync(step.url);
      if (!autoRef.current) break; // stoppé pendant la lecture du mot
    }
    // Fin naturelle (non interrompue) : on remet à zéro.
    if (autoRef.current) {
      autoRef.current = false;
      setAutoPlaying(false);
      setPlaying(null);
    }
  }, [data]);

  const toggleAuto = () => {
    if (autoPlaying) stopAuto();
    else startAuto();
  };

  if (error) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Feather name="wifi-off" size={32} color="#9AA0AA" />
        <Text style={styles.stateText}>{tr('sourateDetail.loadError')}</Text>
        <Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryLabel}>{tr('sourateDetail.retry')}</Text></Pressable>
        <Pressable style={styles.backLink} onPress={() => router.back()}><Text style={styles.backLinkText}>{tr('sourateDetail.back')}</Text></Pressable>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>{tr('sourateDetail.loading')}</Text>
      </View>
    );
  }

  const s = data.sourate;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerArabe}>{s.nomArabe}</Text>
        <Text style={styles.headerNom}>{s.numero}. {s.nom}</Text>
        <Text style={styles.headerSub}>{tr('sourateDetail.versetsCount', { n: s.nombreVersets })} · {s.revelation === 'makkah' ? tr('sourateDetail.meccan') : s.revelation === 'madinah' ? tr('sourateDetail.medinan') : ''}</Text>
      </LinearGradient>

      {/* Barre de lecture continue mot par mot */}
      <Pressable style={[styles.autoBar, autoPlaying && styles.autoBarActive]} onPress={toggleAuto}>
        <Feather name={autoPlaying ? 'pause' : 'play'} size={18} color="#fff" />
        <Text style={styles.autoLabel}>
          {autoPlaying ? tr('sourateDetail.playingStop') : tr('sourateDetail.autoPlayWord')}
        </Text>
      </Pressable>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>{tr('sourateDetail.hint')}</Text>
        {data.versets.map((v) => (
          <VerseCard
            key={v.id}
            verset={v}
            playing={playing}
            onWord={playWord}
            onVerse={playVerse}
            onLayoutY={(y) => { verseY.current[v.id] = y; }}
          />
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function VerseCard({
  verset, playing, onWord, onVerse, onLayoutY,
}: {
  verset: Verset;
  playing: string | null;
  onWord: (versetId: string, position: number, url: string | null) => void;
  onVerse: (url: string | null) => void;
  onLayoutY: (y: number) => void;
}) {
  return (
    <View style={styles.card} onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}>
      <View style={styles.cardTop}>
        <View style={styles.numBadge}>
          <Text style={styles.numText}>{verset.numero}</Text>
        </View>
        <Pressable style={styles.verseAudioBtn} onPress={() => onVerse(verset.audioUrl)} hitSlop={8}>
          <Feather name="volume-2" size={18} color="#6B4DFF" />
        </Pressable>
      </View>

      {/* Mots arabes tappables (droite → gauche) */}
      <View style={styles.wordsRow}>
        {verset.mots.length > 0
          ? verset.mots.map((m) => {
              const active = playing === `${verset.id}:${m.position}`;
              return (
                <Pressable
                  key={m.position}
                  onPress={() => onWord(verset.id, m.position, m.audioUrl)}
                  style={[styles.word, active && styles.wordActive]}
                >
                  <Text style={[styles.wordText, active && styles.wordTextActive]}>{m.texteArabe}</Text>
                </Pressable>
              );
            })
          : <Text style={styles.arabicFallback}>{verset.texteArabe}</Text>}
      </View>

      {/* Translittération + traduction */}
      {verset.translitteration?.texte ? (
        <Text style={styles.translit}>{verset.translitteration.texte}</Text>
      ) : null}
      {verset.traduction?.texte ? (
        <Text style={styles.traduction}>{verset.traduction.texte}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#7A828F', textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  backLink: { marginTop: 4 },
  backLinkText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#6B4DFF' },

  header: { paddingTop: 54, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 54, left: 16 },
  headerArabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 40, color: '#fff' },
  headerNom: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  autoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6B4DFF', marginHorizontal: 18, marginTop: 14, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 16,
  },
  autoBarActive: { backgroundColor: '#2A9E1C' },
  autoLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },

  content: { paddingHorizontal: 18, paddingTop: 16 },
  hint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginBottom: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  numBadge: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#EDE8FF', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  verseAudioBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDE8FF', alignItems: 'center', justifyContent: 'center' },

  // Mots en RTL : on aligne à droite et on inverse la direction d'écriture.
  wordsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
  word: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  wordActive: { backgroundColor: '#DCF5D6' },
  wordText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 32, color: '#1B2333', lineHeight: 56 },
  wordTextActive: { color: '#2A9E1C' },
  arabicFallback: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 32, color: '#1B2333', lineHeight: 56, textAlign: 'right', writingDirection: 'rtl', width: '100%' },

  translit: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#6B4DFF', marginTop: 12 },
  traduction: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#6B7280', marginTop: 6, lineHeight: 20 },
});
