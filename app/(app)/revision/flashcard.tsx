import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import ArabicText from '../../../components/ArabicText';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { reviewRegainHeart } from '../../../lib/api/gems';
import {
  fetchVersets, reciteVerset, reciteVersetRange, fetchSourateSegments, reviewSegment,
  type Verset as ApiVerset, type SegmentRevisionView,
} from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { useUserStore, MAX_HEARTS } from '../../../store/userStore';
import { t, useT } from '../../../lib/i18n';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat,
  withSequence, withDelay, Easing, FadeIn, FadeOut,
} from 'react-native-reanimated';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { ensureMicPermission, enterRecordingMode, exitRecordingMode } from '../../../lib/audio/recorder';
import { playRemoteAudioAsync, stopRemoteAudio } from '../../../constants/sounds';

type Reponse = 'facile' | 'difficile' | 'oublie';
type Phase = 'pret' | 'recitation' | 'fini';
/** Sous-état pendant l'exercice sur l'étape courante. */
type SubPhase = 'listening' | 'recording' | 'analyzing' | 'aide';
/** Les 4 exercices de mémorisation proposés pour un segment appris. */
type ExerciceMode = 'recitation' | 'chainage' | 'cloze' | 'ecoute';

/**
 * Une "étape" de la session = soit un verset seul, soit (chaînage uniquement)
 * un point d'ASSEMBLAGE où l'utilisateur récite d'un bloc tous les versets
 * depuis le début du segment jusqu'à `fin`.
 */
type Etape =
  | { type: 'verset'; verset: ApiVerset; indexInSeg: number }
  | { type: 'assemble'; debut: number; fin: number; texte: string };

const RECORDING_OPTIONS = RecordingPresets.HIGH_QUALITY;

function scoreMeta(rep: Reponse): { label: string; emoji: string; bg: string; pts: number } {
  if (rep === 'facile') return { label: t('flashcard.facile'), emoji: '😊', bg: '#34C724', pts: 10 };
  if (rep === 'difficile') return { label: t('flashcard.difficile'), emoji: '😅', bg: '#F6B100', pts: 5 };
  return { label: t('flashcard.oublie'), emoji: '😬', bg: '#FF6B6B', pts: 0 };
}

/**
 * Découpe les versets d'un segment en étapes de session. Pour le chaînage :
 * après chaque paire de versets (et systématiquement à la fin), insère un
 * point d'assemblage qui fait réciter d'un bloc tout ce qui a été vu jusque-là
 * — mémorisation par chaînage progressif (2 versets, puis 2 de plus, puis on
 * assemble les 4, etc.).
 */
function buildEtapes(mode: ExerciceMode, segVersets: ApiVerset[]): Etape[] {
  if (mode !== 'chainage') {
    return segVersets.map((verset, indexInSeg) => ({ type: 'verset', verset, indexInSeg }));
  }
  const etapes: Etape[] = [];
  segVersets.forEach((verset, i) => {
    etapes.push({ type: 'verset', verset, indexInSeg: i });
    const isPairEnd = (i + 1) % 2 === 0;
    const isLast = i === segVersets.length - 1;
    if (isPairEnd || isLast) {
      const bloc = segVersets.slice(0, i + 1);
      etapes.push({
        type: 'assemble',
        debut: bloc[0].numero,
        fin: verset.numero,
        texte: bloc.map((v) => v.texteArabe).join(' '),
      });
    }
  });
  return etapes;
}

/** Fraction de mots à masquer pour l'exercice cloze : progressive sur la session (20 % → 90 %). */
function clozeRatio(indexInSeg: number, total: number): number {
  if (total <= 1) return 0.6;
  return 0.2 + 0.7 * (indexInSeg / (total - 1));
}

