import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { fetchVersets, type SourateVersets } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { playRemoteAudioAsync, stopRemoteAudio } from '../../../constants/sounds';
import { useTheme } from '../../../utils/useTheme';
import { useT } from '../../../lib/i18n';
import OfflineState from '../../../components/OfflineState';

// Tag de verrouillage d'écran (empêche la mise en veille pendant la récitation).
const KEEP_AWAKE_TAG = 'lecture-libre';

// Lecteur « Lecture libre » — récite la sourate EN ENTIER, verset après verset,
// sans arrêt jusqu'à la fin. Affichage en ARABE UNIQUEMENT (pas de traduction ni
// de translittération). L'écran reste allumé tant que la lecture est en cours.
export default function LectureSourateScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const { numero } = useLocalSearchParams<{ numero?: string }>();

  const [data, setData] = useState<SourateVersets | null>(null);
  const [error, setError] = useState<unknown>(null);
  // Verset en cours de récitation (id) — surlignage + défilement.
  const [playing, setPlaying] = useState<string | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);

  // Drapeau synchrone de la boucle de lecture (source de vérité).
  const autoRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const verseY = useRef<Record<string, number>>({});

  const load = useCallback(async () => {
    if (!numero) { setError(true); return; }
    setError(false);
    try {
      // Le texte coranique ne change jamais → cache mémoire (affichage instantané).
      setData(await swrFetch(`versets:${numero}:ar`, () => fetchVersets(numero)));
    } catch (e) {
      setError(e);
    }
  }, [numero]);

  // Stoppe la lecture, coupe l'audio et réautorise la mise en veille.
  const stopAuto = useCallback(() => {
    autoRef.current = false;
    setAutoPlaying(false);
    setPlaying(null);
    stopRemoteAudio();
    try { deactivateKeepAwake(KEEP_AWAKE_TAG); } catch { /* no-op */ }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Quitter l'écran coupe la lecture et libère le verrou d'écran.
    return () => stopAuto();
  }, [load, stopAuto]));

  // Fait défiler la vue vers le verset en cours de récitation.
  useEffect(() => {
    if (!playing) return;
    const y = verseY.current[playing];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 90), animated: true });
  }, [playing]);

  // Lance la récitation continue : enchaîne l'audio de chaque verset, dans
  // l'ordre, sans arrêt, jusqu'au dernier — en gardant l'écran allumé.
  const startAuto = useCallback(async () => {
    if (!data) return;
    const steps = data.versets
      .filter((v) => v.audioUrl)
      .map((v) => ({ id: v.id, url: v.audioUrl as string }));
    if (steps.length === 0) return;

    try { await activateKeepAwakeAsync(KEEP_AWAKE_TAG); } catch { /* no-op */ }
    autoRef.current = true;
    setAutoPlaying(true);
    for (const step of steps) {
      if (!autoRef.current) break;
      setPlaying(step.id);
      await playRemoteAudioAsync(step.url);
      if (!autoRef.current) break; // stoppé pendant la lecture du verset
    }
    // Fin naturelle (non interrompue) : on réinitialise proprement.
    if (autoRef.current) {
      autoRef.current = false;
      setAutoPlaying(false);
      setPlaying(null);
      try { deactivateKeepAwake(KEEP_AWAKE_TAG); } catch { /* no-op */ }
    }
  }, [data]);

  const toggleAuto = () => {
    if (autoPlaying) stopAuto();
    else startAuto();
  };

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
        <OfflineState error={error} onRetry={load} showOfflineExits />
        <Pressable style={styles.backLink} onPress={() => router.back()}><Text style={styles.backLinkText}>{tr('lectureNumero.back')}</Text></Pressable>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('lectureNumero.loading')}</Text>
      </View>
    );
  }

  const s = data.sourate;
  const hasAudio = data.versets.some((v) => v.audioUrl);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/* Header */}
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerArabe}>{s.nomArabe}</Text>
        <Text style={styles.headerNom}>{s.numero}. {s.nom}</Text>
        <Text style={styles.headerSub}>{tr('lectureNumero.versetsCount', { n: s.nombreVersets })}</Text>
      </LinearGradient>

      {/* Barre de lecture continue (sourate entière) */}
      {hasAudio && (
        <Pressable style={[styles.autoBar, autoPlaying && styles.autoBarActive]} onPress={toggleAuto}>
          <Feather name={autoPlaying ? 'pause' : 'play'} size={18} color="#fff" />
          <Text style={styles.autoLabel}>
            {autoPlaying ? tr('lectureNumero.playingStop') : tr('lectureNumero.playFull')}
          </Text>
        </Pressable>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasAudio && (
          <Text style={[styles.hint, { color: T.textSecondary }]}>{tr('lectureNumero.audioSoon')}</Text>
        )}
        {data.versets.map((v) => {
          const active = playing === v.id;
          return (
            <View
              key={v.id}
              onLayout={(e) => { verseY.current[v.id] = e.nativeEvent.layout.y; }}
              style={[
                styles.card,
                { backgroundColor: T.cardBg },
                active && styles.cardActive,
              ]}
            >
              <View style={styles.numBadge}>
                <Text style={styles.numText}>{v.numero}</Text>
              </View>
              <Text style={[styles.arabe, { color: T.text }, active && styles.arabeActive]}>
                {v.texteArabe}
              </Text>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  backLink: { alignSelf: 'center', paddingBottom: 32 },
  backLinkText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#6B4DFF' },

  header: { paddingTop: 54, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: { position: 'absolute', top: 54, left: 16 },
  headerArabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 40, color: '#fff' },
  headerNom: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff', marginTop: 4 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  autoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6B4DFF', marginHorizontal: 18, marginTop: 14, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  autoBarActive: { backgroundColor: '#2A9E1C' },
  autoLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },

  content: { paddingHorizontal: 18, paddingTop: 16 },
  hint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center', marginBottom: 14 },

  card: {
    borderRadius: 18, padding: 18, marginBottom: 14, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardActive: { borderWidth: 2, borderColor: '#34C724' },
  numBadge: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#EDE8FF', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 32, lineHeight: 60, textAlign: 'right', writingDirection: 'rtl' },
  arabeActive: { color: '#2A9E1C' },
});
