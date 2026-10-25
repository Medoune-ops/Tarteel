import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import DeviceStatusBar from '../../../components/StatusBar';
import { fetchVersets, type SourateVersets } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { playRemoteAudioAsync, stopRemoteAudio } from '../../../constants/sounds';
import { useTheme } from '../../../utils/useTheme';
import { useT } from '../../../lib/i18n';
import { sourateMeaningLine } from '../../../constants/sourateMeaning';
import { useUserStore } from '../../../store/userStore';
import { useLectureProgressStore } from '../../../store/lectureProgressStore';
import OfflineState from '../../../components/OfflineState';

// Tag de verrouillage d'écran (empêche la mise en veille pendant la récitation).
const KEEP_AWAKE_TAG = 'lecture-libre';
// Récitateur affiché dans le mini-lecteur. TODO backend : l'API des versets ne
// renvoie pas encore le récitateur de `audioUrl` — à remplacer par la valeur
// serveur dès qu'elle existe.
const RECITER_LABEL = 'Abdul Basit';
const ARABIC_SIZES = [26, 32, 38] as const;

/** Chiffres indo-arabes pour l'ornement de fin de verset ﴿٣﴾. */
function arabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

// ─── Palette de la maquette (Tarteel Lecture Libre) ────────────────────────
type Palette = {
  bg: string; card: string; mini: string; ink: string; muted: string; line: string;
  accent: string; accentSoft: string; curBg: string;
  hero: readonly [string, string, string];
};
const LIGHT: Palette = {
  bg: '#F4F3F8', card: '#FFFFFF', mini: 'rgba(255,255,255,0.97)', ink: '#1A1730', muted: '#6F6B84', line: '#ECEAF3',
  accent: '#6B4DFF', accentSoft: '#EEEAFF', curBg: '#F7F5FF',
  hero: ['#4A31C2', '#6B4DFF', '#8A6CFF'],
};
const DARK: Palette = {
  bg: '#0C0B12', card: '#17151F', mini: 'rgba(30,27,42,0.97)', ink: '#EEEDF5', muted: '#918DA6', line: '#25222F',
  accent: '#9A82FF', accentSoft: 'rgba(139,112,255,0.16)', curBg: '#1D1830',
  hero: ['#130D2C', '#22165A', '#33227E'],
};
const G160 = { start: { x: 0.33, y: 0 }, end: { x: 0.67, y: 1 } };

