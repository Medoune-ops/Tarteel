/**
 * Révision GUIDÉE — chaînage progressif verset par verset (rejoue l'ordre RÉEL
 * d'apprentissage, cf. GET/POST /me/revisions/:idOrNumero/guided[/advance]).
 *
 * Contrairement au SRS par segment (flashcard.tsx, blocs fixes de 10 versets),
 * ici le serveur pilote entièrement la progression : bloc consolidé (déjà
 * soudé) → nouveaux versets → bloc assemblé à réciter d'un coup. Un seul geste
 * d'enregistrement par pas (pas de VAD multi-étapes comme le SRS classique) :
 * on récite le bloc assemblé entier, le serveur juge, on s'auto-évalue, on
 * avance.
 */
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { useAudioRecorder, useAudioRecorderState, RecordingPresets } from 'expo-audio';
import {
  fetchGuidedRevision, advanceGuidedRevision, reciteVersetRange,
  type GuidedRevisionView, type ReciteVersetResult, type RevisionQuality,
} from '../../../lib/api';
import { ensureMicPermission, enterRecordingMode, exitRecordingMode } from '../../../lib/audio/recorder';
import { useT, t } from '../../../lib/i18n';

type Phase = 'pret' | 'recording' | 'analyzing' | 'resultat';

function verdictToQuality(verdict: ReciteVersetResult['verdict']): RevisionQuality {
  if (verdict === 'fluide') return 'facile';
  if (verdict === 'hesitant') return 'difficile';
  return 'oublie';
}

