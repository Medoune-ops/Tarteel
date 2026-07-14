import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { reviewRegainHeart } from '../../../lib/api/gems';
import { fetchVersets, reciteVerset, reviewSourate, type Verset as ApiVerset } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { useUserStore, MAX_HEARTS } from '../../../store/userStore';
import { t, useT } from '../../../lib/i18n';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useState, useCallback, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';
import { ensureMicPermission, enterRecordingMode, exitRecordingMode } from '../../../lib/audio/recorder';

type Reponse = 'facile' | 'difficile' | 'oublie';
type Phase = 'pret' | 'recitation' | 'fini';
/** Sous-état pendant la récitation d'un verset. */
type SubPhase = 'recording' | 'analyzing' | 'aide';

/** Options d'enregistrement avec le metering (niveau audio) activé pour la VAD. */
const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

// ── Détection d'activité vocale (VAD) par silence, basée sur le metering ────
/** En dessous de ce niveau (dB), on considère que l'utilisateur s'est tu. */
const SILENCE_DB = -35;
/** Silence court = fin naturelle d'un verset → on l'envoie au serveur. */
const SEGMENT_SILENCE_MS = 1400;
/** Silence long = l'utilisateur bloque → on affiche l'aide automatiquement. */
const BLOCK_SILENCE_MS = 3000;

function scoreMeta(rep: Reponse): { label: string; emoji: string; bg: string; pts: number } {
  if (rep === 'facile') return { label: t('flashcard.facile'), emoji: '😊', bg: '#34C724', pts: 10 };
  if (rep === 'difficile') return { label: t('flashcard.difficile'), emoji: '😅', bg: '#F6B100', pts: 5 };
  return { label: t('flashcard.oublie'), emoji: '😬', bg: '#FF6B6B', pts: 0 };
}

// ── Onde sonore animée (pendant l'enregistrement micro) ─────────────────────
function WaveBar({ delay }: { delay: number }) {
  const h = useSharedValue(0.3);
  useEffect(() => {
    h.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.sin) }),
      ), -1,
    ));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: h.value }] }));
  return <Animated.View style={[styles.waveBar, style]} />;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.progWrap}>
      <View style={[styles.progBar, { width: `${(current / total) * 100}%` }]} />
    </View>
  );
}