// Lecteur « Lecture libre » — récite la sourate verset après verset jusqu'à la
// fin (ou en boucle sur un verset). Chaque verset en arabe, avec son sens dans
// la langue de l'utilisateur (masquable). Mini-lecteur fixe en bas : lecture /
// pause, verset précédent / suivant, répétition. L'écran reste allumé tant que
// la récitation est en cours.
export default function LectureSourateScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const P = T.isDark ? DARK : LIGHT;
  const insets = useSafeAreaInsets();
  const language = useUserStore((st) => st.language);
  const { numero, verset } = useLocalSearchParams<{ numero?: string; verset?: string }>();

  const showTranslation = useLectureProgressStore((s) => s.showTranslation);
  const arabicSize = useLectureProgressStore((s) => s.arabicSize);
  const toggleTranslation = useLectureProgressStore((s) => s.toggleTranslation);
  const cycleArabicSize = useLectureProgressStore((s) => s.cycleArabicSize);
  const setLast = useLectureProgressStore((s) => s.setLast);

  const [data, setData] = useState<SourateVersets | null>(null);
  const [error, setError] = useState<unknown>(null);
  // Index (0-based) du verset courant — surlignage, défilement, mini-lecteur.
  const [current, setCurrent] = useState(() => Math.max(0, (Number(verset) || 1) - 1));
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(false);

  // Jeton de la boucle de lecture en cours : l'incrémenter l'interrompt.
  const runRef = useRef(0);
  const loopRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const verseY = useRef<Record<number, number>>({});
  const versesTop = useRef(0);
  // Vrai quand la sourate a été écoutée jusqu'au bout (play relance au début).
  const finishedRef = useRef(false);

  const load = useCallback(async () => {
    if (!numero) { setError(true); return; }
    setError(false);
    try {
      // Le texte coranique ne change jamais → cache mémoire (affichage instantané).
      // La traduction dépend de la langue → une entrée de cache par langue.
      setData(await swrFetch(`versets:${numero}:${language}`, () => fetchVersets(numero, language)));
    } catch (e) {
      setError(e);
    }
  }, [numero, language]);

  // Coupe la lecture, l'audio, et réautorise la mise en veille.
  const stop = useCallback(() => {
    runRef.current += 1;
    setPlaying(false);
    stopRemoteAudio();
    try { deactivateKeepAwake(KEEP_AWAKE_TAG); } catch { /* no-op */ }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    // Quitter l'écran coupe la lecture et libère le verrou d'écran.
    return () => stop();
  }, [load, stop]));

  // Mémorise la position pour la carte « Reprendre la lecture ».
  useEffect(() => {
    if (!data) return;
    const s = data.sourate;
    const total = data.versets.length || s.nombreVersets;
    setLast({
      numero: s.numero, nom: s.nom, nomArabe: s.nomArabe,
      verset: Math.min(current + 1, total), total,
    });
  }, [data, current, setLast]);

  // Fait défiler la vue vers le verset courant.
  useEffect(() => {
    const y = verseY.current[current];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, versesTop.current + y - 90), animated: true });
  }, [current]);

  // Récite à partir de `start` jusqu'à la fin (ou répète le verset en mode boucle).
  const playFrom = useCallback(async (start: number) => {
    if (!data || data.versets.length === 0) return;
    const token = ++runRef.current;
    finishedRef.current = false;
    try { await activateKeepAwakeAsync(KEEP_AWAKE_TAG); } catch { /* no-op */ }
    if (runRef.current !== token) return;
    setPlaying(true);
    let i = start;
    while (runRef.current === token && i < data.versets.length) {
      setCurrent(i);
      await playRemoteAudioAsync(data.versets[i].audioUrl);
      if (runRef.current !== token) return; // interrompu pendant le verset
      if (!loopRef.current) i += 1;
    }
    // Fin naturelle : on s'arrête sur le dernier verset.
    if (runRef.current === token) {
      finishedRef.current = true;
      setPlaying(false);
      try { deactivateKeepAwake(KEEP_AWAKE_TAG); } catch { /* no-op */ }
    }
  }, [data]);

  const total = data?.versets.length ?? 0;

  const togglePlay = () => {
    if (playing) { stop(); return; }
    // Relance depuis le début si la sourate a été écoutée jusqu'au bout.
    playFrom(finishedRef.current ? 0 : current);
  };
  const jumpTo = (i: number) => {
    const target = Math.max(0, Math.min(total - 1, i));
    finishedRef.current = false;
    if (playing) playFrom(target);
    else setCurrent(target);
  };
  const toggleLoop = () => {
    loopRef.current = !loopRef.current;
    setLoop(loopRef.current);
  };

  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: P.bg }]}>
        <OfflineState error={error} onRetry={load} showOfflineExits />
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={[styles.backLinkText, { color: P.accent }]}>{tr('lectureNumero.back')}</Text>
        </Pressable>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: P.bg }]}>
        <ActivityIndicator size="large" color={P.accent} />
        <Text style={[styles.stateText, { color: P.muted }]}>{tr('lectureNumero.loading')}</Text>
      </View>
    );
  }

  const s = data.sourate;
  const sens = sourateMeaningLine(s.numero, language);
  const place =
    s.revelation === 'madinah' ? tr('lectureLibre.medinan')
      : s.revelation === 'makkah' ? tr('lectureLibre.meccan') : null;
  const hasAudio = data.versets.some((v) => v.audioUrl);
  const canTranslate = language !== 'ar';
  const arSize = ARABIC_SIZES[arabicSize] ?? 32;
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0;
  const progressLabel = tr('lectureLibre.verseOf', { v: Math.min(current + 1, total), n: total });

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 + insets.bottom }}
      >
        <LinearGradient colors={P.hero} locations={[0, 0.6, 1]} {...G160} style={styles.hero}>
          <View style={styles.circle} />
          <DeviceStatusBar />
          <View style={styles.heroBar}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Feather name="chevron-left" size={24} color="#3B2A99" />
            </Pressable>
            <View style={styles.heroTools}>
              {canTranslate ? (
                <Pressable
                  onPress={toggleTranslation}
                  accessibilityLabel={tr('lectureNumero.toggleTranslation')}
                  style={[styles.tool, { backgroundColor: showTranslation ? '#fff' : 'rgba(255,255,255,0.16)' }]}
                >
                  <Text style={[styles.toolText, { color: showTranslation ? '#3B2A99' : '#fff' }]}>
                    {language.toUpperCase()}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={cycleArabicSize}
                accessibilityLabel={tr('lectureNumero.textSize')}
                style={[styles.tool, styles.toolSquare]}
              >
                <Text style={styles.toolAa}>Aa</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.heroArabe}>{s.nomArabe}</Text>
          <Text style={styles.heroNom}>{s.numero}. {s.nom}</Text>
          {sens ? <Text style={styles.heroSens}>{sens}</Text> : null}
          <View style={styles.heroChips}>
            <Text style={styles.heroChip}>{tr('lectureNumero.versetsCount', { n: s.nombreVersets })}</Text>
            {place ? <Text style={styles.heroChip}>{place}</Text> : null}
          </View>
        </LinearGradient>

        <View style={styles.verses} onLayout={(e) => { versesTop.current = e.nativeEvent.layout.y; }}>
          {!hasAudio && (
            <Text style={[styles.hint, { color: P.muted }]}>{tr('lectureNumero.audioSoon')}</Text>
          )}
          {data.versets.map((v, i) => {
            const cur = i === current;
            return (
              <Pressable
                key={v.id}
                onLayout={(e) => { verseY.current[i] = e.nativeEvent.layout.y; }}
                onPress={() => (hasAudio ? playFrom(i) : jumpTo(i))}
                style={[
                  styles.verse,
                  { backgroundColor: cur ? P.curBg : P.card },
                  cur ? [styles.verseCur, { borderColor: P.accent, shadowColor: P.accent }]
                    : T.isDark ? styles.borderDark : styles.shadow,
                ]}
              >
                <View style={styles.verseTop}>
                  <Text
                    style={[
                      styles.versePill,
                      { backgroundColor: cur ? P.accent : P.accentSoft, color: cur ? '#fff' : P.accent },
                    ]}
                  >
                    {tr('lectureNumero.verseLabel', { n: v.numero })}
                  </Text>
                  {cur && playing ? (
                    <View style={styles.eq}>
                      <View style={[styles.eqBar, { height: 7, backgroundColor: P.accent }]} />
                      <View style={[styles.eqBar, { height: 14, backgroundColor: P.accent }]} />
                      <View style={[styles.eqBar, { height: 10, backgroundColor: P.accent }]} />
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.arabe,
                    { fontSize: arSize, lineHeight: Math.round(arSize * 1.9), color: cur ? P.accent : P.ink },
                  ]}
                >
                  {v.texteArabe}{' '}
                  <Text style={{ fontSize: arSize * 0.8, color: P.accent }}>﴿{arabicDigits(v.numero)}﴾</Text>
                </Text>
                {canTranslate && showTranslation && v.traduction?.texte ? (
                  <Text style={[styles.traduction, { color: P.muted }]}>{v.traduction.texte}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Mini-lecteur fixe */}
      {hasAudio ? (
        <View style={[styles.mini, { backgroundColor: P.mini, bottom: 14 + insets.bottom }]}>
          <View style={[styles.miniTrack, { backgroundColor: P.line }]}>
            <View style={[styles.miniFill, { width: `${pct}%`, backgroundColor: P.accent }]} />
          </View>
          <View style={styles.miniRow}>
            <Pressable
              onPress={togglePlay}
              accessibilityLabel={playing ? tr('lectureNumero.pause') : tr('lectureNumero.play')}
              style={[styles.miniPlay, { backgroundColor: P.accent }]}
            >
              {playing ? (
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Rect x={5} y={4} width={5} height={16} rx={1.5} fill="#fff" />
                  <Rect x={14} y={4} width={5} height={16} rx={1.5} fill="#fff" />
                </Svg>
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" style={{ marginLeft: 2 }}>
                  <Path d="M6 3.5 20 12 6 20.5z" fill="#fff" />
                </Svg>
              )}
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.miniTitle, { color: P.ink }]} numberOfLines={1}>
                {playing ? tr('lectureNumero.statusPlaying') : tr('lectureNumero.statusPaused')}
              </Text>
              <Text style={[styles.miniSub, { color: P.muted }]} numberOfLines={1}>
                {RECITER_LABEL} · {progressLabel}
              </Text>
            </View>
            <Pressable onPress={() => jumpTo(current - 1)} accessibilityLabel={tr('lectureNumero.prev')} style={styles.miniBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M19 4.5 9 12l10 7.5z" fill={P.ink} />
                <Rect x={4.7} y={4.5} width={2.8} height={15} rx={1.2} fill={P.ink} />
              </Svg>
            </Pressable>
            <Pressable onPress={() => jumpTo(current + 1)} accessibilityLabel={tr('lectureNumero.next')} style={styles.miniBtn}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M5 4.5 15 12 5 19.5z" fill={P.ink} />
                <Rect x={16.5} y={4.5} width={2.8} height={15} rx={1.2} fill={P.ink} />
              </Svg>
            </Pressable>
            <Pressable
              onPress={toggleLoop}
              accessibilityLabel={tr('lectureNumero.repeat')}
              style={[styles.miniLoop, { backgroundColor: loop ? P.accent : 'transparent' }]}
            >
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"
                  stroke={loop ? '#fff' : '#8E8AA3'} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"
                />
              </Svg>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  backLink: { alignSelf: 'center', paddingBottom: 32 },
  backLinkText: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  shadow: {
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  borderDark: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },

  hero: {
    paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  circle: {
    position: 'absolute', alignSelf: 'center', top: 40, width: 300, height: 300, borderRadius: 150,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  heroTools: { flexDirection: 'row', gap: 8 },
  tool: { height: 42, paddingHorizontal: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolSquare: { width: 42, paddingHorizontal: 0, backgroundColor: 'rgba(255,255,255,0.16)' },
  toolText: { fontFamily: 'Nunito_900Black', fontSize: 13 },
  toolAa: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#fff' },
  heroArabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 54, lineHeight: 80, color: '#fff',
    textAlign: 'center', marginTop: 6,
  },
  heroNom: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 30, color: '#fff', textAlign: 'center' },
  heroSens: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', marginTop: 6, alignSelf: 'center', maxWidth: 300,
  },
  heroChips: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  heroChip: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },

  verses: { paddingHorizontal: 18, paddingTop: 16, gap: 10 },
  hint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center', marginBottom: 4 },
  verse: { borderRadius: 22, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 },
  verseCur: {
    borderWidth: 2, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 4,
  },
  verseTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  versePill: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, lineHeight: 18,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9, overflow: 'hidden',
  },
  eq: { flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: 14 },
  eqBar: { width: 3, borderRadius: 2 },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', textAlign: 'right', writingDirection: 'rtl', marginTop: 6 },
  traduction: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 21, marginTop: 6 },

  mini: {
    position: 'absolute', left: 10, right: 10, borderRadius: 22, overflow: 'hidden',
    shadowColor: '#140A32', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 30, elevation: 10,
  },
  miniTrack: { height: 3 },
  miniFill: { height: '100%' },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 12 },
  miniPlay: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  miniTitle: { fontFamily: 'Nunito_900Black', fontSize: 14 },
  miniSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  miniBtn: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
  miniLoop: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