/** Masque les derniers mots d'un verset (l'utilisateur doit compléter de mémoire). */
function clozeText(texte: string, ratio: number): string {
  const mots = texte.split(' ');
  const toBlank = Math.max(0, Math.min(mots.length, Math.round(mots.length * ratio)));
  if (toBlank === 0) return texte;
  return mots.map((m, i) => (i >= mots.length - toBlank ? '▁▁▁▁' : m)).join(' ');
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

function Wave() {
  return (
    <View style={styles.wave}>
      {[0, 80, 160, 240, 320, 240, 160, 80, 0].map((d, i) => <WaveBar key={i} delay={d} />)}
    </View>
  );
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
   *  backend refuse POST .../segments/:i/review pour une sourate non
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
  // Révisions — une sourate non apprise n'a pas de suivi SRS (voir ResultScreen)
  // ni de découpage en segments (entraînement libre sur la sourate entière).
  const { numero, apprise: appriseParam } = useLocalSearchParams<{ numero?: string; apprise?: string }>();
  const apprise = appriseParam !== '0';
  const language = useUserStore((s) => s.language);

  // ── Versets réels chargés depuis l'API (cachés en mémoire, cf. swr) ──
  const [versets, setVersets] = useState<ApiVerset[] | null>(null);
  const [meta, setMeta] = useState<{ nom: string; nomArabe: string } | null>(null);
  // Segment SRS ciblé (le plus urgent) — uniquement pour une sourate apprise.
  const [segment, setSegment] = useState<SegmentRevisionView | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    if (!numero) { setLoadError(true); return; }
    setLoadError(false);
    try {
      const [data, segData] = await Promise.all([
        swrFetch(`versets:${numero}:${language}`, () => fetchVersets(numero, language)),
        apprise ? fetchSourateSegments(Number(numero)) : Promise.resolve(null),
      ]);
      setVersets(data.versets);
      setMeta({ nom: data.sourate.nom, nomArabe: data.sourate.nomArabe });
      if (segData) {
        // Segment ciblé = échéance la plus proche (jamais révisé = null = le
        // plus urgent) — on ne laisse jamais un segment fragile caché derrière
        // la moyenne affichée dans la liste des révisions.
        const cible = [...segData.segments].sort((a, b) => {
          const da = a.prochaineRevision ? new Date(a.prochaineRevision).getTime() : -Infinity;
          const db = b.prochaineRevision ? new Date(b.prochaineRevision).getTime() : -Infinity;
          return da - db;
        })[0];
        setSegment(cible ?? null);
      } else {
        setSegment(null);
      }
    } catch {
      setLoadError(true);
    }
  }, [numero, language, apprise]);

  useEffect(() => { load(); }, [load]);

  // Versets du segment ciblé (ou toute la sourate en entraînement libre).
  const segVersets = useMemo(() => {
    if (!versets) return null;
    if (!apprise || !segment) return versets;
    return versets.filter((v) => v.numero >= segment.debut && v.numero <= segment.fin);
  }, [versets, apprise, segment]);

  // ── Enregistrement micro (expo-audio) — l'utilisateur démarre/arrête
  // manuellement (comme le moteur de leçon, cf. app/(app)/lesson/play.tsx) :
  // la détection automatique de silence (VAD) basée sur le niveau audio
  // (`metering`) s'est révélée peu fiable sur certains appareils/versions
  // (valeur jamais renseignée ou incohérente), ce qui empêchait l'enchaînement
  // automatique d'un verset au suivant.
  const recorder = useAudioRecorder(RECORDING_OPTIONS);

  const [phase, setPhase]       = useState<Phase>('pret');
  const [subPhase, setSubPhase] = useState<SubPhase>('recording');
  const [mode, setMode]         = useState<ExerciceMode | null>(null);
  const [etapeIndex, setEtapeIndex] = useState(0);
  // Nombre d'étapes ayant réellement reçu un verdict serveur (Whisper) dans
  // CETTE session — distinct de `etapes.length` (le total théorique) : si
  // l'utilisateur quitte via « Terminer » avant la fin, seules les étapes
  // déjà jugées comptent dans le score, pas celles jamais tentées.
  const [etapesTraitees, setEtapesTraitees] = useState(0);
  const [nbAides, setNbAides]   = useState(0);
  const [choisi, setChoisi]     = useState<Reponse | null>(null);
  const [micDenied, setMicDenied] = useState(false);

  const etapes = useMemo(() => {
    if (!segVersets) return null;
    return buildEtapes(mode ?? 'recitation', segVersets);
  }, [segVersets, mode]);

  // Empêche un double-appui sur « Terminer » d'envoyer deux fois la même
  // session (double POST .../segments/:i/review).
  const quittingRef = useRef(false);

  const etapeIndexRef = useRef(0);
  const etapesRef = useRef<Etape[] | null>(null);
  useEffect(() => { etapeIndexRef.current = etapeIndex; }, [etapeIndex]);
  useEffect(() => { etapesRef.current = etapes; }, [etapes]);

  // Sécurité : couper l'enregistrement + mode lecture (micro ET audio distant)
  // en quittant l'écran. L'objet natif du recorder peut déjà être détruit au
  // démontage (expo-audio) : toute lecture de ses propriétés doit donc être
  // protégée par un try/catch.
  useEffect(() => () => {
    try {
      if (recorder.isRecording) recorder.stop().catch(() => {});
    } catch {}
    exitRecordingMode();
    stopRemoteAudio();
  }, []);

  /** Démarre l'enregistrement de l'étape courante. */
  const startRecording = useCallback(async () => {
    await enterRecordingMode();
    await recorder.prepareToRecordAsync();
    recorder.record();
  }, [recorder]);

  /** Lance la session dans le mode choisi (recitation/chainage/cloze/ecoute). */
  const demarrer = async (chosenMode: ExerciceMode) => {
    const granted = await ensureMicPermission();
    if (!granted) { setMicDenied(true); return; }
    setMicDenied(false);
    setMode(chosenMode);
    setNbAides(0);
    setEtapeIndex(0);
    setEtapesTraitees(0);
    setPhase('recitation');
    if (chosenMode === 'ecoute') {
      setSubPhase('listening');
    } else {
      setSubPhase('recording');
      await startRecording();
    }
  };

  /** Passe à l'étape suivante (ou termine). */
  const avancer = useCallback(async (i: number) => {
    // L'étape `i` vient de recevoir un verdict (serveur ou best-effort hors
    // ligne) — elle compte comme traitée dans le score final.
    setEtapesTraitees(i + 1);
    if (!etapesRef.current || i + 1 >= etapesRef.current.length) {
      await exitRecordingMode();
      setPhase('fini');
      return;
    }
    setEtapeIndex(i + 1);
    if (mode === 'ecoute') {
      setSubPhase('listening');
    } else {
      setSubPhase('recording');
      await startRecording();
    }
  }, [startRecording, mode]);

  // Écoute + répétition : joue l'audio du verset (jamais de texte affiché),
  // puis lance l'enregistrement dès la fin de la lecture. Si le verset n'a
  // pas d'audio, `playRemoteAudioAsync` résout immédiatement → dégradation
  // silencieuse vers l'enregistrement direct.
  useEffect(() => {
    if (phase !== 'recitation' || mode !== 'ecoute' || subPhase !== 'listening') return;
    const etape = etapesRef.current?.[etapeIndexRef.current];
    if (!etape || etape.type !== 'verset') return;
    let annule = false;
    (async () => {
      await playRemoteAudioAsync(etape.verset.audioUrl);
      if (annule) return;
      setSubPhase('recording');
      await startRecording();
    })();
    return () => { annule = true; };
  }, [phase, mode, subPhase, etapeIndex, startRecording]);

  /**
   * Fin de silence court détectée pendant l'écoute : on considère l'étape
   * courante terminée. Coupe l'enregistrement, l'envoie au serveur
   * (best-effort), puis enchaîne sans attendre l'utilisateur :
   *   fluide          → étape suivante, ré-écoute immédiate ;
   *   hesitant/oublie → laisse tourner le silence long vers l'aide (on ne
   *                     coupe pas la parole si l'utilisateur reprend vite).
   * Hors-ligne / erreur → on avance sans pénalité (best-effort).
   */
  const analyserEtape = useCallback(async () => {
    const i = etapeIndexRef.current;
    const etape = etapesRef.current?.[i];
    if (!etape || !recorder.isRecording) return;
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch { /* recorder déjà arrêté/détruit */ }
    setSubPhase('analyzing');
    try {
      if (!uri) throw new Error('no-recording');
      const res = etape.type === 'verset'
        ? await reciteVerset(etape.verset.id, uri)
        : await reciteVersetRange(Number(numero), etape.debut, etape.fin, uri);
      if (res.verdict === 'fluide') {
        await avancer(i);
      } else {
        setNbAides((n) => n + 1);
        setSubPhase('aide');
      }
    } catch {
      await avancer(i);
    }
  }, [recorder, avancer, numero]);

  /**
   * Après l'aide (verdict serveur négatif) : l'utilisateur relit/réentend
   * l'étape, puis appuie sur « Réessayer » pour relancer l'enregistrement de
   * la MÊME étape (pas la suivante). En mode « écoute », on rejoue d'abord
   * l'audio du verset avant de réenregistrer.
   */
  const reessayer = useCallback(async () => {
    if (mode === 'ecoute') {
      const etape = etapesRef.current?.[etapeIndexRef.current];
      if (etape?.type === 'verset') await playRemoteAudioAsync(etape.verset.audioUrl);
    }
    setSubPhase('recording');
    await startRecording();
  }, [mode, startRecording]);

  const terminerTot = async () => {
    if (recorder.isRecording) await recorder.stop().catch(() => {});
    await exitRecordingMode();
    stopRemoteAudio();
    // L'étape en cours (etapeIndex) n'a jamais reçu de verdict serveur (on
    // vient de couper l'enregistrement sans l'analyser) — elle ne compte pas
    // comme réussie dans le score final, seules les étapes déjà validées le
    // sont (voir calcul de `total` dans l'écran résultat, phase === 'fini').
    setEtapesTraitees(etapeIndex);
    setPhase('fini');
  };

  const reset = () => {
    stopRemoteAudio();
    setPhase('pret'); setMode(null); setEtapeIndex(0); setEtapesTraitees(0); setNbAides(0); setChoisi(null); setSubPhase('recording');
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
  if (!versets || !meta || !segVersets || (apprise && !segment)) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>{tr('flashcard.loading')}</Text>
      </View>
    );
  }

  // ── Écran résultat ──
  if (phase === 'fini') {
    // `etapesTraitees` = étapes ayant réellement reçu un verdict (serveur
    // Whisper ou best-effort hors-ligne) — PAS `etapes.length` (le total
    // théorique de la session). Sans ça, quitter via « Terminer » avant la
    // fin comptait à tort toutes les étapes jamais tentées comme fluides.
    const total = etapesTraitees;
    const ratio = total > 0 ? (total - nbAides) / total : 0;
    const suggestion: Reponse = ratio >= 0.8 ? 'facile' : ratio >= 0.5 ? 'difficile' : 'oublie';
    return (
      <ResultScreen
        aides={nbAides}
        total={total}
        suggestion={suggestion}
        choisi={choisi}
        onChoisir={setChoisi}
        onRestart={reset}
        apprise={apprise}
        onQuitter={async () => {
          if (quittingRef.current) return;
          quittingRef.current = true;
          // Enregistre l'auto-évaluation de l'utilisateur pour CE segment
          // (SRS serveur : score, état, prochaine révision recalculés
          // indépendamment des autres segments). Best-effort : une panne
          // réseau ici ne doit pas bloquer la sortie de l'écran.
          if (choisi && segment) {
            try {
              await reviewSegment(Number(numero), segment.segmentIndex, choisi);
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

  const etapeCourante = etapes?.[etapeIndex] ?? null;

  const MODE_DEFS: Array<{ id: ExerciceMode; icon: 'mic' | 'link' | 'eye-off' | 'headphones'; title: string; desc: string }> = [
    { id: 'recitation', icon: 'mic', title: tr('flashcard.modeRecitation'), desc: tr('flashcard.modeRecitationDesc') },
    { id: 'chainage', icon: 'link', title: tr('flashcard.modeChainage'), desc: tr('flashcard.modeChainageDesc') },
    { id: 'cloze', icon: 'eye-off', title: tr('flashcard.modeCloze'), desc: tr('flashcard.modeClozeDesc') },
    { id: 'ecoute', icon: 'headphones', title: tr('flashcard.modeEcoute'), desc: tr('flashcard.modeEcouteDesc') },
  ];

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
            {apprise && segment && (
              <Text style={styles.headerSegment}>
                {tr('flashcard.segmentRange', { debut: segment.debut, fin: segment.fin })}
              </Text>
            )}
          </View>
          <View style={{ width: 30 }} />
        </View>
        {phase === 'recitation' && etapes && (
          <>
            <ProgressBar current={etapeIndex + 1} total={etapes.length} />
            <Text style={styles.headerCount}>
              {etapeCourante?.type === 'assemble'
                ? tr('flashcard.assembleBadge')
                : tr('flashcard.verseCount', { n: (etapeCourante?.indexInSeg ?? 0) + 1, total: segVersets.length })}
            </Text>
          </>
        )}
      </LinearGradient>

      {/* Zone centrale */}
      <View style={styles.cardZone}>
        {phase === 'pret' ? (
          // ── Écran prêt : choix du mode d'exercice (sourate apprise) ou
          // bouton unique (entraînement libre, comme avant) ──
          <View style={styles.pretCard}>
            <Text style={styles.pretEmoji}>🎙️</Text>
            <Text style={styles.pretTitle}>
              {apprise ? tr('flashcard.chooseModeTitle') : tr('flashcard.reciteFromMemory')}
            </Text>
            <Text style={styles.pretDesc}>
              {apprise ? tr('flashcard.chooseModeDesc') : tr('flashcard.reciteDesc')}
            </Text>
            {micDenied && (
              <Text style={styles.micDenied}>
                {tr('flashcard.micDenied')}
              </Text>
            )}
          </View>
        ) : subPhase === 'aide' ? (
          mode === 'ecoute' ? (
            // ── Aide en mode écoute : jamais de texte, on rejoue l'audio ──
            <View style={styles.cardWrap}>
              <Animated.View key="aide-ecoute" entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={styles.fluideCard}>
                <Feather name="volume-2" size={40} color="#F0820C" />
                <Text style={styles.fluideText}>{tr('flashcard.listenPrompt')}</Text>
                <Text style={styles.fluideSub}>{tr('flashcard.appListening')}</Text>
              </Animated.View>
            </View>
          ) : (
            // ── Carte d'aide (verdict serveur : hésitant / oublié) ──
            <View style={styles.cardWrap}>
              <Animated.View
                key={etapeCourante?.type === 'verset' ? etapeCourante.verset.id : `assemble-${etapeCourante?.fin}`}
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
                style={styles.aideCard}
              >
                <View style={styles.aideBadge}>
                  <Feather name="help-circle" size={13} color="#F0820C" />
                  <Text style={styles.aideBadgeText}>{tr('flashcard.helpBadge')}</Text>
                </View>
                <ArabicText style={styles.aideArabe}>
                  {etapeCourante?.type === 'assemble' ? etapeCourante.texte : (etapeCourante?.verset.texteArabe ?? '')}
                </ArabicText>
                {etapeCourante?.type === 'verset' && !!etapeCourante.verset.translitteration && (
                  <Text style={styles.aideTranslit}>{etapeCourante.verset.translitteration.texte}</Text>
                )}
                <Text style={styles.aideHint}>{tr('flashcard.helpHint')}</Text>
              </Animated.View>
            </View>
          )
        ) : subPhase === 'analyzing' ? (
          // ── Analyse serveur en cours ──
          <View style={styles.cardWrap}>
            <Animated.View key="analyzing" entering={FadeIn.duration(200)} style={styles.fluideCard}>
              <ActivityIndicator size="large" color="#6B4DFF" />
              <Text style={styles.fluideText}>{tr('flashcard.analyzing')}</Text>
              <Text style={styles.fluideSub}>{tr('flashcard.oneMoment')}</Text>
            </Animated.View>
          </View>
        ) : subPhase === 'listening' ? (
          // ── Écoute + répétition : lecture audio, aucun texte affiché ──
          <View style={styles.cardWrap}>
            <Animated.View entering={FadeIn.duration(300)} style={styles.fluideCard}>
              <Feather name="volume-2" size={48} color="#6B4DFF" />
              <Text style={styles.fluideText}>{tr('flashcard.listenPrompt')}</Text>
              <Pressable
                style={styles.replayBtn}
                onPress={() => {
                  if (etapeCourante?.type === 'verset') playRemoteAudioAsync(etapeCourante.verset.audioUrl);
                }}
              >
                <Feather name="rotate-ccw" size={14} color="#6B4DFF" />
                <Text style={styles.replayBtnText}>{tr('flashcard.replayAudio')}</Text>
              </Pressable>
            </Animated.View>
          </View>
        ) : etapeCourante?.type === 'assemble' ? (
          // ── Chaînage : point d'assemblage (récite plusieurs versets d'un bloc) ──
          <View style={styles.cardWrap}>
            <Animated.View key="assemble" entering={FadeIn.duration(300)} style={styles.fluideCard}>
              <Wave />
              <Text style={styles.fluideText}>
                {tr('flashcard.reciteAssemble', { debut: etapeCourante.debut, fin: etapeCourante.fin })}
              </Text>
              <Text style={styles.fluideSub}>{tr('flashcard.assembleHint')}</Text>
            </Animated.View>
          </View>
        ) : mode === 'cloze' && etapeCourante ? (
          // ── Cloze : texte à trous en scaffold pendant la récitation ──
          <View style={styles.cardWrap}>
            <Animated.View key={`cloze-${etapeCourante.verset.id}`} entering={FadeIn.duration(300)} style={styles.clozeCard}>
              <Text style={styles.clozeHint}>{tr('flashcard.clozeHint')}</Text>
              <ArabicText style={styles.clozeArabe}>
                {clozeText(etapeCourante.verset.texteArabe, clozeRatio(etapeCourante.indexInSeg, segVersets.length))}
              </ArabicText>
              <Wave />
            </Animated.View>
          </View>
        ) : (
          // ── Enregistrement en cours → carte encourageante (récitation / chaînage) ──
          <View style={styles.cardWrap}>
            <Animated.View key="fluide" entering={FadeIn.duration(300)} style={styles.fluideCard}>
              <Wave />
              <Text style={styles.fluideText}>
                {tr('flashcard.reciteVerse', { n: etapeCourante?.type === 'verset' ? etapeCourante.verset.numero : 0 })}
              </Text>
              <Text style={styles.fluideSub}>{tr('flashcard.appListening')}</Text>
            </Animated.View>
          </View>
        )}
      </View>

      {/* Bas */}
      <View style={styles.bottom}>
        {phase === 'pret' ? (
          apprise ? (
            <View style={styles.modeGrid}>
              {MODE_DEFS.map((m) => (
                <Pressable key={m.id} style={styles.modeCard} onPress={() => demarrer(m.id)}>
                  <Feather name={m.icon} size={22} color="#6B4DFF" />
                  <Text style={styles.modeCardTitle}>{m.title}</Text>
                  <Text style={styles.modeCardDesc} numberOfLines={2}>{m.desc}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable style={styles.micBtn} onPress={() => demarrer('recitation')}>
              <Feather name="mic" size={22} color="#fff" />
              <Text style={styles.micBtnText}>{tr('flashcard.startRecitation')}</Text>
            </Pressable>
          )
        ) : subPhase === 'recording' ? (
          <>
            <Pressable style={styles.micBtn} onPress={analyserEtape}>
              <Feather name="check-circle" size={22} color="#fff" />
              <Text style={styles.micBtnText}>{tr('flashcard.doneReciting')}</Text>
            </Pressable>
            <Pressable style={styles.finBtn} onPress={terminerTot}>
              <Text style={styles.finBtnText}>{tr('flashcard.finished')}</Text>
            </Pressable>
          </>
        ) : subPhase === 'aide' ? (
          <>
            <Pressable style={styles.micBtn} onPress={reessayer}>
              <Feather name="mic" size={22} color="#fff" />
              <Text style={styles.micBtnText}>{tr('flashcard.retry')}</Text>
            </Pressable>
            <Pressable style={styles.finBtn} onPress={terminerTot}>
              <Text style={styles.finBtnText}>{tr('flashcard.finished')}</Text>
            </Pressable>
          </>
        ) : subPhase === 'listening' ? null : (
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
  headerSegment: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  progWrap: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progBar: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  headerCount: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8 },

  // Zone centrale
  cardZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },

  // Écran prêt
  pretCard: { alignItems: 'center', paddingHorizontal: 10 },
  pretEmoji: { fontSize: 64, marginBottom: 20 },
  pretTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333', marginBottom: 14, textAlign: 'center' },
  pretDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#7A828F', textAlign: 'center', lineHeight: 24 },
  micDenied: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#E03434', textAlign: 'center', marginTop: 16 },

  // Choix du mode d'exercice
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modeCard: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 4,
    borderWidth: 2, borderColor: '#EDE8FF',
  },
  modeCardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#1B2333', marginTop: 2 },
  modeCardDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: '#8A8F99', lineHeight: 15 },

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

  // Carte cloze (texte à trous, scaffold pendant la récitation)
  clozeCard: {
    width: '100%', backgroundColor: '#fff', borderRadius: 28, padding: 24,
    alignItems: 'center', gap: 16,
    borderWidth: 2, borderColor: '#EDE8FF',
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  clozeHint: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#6B4DFF' },
  clozeArabe: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 26, color: '#1B2333',
    textAlign: 'center', lineHeight: 46, writingDirection: 'rtl',
  },

  // Rejouer l'audio (écoute + répétition)
  replayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDE8FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 6,
  },
  replayBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#6B4DFF' },

  // Carte fluide / analyse
  fluideCard: { alignItems: 'center', gap: 14 },
  wave: { flexDirection: 'row', alignItems: 'center', height: 60, gap: 6 },
  waveBar: { width: 6, height: 50, borderRadius: 3, backgroundColor: '#6B4DFF' },
  fluideText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333', textAlign: 'center' },
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