// ── Écran résultat ──────────────────────────────────────────────────────────
function ResultScreen({ aides, total, suggestion, choisi, onChoisir, onRestart, onQuitter, apprise }: {
  aides: number; total: number; suggestion: Reponse;
  choisi: Reponse | null; onChoisir: (r: Reponse) => void;
  onRestart: () => void; onQuitter: () => void;
  /** Sourate pas encore apprise dans le parcours : pas de suivi SRS (le
   *  backend refuse POST /me/revisions/:id/review pour une sourate non
   *  apprise) — entraînement libre, juste le score de fluidité Whisper. */
  apprise: boolean;
}) {
  const verdict = scoreMeta(suggestion);
  const fluidite = Math.max(0, Math.round(((total - aides) / total) * 100));
  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.resultGrad}>
        <Text style={styles.resultEmoji}>{verdict.emoji}</Text>
        <Text style={styles.resultMention}>
          {suggestion === 'facile' ? t('flashcard.masteredExcl') : suggestion === 'difficile' ? t('flashcard.almostExcl') : t('flashcard.toReview')}
        </Text>
        <View style={styles.resultCircle}>
          <Text style={styles.resultPct}>{fluidite}%</Text>
          <Text style={styles.resultSub}>{t('flashcard.fluidity')}</Text>
        </View>
        <View style={styles.resultStats}>
          <View style={styles.resultStat}>
            <Text style={styles.resultStatVal}>{total - aides}/{total}</Text>
            <Text style={styles.resultStatLbl}>{t('flashcard.fluentVersets')}</Text>
          </View>
          <View style={styles.resultDivider} />
          <View style={styles.resultStat}>
            <Text style={styles.resultStatVal}>{aides}</Text>
            <Text style={styles.resultStatLbl}>{t('flashcard.helpsUsed')}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.resultBottom}>
        {apprise ? (
          <>
            <Text style={styles.confirmTitle}>{t('flashcard.appThinksBefore')}<Text style={{ color: verdict.bg }}>{verdict.label}</Text></Text>
            <Text style={styles.confirmSub}>{t('flashcard.howDidYouFeel')}</Text>
            <View style={styles.btnsRow}>
              {(['oublie', 'difficile', 'facile'] as Reponse[]).map((rep) => {
                const s = scoreMeta(rep);
                const isSuggestion = rep === suggestion;
                return (
                  <Pressable
                    key={rep}
                    style={[
                      styles.repBtn, { backgroundColor: s.bg },
                      isSuggestion && styles.repBtnSuggested,
                      choisi === rep && styles.repBtnSelected,
                    ]}
                    onPress={() => onChoisir(rep)}
                  >
                    {isSuggestion && (
                      <View style={styles.suggestPip}>
                        <Feather name="star" size={9} color="#fff" />
                      </View>
                    )}
                    <Text style={styles.repBtnEmoji}>{s.emoji}</Text>
                    <Text style={styles.repBtnLabel}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.confirmSub}>
            {t('flashcard.freeTraining')}
          </Text>
        )}

        <Pressable style={styles.restartBtn} onPress={onRestart}>
          <Feather name="refresh-cw" size={16} color="#6B4DFF" />
          <Text style={styles.restartTxt}>{t('flashcard.reciteAgain')}</Text>
        </Pressable>
        <Pressable
          style={[styles.quitBtn, apprise && !choisi && styles.quitBtnDisabled]}
          onPress={onQuitter}
          disabled={apprise && !choisi}
        >
          <Text style={styles.quitTxt}>{t('flashcard.finish')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function FlashcardScreen() {
  const router = useRouter();
  const tr = useT();
  // `numero` = numéro de sourate (1–114) ; `apprise` ('1'/'0') vient de l'écran
  // Révisions — une sourate non apprise n'a pas de suivi SRS (voir ResultScreen).
  const { numero, apprise: appriseParam } = useLocalSearchParams<{ numero?: string; apprise?: string }>();
  const apprise = appriseParam !== '0';
  const language = useUserStore((s) => s.language);

  // ── Versets réels chargés depuis l'API (cachés en mémoire, cf. swr) ──
  const [versets, setVersets] = useState<ApiVerset[] | null>(null);
  const [meta, setMeta] = useState<{ nom: string; nomArabe: string } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!numero) { setLoadError(true); return; }
    setLoadError(false);
    try {
      const data = await swrFetch(`versets:${numero}:${language}`, () => fetchVersets(numero, language));
      setVersets(data.versets);
      setMeta({ nom: data.sourate.nom, nomArabe: data.sourate.nomArabe });
    } catch {
      setLoadError(true);
    }
  }, [numero, language]);

  useEffect(() => { load(); }, [load]);

  // ── Enregistrement micro (expo-audio) — écoute continue avec détection de silence (VAD) ──
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);

  const [phase, setPhase]       = useState<Phase>('pret');
  const [subPhase, setSubPhase] = useState<SubPhase>('recording');
  const [position, setPosition] = useState(0);      // verset courant
  const [nbAides, setNbAides]   = useState(0);
  const [choisi, setChoisi]     = useState<Reponse | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  // Empêche un double-appui sur « Terminer » d'envoyer deux fois la même
  // session (double POST /me/revisions/:numero/review).
  const quittingRef = useRef(false);

  // Refs pour la machine à états du silence — évite les closures obsolètes
  // dans les timers, et permet de les annuler dès que le son reprend.
  const segmentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const positionRef = useRef(0);
  const subPhaseRef = useRef<SubPhase>('recording');
  const versetsRef = useRef<ApiVerset[] | null>(null);
  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { subPhaseRef.current = subPhase; }, [subPhase]);
  useEffect(() => { versetsRef.current = versets; }, [versets]);

  const clearSilenceTimers = () => {
    if (segmentTimer.current) { clearTimeout(segmentTimer.current); segmentTimer.current = null; }
    if (blockTimer.current) { clearTimeout(blockTimer.current); blockTimer.current = null; }
  };

  // Sécurité : couper l'enregistrement + mode lecture en quittant l'écran.
  // L'objet natif du recorder peut déjà être détruit au démontage (expo-audio) :
  // toute lecture de ses propriétés doit donc être protégée par un try/catch.
  useEffect(() => () => {
    clearSilenceTimers();
    try {
      if (recorder.isRecording) recorder.stop().catch(() => {});
    } catch {}
    exitRecordingMode();
  }, []);

  /** Démarre l'enregistrement du verset courant. */
  const startRecording = useCallback(async () => {
    await enterRecordingMode();
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  const demarrer = async () => {
    const granted = await ensureMicPermission();
    if (!granted) { setMicDenied(true); return; }
    setMicDenied(false);
    setNbAides(0);
    setPosition(0);
    setSubPhase('recording');
    setPhase('recitation');
    await startRecording();
  };

  /** Passe au verset suivant (ou termine), en relançant l'enregistrement. */
  const avancer = useCallback(async (i: number) => {
    if (!versetsRef.current || i + 1 >= versetsRef.current.length) {
      await exitRecordingMode();
      setPhase('fini');
      return;
    }
    setPosition(i + 1);
    setSubPhase('recording');
    await startRecording();
  }, [startRecording]);

  /**
   * Fin de silence court détectée pendant l'écoute : on considère que le
   * verset courant est terminé. Coupe l'enregistrement, l'envoie au serveur
   * (best-effort), puis enchaîne sans attendre l'utilisateur :
   *   fluide          → verset suivant, ré-écoute immédiate ;
   *   hesitant/oublie → laisse tourner le silence long vers l'aide (on ne
   *                     coupe pas la parole si l'utilisateur reprend vite).
   * Hors-ligne / erreur → on avance sans pénalité (best-effort).
   */
  const analyserSegment = useCallback(async () => {
    const i = positionRef.current;
    const verset = versetsRef.current?.[i];
    if (!verset || !recorder.isRecording) return;
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch { /* recorder déjà arrêté/détruit */ }
    setSubPhase('analyzing');
    try {
      if (!uri) throw new Error('no-recording');
      const res = await reciteVerset(verset.id, uri);
      if (res.verdict === 'fluide') {
        await avancer(i);
      } else {
        setNbAides((n) => n + 1);
        setSubPhase('aide');
      }
    } catch {
      await avancer(i);
    }
  }, [recorder, avancer]);

  /** Silence long : l'utilisateur bloque → on révèle le verset automatiquement. */
  const declencherAide = useCallback(() => {
    if (subPhaseRef.current !== 'recording') return;
    setNbAides((n) => n + 1);
    setSubPhase('aide');
  }, []);

  // VAD : surveille le niveau audio (metering, en dB) pour détecter le silence.
  // Un silence COURT coupe et envoie le verset au serveur ; un silence LONG
  // (l'utilisateur ne reprend pas) déclenche l'aide automatiquement.
  useEffect(() => {
    if (phase !== 'recitation' || subPhase !== 'recording' || !recorderState.isRecording) {
      clearSilenceTimers();
      return;
    }
    const silencieux = (recorderState.metering ?? 0) < SILENCE_DB;
    if (silencieux) {
      if (!segmentTimer.current) {
        segmentTimer.current = setTimeout(() => { analyserSegment(); }, SEGMENT_SILENCE_MS);
      }
      if (!blockTimer.current) {
        blockTimer.current = setTimeout(() => { declencherAide(); }, BLOCK_SILENCE_MS);
      }
    } else {
      clearSilenceTimers();
    }
  }, [recorderState.metering, recorderState.isRecording, phase, subPhase, analyserSegment, declencherAide]);

  /**
   * Après l'aide (silence long ou verdict serveur négatif) : l'utilisateur a
   * relu le verset à voix haute. On réécoute le MÊME verset (pas le suivant),
   * pas la relecture silencieuse.
   */
  const reprendEnCours = useRef(false);
  const reprendreEcoute = useCallback(async () => {
    if (reprendEnCours.current) return;
    reprendEnCours.current = true;
    try {
      setSubPhase('recording');
      await startRecording();
    } finally {
      reprendEnCours.current = false;
    }
  }, [startRecording]);

  // Dès que l'aide est affichée, on relance immédiatement l'écoute du même
  // verset : dès que l'utilisateur recommence à parler, la VAD ci-dessus
  // détectera la fin de son silence et l'enverra au serveur normalement.
  useEffect(() => {
    if (phase === 'recitation' && subPhase === 'aide' && !recorderState.isRecording) {
      reprendreEcoute();
    }
  }, [phase, subPhase, recorderState.isRecording, reprendreEcoute]);

  const terminerTot = async () => {
    clearSilenceTimers();
    if (recorder.isRecording) await recorder.stop().catch(() => {});
    await exitRecordingMode();
    setPhase('fini');
  };

  const reset = () => {
    clearSilenceTimers();
    setPhase('pret'); setPosition(0); setNbAides(0); setChoisi(null); setSubPhase('recording');
  };

  // ── États de chargement / erreur ──
  if (loadError) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Feather name="wifi-off" size={34} color="#9AA0AA" />
        <Text style={styles.stateText}>{tr('flashcard.loadError')}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>{tr('common.retry')}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{tr('flashcard.back')}</Text>
        </Pressable>
      </View>
    );
  }
  if (!versets || !meta) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>{tr('flashcard.loading')}</Text>
      </View>
    );
  }

  // ── Écran résultat ──
  if (phase === 'fini') {
    const ratio = (versets.length - nbAides) / versets.length;
    const suggestion: Reponse = ratio >= 0.8 ? 'facile' : ratio >= 0.5 ? 'difficile' : 'oublie';
    return (
      <ResultScreen
        aides={nbAides}
        total={versets.length}
        suggestion={suggestion}
        choisi={choisi}
        onChoisir={setChoisi}
        onRestart={reset}
        apprise={apprise}
        onQuitter={async () => {
          if (quittingRef.current) return;
          quittingRef.current = true;
          // Enregistre l'auto-évaluation de l'utilisateur (SRS serveur : score,
          // état, prochaine révision recalculés). Best-effort : une panne
          // réseau ici ne doit pas bloquer la sortie de l'écran.
          if (choisi) {
            try {
              await reviewSourate(Number(numero), choisi);
            } catch {
              // hors-ligne / erreur serveur — pas bloquant, l'utilisateur sort quand même
            }
          }

          // « Réviser pour regagner » : une session terminée = +1 cœur (max
          // 2/jour, plafonné CÔTÉ SERVEUR, qui vérifie que la session
          // ci-dessus a bien été enregistrée). Best-effort : si la limite est
          // atteinte / cœurs pleins / premium, le serveur refuse et on ignore.
          const s = useUserStore.getState();
          if (!s.isPremium && s.hearts < MAX_HEARTS) {
            try {
              await reviewRegainHeart(Number(numero));
              Alert.alert(t('review.regainTitle'), t('review.regainMsg'));
            } catch {
              // limite quotidienne atteinte ou hors-ligne — pas bloquant
            }
          }
          router.back();
        }}
      />
    );
  }

  const versetCourant = versets[position];

  return (
    <View style={styles.screen}>
      {/* Header */}
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={styles.headerNom} numberOfLines={1}>{meta.nom} · {meta.nomArabe}</Text>
          </View>
          <View style={{ width: 30 }} />
        </View>
        {phase === 'recitation' && (
          <>
            <ProgressBar current={position + 1} total={versets.length} />
            <Text style={styles.headerCount}>{tr('flashcard.verseCount', { n: position + 1, total: versets.length })}</Text>
          </>
        )}
      </LinearGradient>

      {/* Zone centrale */}
      <View style={styles.cardZone}>
        {phase === 'pret' ? (
          // ── Écran prêt ──
          <View style={styles.pretCard}>
            <Text style={styles.pretEmoji}>🎙️</Text>
            <Text style={styles.pretTitle}>{tr('flashcard.reciteFromMemory')}</Text>
            <Text style={styles.pretDesc}>
              {tr('flashcard.reciteDesc')}
            </Text>
            {micDenied && (
              <Text style={styles.micDenied}>
                {tr('flashcard.micDenied')}
              </Text>
            )}
          </View>
        ) : subPhase === 'aide' ? (
          // ── Carte d'aide (verdict serveur : hésitant / oublié) ──
          <View style={styles.cardWrap}>
            <Animated.View
              key={versetCourant.id}
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(300)}
              style={styles.aideCard}
            >
              <View style={styles.aideBadge}>
                <Feather name="help-circle" size={13} color="#F0820C" />
                <Text style={styles.aideBadgeText}>{tr('flashcard.helpBadge')}</Text>
              </View>
              <Text style={styles.aideArabe}>{versetCourant.texteArabe}</Text>
              {!!versetCourant.translitteration && (
                <Text style={styles.aideTranslit}>{versetCourant.translitteration.texte}</Text>
              )}
              <Text style={styles.aideHint}>{tr('flashcard.helpHint')}</Text>
            </Animated.View>
          </View>
        ) : subPhase === 'analyzing' ? (
          // ── Analyse serveur en cours ──
          <View style={styles.cardWrap}>
            <Animated.View key="analyzing" entering={FadeIn.duration(200)} style={styles.fluideCard}>
              <ActivityIndicator size="large" color="#6B4DFF" />
              <Text style={styles.fluideText}>{tr('flashcard.analyzing')}</Text>
              <Text style={styles.fluideSub}>{tr('flashcard.oneMoment')}</Text>
            </Animated.View>
          </View>
        ) : (
          // ── Enregistrement en cours → carte encourageante ──
          <View style={styles.cardWrap}>
            <Animated.View key="fluide" entering={FadeIn.duration(300)} style={styles.fluideCard}>
              <View style={styles.wave}>
                {[0, 80, 160, 240, 320, 240, 160, 80, 0].map((d, i) => <WaveBar key={i} delay={d} />)}
              </View>
              <Text style={styles.fluideText}>{tr('flashcard.reciteVerse', { n: position + 1 })}</Text>
              <Text style={styles.fluideSub}>{tr('flashcard.appListening')}</Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Bas */}
      <View style={styles.bottom}>
        {phase === 'pret' ? (
          <Pressable style={styles.micBtn} onPress={demarrer}>
            <Feather name="mic" size={22} color="#fff" />
            <Text style={styles.micBtnText}>{tr('flashcard.startRecitation')}</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.finBtn} onPress={terminerTot}>
            <Feather name="check-circle" size={20} color="#6B4DFF" />
            <Text style={styles.finBtnText}>{tr('flashcard.finished')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F5F9' },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#7A828F', textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  backLink: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#8A8F99', marginTop: 8 },

  // Header
  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { padding: 4, width: 30 },
  headerNom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  progWrap: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progBar: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  headerCount: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8 },

  // Zone centrale
  cardZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },

  // Écran prêt
  pretCard: { alignItems: 'center', paddingHorizontal: 10 },
  pretEmoji: { fontSize: 64, marginBottom: 20 },
  pretTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333', marginBottom: 14 },
  pretDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#7A828F', textAlign: 'center', lineHeight: 24 },
  micDenied: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#E03434', textAlign: 'center', marginTop: 16 },

  // Carte
  cardWrap: { width: '100%', minHeight: 280, alignItems: 'center', justifyContent: 'center' },

  // Carte d'aide
  aideCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 28, padding: 28, paddingTop: 50,
    alignItems: 'center',
    borderWidth: 2, borderColor: '#FFE0B8',
    shadowColor: '#F0820C', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  aideBadge: {
    position: 'absolute', top: 16, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF0E0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  aideBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#F0820C' },
  aideArabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, color: '#1B2333',
    textAlign: 'center', lineHeight: 52, writingDirection: 'rtl', marginBottom: 14,
  },
  aideTranslit: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center', lineHeight: 22 },
  aideHint: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#F0820C', textAlign: 'center', marginTop: 14 },

  // Carte fluide / analyse
  fluideCard: { alignItems: 'center', gap: 14 },
  wave: { flexDirection: 'row', alignItems: 'center', height: 60, gap: 6 },
  waveBar: { width: 6, height: 50, borderRadius: 3, backgroundColor: '#6B4DFF' },
  fluideText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  fluideSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#B0B5BE' },

  // Bas
  bottom: { paddingHorizontal: 22, paddingBottom: 38, paddingTop: 12, gap: 10 },
  micBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6B4DFF', borderRadius: 18, paddingVertical: 18,
    borderBottomWidth: 4, borderBottomColor: '#4A30CC',
  },
  micBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  btnDisabled: { opacity: 0.55 },
  finBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 18, paddingVertical: 16,
    borderWidth: 2, borderColor: '#6B4DFF', borderBottomWidth: 4,
  },
  finBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#6B4DFF' },

  // Résultat
  resultGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 28 },
  resultEmoji: { fontSize: 56 },
  resultMention: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  resultCircle: {
    width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  resultPct: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 46, color: '#fff' },
  resultSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  resultStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 18 },
  resultStat: { flex: 1, alignItems: 'center', gap: 4 },
  resultStatVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff' },
  resultStatLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  resultDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.25)' },

  resultBottom: { padding: 22, paddingBottom: 36, backgroundColor: '#F4F5F9' },
  confirmTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, color: '#1B2333', textAlign: 'center' },
  confirmSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  btnsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  repBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 2,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  repBtnSuggested: { borderWidth: 3, borderColor: '#fff', borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.15)' },
  repBtnSelected: { transform: [{ scale: 0.96 }], opacity: 0.85 },
  suggestPip: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFB800',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  repBtnEmoji: { fontSize: 22 },
  repBtnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff' },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, marginBottom: 10,
    borderWidth: 2, borderColor: '#DDD8FF',
  },
  restartTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  quitBtn: {
    backgroundColor: '#6B4DFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    borderBottomWidth: 4, borderBottomColor: '#4A30CC',
  },
  quitBtnDisabled: { opacity: 0.4 },
  quitTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
});