export default function GuidedRevisionScreen() {
  const router = useRouter();
  const tr = useT();
  const { numero } = useLocalSearchParams<{ numero: string }>();

  const [guided, setGuided] = useState<GuidedRevisionView | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [phase, setPhase] = useState<Phase>('pret');
  const [result, setResult] = useState<ReciteVersetResult | null>(null);
  const [choisi, setChoisi] = useState<RevisionQuality | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  const load = useCallback(async () => {
    if (!numero) { setLoadError(true); return; }
    setLoadError(false);
    try {
      const data = await fetchGuidedRevision(numero);
      setGuided(data);
    } catch {
      setLoadError(true);
    }
  }, [numero]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => () => {
    try { if (recorder.isRecording) recorder.stop().catch(() => {}); } catch {}
    exitRecordingMode();
  }, []);

  const demarrer = async () => {
    const granted = await ensureMicPermission();
    if (!granted) { setMicDenied(true); return; }
    setMicDenied(false);
    setResult(null);
    setChoisi(null);
    await enterRecordingMode();
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  };

  const arreterEtEnvoyer = async () => {
    if (!guided?.step) return;
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch { /* déjà arrêté */ }
    await exitRecordingMode();
    setPhase('analyzing');
    try {
      if (!uri) throw new Error('no-recording');
      const { debut, fin } = guided.step.blocAssemble;
      const res = await reciteVersetRange(Number(numero), debut, fin, uri);
      setResult(res);
      setChoisi(verdictToQuality(res.verdict));
      setPhase('resultat');
    } catch {
      setLoadError(true);
      setPhase('pret');
    }
  };

  const avancer = async () => {
    if (!choisi || advancing) return;
    setAdvancing(true);
    try {
      const next = await advanceGuidedRevision(Number(numero), choisi);
      setGuided(next);
      setPhase('pret');
      setResult(null);
      setChoisi(null);
    } catch {
      setLoadError(true);
    } finally {
      setAdvancing(false);
    }
  };

  if (loadError) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Feather name="wifi-off" size={34} color="#9AA0AA" />
        <Text style={styles.stateText}>{tr('guided.loadError')}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>{tr('common.retry')}</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>{tr('flashcard.back')}</Text>
        </Pressable>
      </View>
    );
  }

  if (!guided) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>{tr('flashcard.loading')}</Text>
      </View>
    );
  }

  // Chaînage terminé : toute la sourate a été assemblée d'un bloc.
  if (guided.terminee || !guided.step) {
    return (
      <View style={styles.screen}>
        <LinearGradient colors={['#34C724', '#2A9E1C']} style={styles.doneGrad}>
          <Text style={styles.doneEmoji}>🏆</Text>
          <Text style={styles.doneTitle}>{tr('guided.doneTitle')}</Text>
          <Text style={styles.doneSub}>{tr('guided.doneSub', { nom: guided.nom })}</Text>
        </LinearGradient>
        <View style={styles.bottom}>
          <Pressable style={styles.finBtn} onPress={() => router.back()}>
            <Text style={styles.finBtnText}>{tr('flashcard.finish')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { blocConsolide, nouveauxVersets, blocAssemble } = guided.step;
  const progressPct = guided.lessonsTotal > 0
    ? Math.round((guided.lessonsConsolidees / guided.lessonsTotal) * 100)
    : 0;

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="x" size={22} color="#fff" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={styles.headerNom} numberOfLines={1}>{guided.nom} · {guided.nomArabe}</Text>
            <Text style={styles.headerSub}>
              {tr('guided.progress', { done: guided.lessonsConsolidees, total: guided.lessonsTotal })}
            </Text>
          </View>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.progWrap}>
          <View style={[styles.progBar, { width: `${progressPct}%` }]} />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {blocConsolide && (
          <View style={[styles.stepCard, styles.stepDone]}>
            <View style={styles.stepBadge}>
              <Feather name="check" size={13} color="#2A9E1C" />
              <Text style={[styles.stepBadgeText, { color: '#2A9E1C' }]}>{tr('guided.consolidatedBadge')}</Text>
            </View>
            <Text style={styles.stepRange}>
              {tr('flashcard.segmentRange', { debut: blocConsolide.debut, fin: blocConsolide.fin })}
            </Text>
          </View>
        )}

        <View style={[styles.stepCard, styles.stepNew]}>
          <View style={styles.stepBadge}>
            <Feather name="star" size={13} color="#6B4DFF" />
            <Text style={[styles.stepBadgeText, { color: '#6B4DFF' }]}>{tr('guided.newBadge')}</Text>
          </View>
          <Text style={styles.stepRange}>
            {tr('flashcard.segmentRange', { debut: nouveauxVersets.debut, fin: nouveauxVersets.fin })}
          </Text>
        </View>

        <View style={styles.assembleZone}>
          {phase === 'pret' && (
            <>
              <Text style={styles.assembleTitle}>{tr('guided.assembleTitle')}</Text>
              <Text style={styles.assembleDesc}>
                {tr('flashcard.reciteAssemble', { debut: blocAssemble.debut, fin: blocAssemble.fin })}
              </Text>
              {micDenied && <Text style={styles.micDenied}>{tr('flashcard.micDenied')}</Text>}
            </>
          )}
          {phase === 'recording' && (
            <>
              <Feather name="mic" size={48} color="#6B4DFF" />
              <Text style={styles.assembleTitle}>{tr('guided.recording')}</Text>
              <Text style={styles.assembleDesc}>{tr('flashcard.assembleHint')}</Text>
              {recorderState.isRecording && (
                <Text style={styles.recDuration}>
                  {Math.round((recorderState.durationMillis ?? 0) / 1000)}s
                </Text>
              )}
            </>
          )}
          {phase === 'analyzing' && (
            <>
              <ActivityIndicator size="large" color="#6B4DFF" />
              <Text style={styles.assembleTitle}>{tr('flashcard.analyzing')}</Text>
            </>
          )}
          {phase === 'resultat' && result && choisi && (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.resultScore}>{result.score}%</Text>
              <Text style={styles.assembleDesc}>{tr('guided.selfAssessPrompt')}</Text>
              <View style={styles.btnsRow}>
                {(['oublie', 'difficile', 'facile'] as RevisionQuality[]).map((rep) => {
                  const isSuggestion = rep === choisi;
                  const meta = rep === 'facile'
                    ? { label: tr('flashcard.facile'), emoji: '😊', bg: '#34C724' }
                    : rep === 'difficile'
                    ? { label: tr('flashcard.difficile'), emoji: '😅', bg: '#F6B100' }
                    : { label: tr('flashcard.oublie'), emoji: '😬', bg: '#FF6B6B' };
                  return (
                    <Pressable
                      key={rep}
                      style={[styles.repBtn, { backgroundColor: meta.bg }, isSuggestion && styles.repBtnSuggested]}
                      onPress={() => setChoisi(rep)}
                    >
                      <Text style={styles.repBtnEmoji}>{meta.emoji}</Text>
                      <Text style={styles.repBtnLabel}>{meta.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.bottom}>
        {phase === 'pret' && (
          <Pressable style={styles.micBtn} onPress={demarrer}>
            <Feather name="mic" size={22} color="#fff" />
            <Text style={styles.micBtnText}>{tr('guided.startAssemble')}</Text>
          </Pressable>
        )}
        {phase === 'recording' && (
          <Pressable style={styles.micBtn} onPress={arreterEtEnvoyer}>
            <Feather name="check" size={22} color="#fff" />
            <Text style={styles.micBtnText}>{tr('guided.stopAndSend')}</Text>
          </Pressable>
        )}
        {phase === 'resultat' && (
          <Pressable style={[styles.finBtn, advancing && styles.btnDisabled]} onPress={avancer} disabled={advancing}>
            {advancing ? <ActivityIndicator color="#6B4DFF" /> : (
              <>
                <Feather name="arrow-right" size={18} color="#6B4DFF" />
                <Text style={styles.finBtnText}>{tr('guided.continue')}</Text>
              </>
            )}
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

  header: { paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: { padding: 4, width: 30 },
  headerNom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  progWrap: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden' },
  progBar: { height: 8, backgroundColor: '#fff', borderRadius: 4 },

  body: { flex: 1, padding: 18, gap: 12 },
  stepCard: {
    borderRadius: 16, padding: 14, borderWidth: 2,
  },
  stepDone: { backgroundColor: '#E8F9E6', borderColor: '#B7EAB0' },
  stepNew: { backgroundColor: '#EDE8FF', borderColor: '#D3C6FF' },
  stepBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  stepBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  stepRange: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#1B2333' },

  assembleZone: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 20, padding: 24, marginTop: 6,
    borderWidth: 2, borderColor: '#EDE8FF',
  },
  assembleTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#1B2333', textAlign: 'center' },
  assembleDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center', marginBottom: 8 },
  micDenied: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#E03434', textAlign: 'center', marginTop: 10 },
  recDuration: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#6B4DFF' },
  resultScore: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 40, color: '#6B4DFF' },

  btnsRow: { flexDirection: 'row', gap: 10, marginTop: 10, width: '100%' },
  repBtn: {
    flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center', gap: 2,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  repBtnSuggested: { borderWidth: 3, borderColor: '#fff' },
  repBtnEmoji: { fontSize: 22 },
  repBtnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff' },

  bottom: { paddingHorizontal: 22, paddingBottom: 38, paddingTop: 12 },
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

  doneGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 28 },
  doneEmoji: { fontSize: 64 },
  doneTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', textAlign: 'center' },
  doneSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
});
