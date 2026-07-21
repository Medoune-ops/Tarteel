import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { fetchLesson, reviewLettre, reciteLettreStep, ApiError, type RevisionQuality } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { ensureMicPermission, enterRecordingMode, exitRecordingMode } from '../../../lib/audio/recorder';
import { playRemoteAudio, stopRemoteAudio } from '../../../constants/sounds';
import { getLetterSound } from '../../../constants/letterSounds';
import type { DiscoveryStep } from '../../../constants/lessonEngine';
import ArabicText from '../../../components/ArabicText';
import { useTheme } from '../../../utils/useTheme';
import DeviceStatusBar from '../../../components/StatusBar';
import { useT, t } from '../../../lib/i18n';
import { useUserStore } from '../../../store/userStore';

type Reponse = 'facile' | 'difficile' | 'oublie';
/** État de la carte courante pendant la session vocale. */
type CardPhase = 'idle' | 'recording' | 'analyzing' | 'correct' | 'wrong';

function scoreMeta(rep: Reponse): { label: string; emoji: string; bg: string } {
  if (rep === 'facile') return { label: t('lettre.facile'), emoji: '😊', bg: '#34C724' };
  if (rep === 'difficile') return { label: t('lettre.difficile'), emoji: '😅', bg: '#F6B100' };
  return { label: t('lettre.oublie'), emoji: '😬', bg: '#FF6B6B' };
}

/** Verdict SRS calculé depuis le taux de réussite Whisper de la session. */
function qualityFromRatio(ratio: number): Reponse {
  if (ratio >= 0.8) return 'facile';
  if (ratio >= 0.4) return 'difficile';
  return 'oublie';
}

/** Joue l'audio d'une carte : mp3 local de lettre > TTS arabe > URL distante. */
function playCard(step: DiscoveryStep) {
  const localSrc = getLetterSound(step.letterKey);
  if (localSrc != null) playRemoteAudio(localSrc);
  else if (step.ttsText) Speech.speak(step.ttsText, { language: 'ar' });
  else playRemoteAudio(step.audioUrl);
}

/**
 * Révision vocale d'une leçon d'alphabet/harakat : chaque lettre/syllabe
 * s'affiche, l'utilisateur la PRONONCE au micro, Whisper (serveur) juge.
 * Faux → la bonne prononciation est montrée et jouée. À la fin, le verdict
 * SRS est appliqué automatiquement depuis le taux de réussite réel
 * (POST /me/revisions/lettres/:id/review). Si le micro est refusé, on
 * retombe sur des flashcards à révéler + auto-évaluation manuelle.
 */
export default function LettreRevisionScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const { lessonId, titre } = useLocalSearchParams<{ lessonId: string; titre?: string }>();

  // ── Cartes = étapes discovery de la leçon (lettres/syllabes enseignées) ──
  const [cards, setCards] = useState<DiscoveryStep[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<CardPhase>('idle');
  const [successes, setSuccesses] = useState(0);
  const [finished, setFinished] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  /** Message d'erreur affiché sous la carte (micro ou analyse en échec). */
  const [cardError, setCardError] = useState<string | null>(null);

  // ── Fin de session : application du SRS ──
  const [applied, setApplied] = useState<Reponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Empêche la double application (double effet / double tap réessayer).
  const applyingRef = useRef(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const load = useCallback(async () => {
    if (!lessonId) { setLoadError(true); return; }
    setLoadError(false);
    try {
      const lang = useUserStore.getState().language;
      const lesson = await swrFetch(`lesson:${lessonId}:${lang}`, () => fetchLesson(lessonId, lang));
      setCards(lesson.steps.filter((s): s is DiscoveryStep => s.type === 'discovery'));
    } catch {
      setLoadError(true);
    }
  }, [lessonId]);

  useEffect(() => { load(); }, [load]);

  // Micro : demandé à l'entrée ; refus → mode flashcard manuel (fallback).
  useEffect(() => {
    ensureMicPermission().then((granted) => setMicDenied(!granted));
  }, []);

  // Sécurité : couper enregistrement + audio en quittant l'écran.
  useEffect(() => () => {
    try {
      if (recorder.isRecording) recorder.stop().catch(() => {});
    } catch {}
    exitRecordingMode();
    stopRemoteAudio();
    Speech.stop();
  }, []);

  /** Démarre l'enregistrement de la prononciation. */
  const startRecording = useCallback(async () => {
    setCardError(null);
    stopRemoteAudio();
    Speech.stop();
    try {
      await enterRecordingMode();
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
    } catch {
      // Micro indisponible (web/simulateur…) : on bascule en mode manuel
      // plutôt que de laisser un bouton qui ne fait rien.
      setCardError(t('lettre.micUnavailable'));
      setMicDenied(true);
    }
  }, [recorder]);

  /** Arrête l'enregistrement et envoie au judging Whisper. */
  const stopAndJudge = useCallback(async () => {
    if (!cards) return;
    const card = cards[index];
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri;
    } catch { /* recorder déjà arrêté/détruit */ }
    // iOS : le mode enregistrement (allowsRecording: true) coupe/atténue la
    // lecture audio — on repasse en mode lecture avant de rejouer la carte.
    await exitRecordingMode();
    setPhase('analyzing');
    try {
      if (!uri) {
        setCardError(t('lettre.recordingFailed'));
        setPhase('idle');
        return;
      }
      const res = await reciteLettreStep(card.id, uri);
      setCardError(null);
      if (res.verdict === 'fluide') {
        setSuccesses((n) => n + 1);
        setPhase('correct');
        playCard(card); // renforce la bonne prononciation
      } else {
        setPhase('wrong');
        playCard(card); // fait entendre la bonne prononciation
      }
    } catch (e) {
      // Réseau/ASR indisponible : on ne pénalise pas — on laisse réessayer,
      // avec un message clair au lieu d'un retour silencieux.
      setCardError(
        e instanceof ApiError && e.status === 503
          ? t('lettre.asrUnavailable')
          : t('lettre.analysisFailed'),
      );
      setPhase('idle');
    }
  }, [cards, index, recorder]);

  const next = useCallback(() => {
    if (!cards) return;
    stopRemoteAudio();
    Speech.stop();
    setCardError(null);
    if (index + 1 >= cards.length) setFinished(true);
    else { setIndex(index + 1); setPhase('idle'); }
  }, [cards, index]);

  /** Applique le verdict SRS (auto en mode vocal, choisi en mode manuel). */
  const applyReview = useCallback(async (rep: Reponse) => {
    if (applyingRef.current || !lessonId) return;
    applyingRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      await reviewLettre(lessonId, rep as RevisionQuality);
      setApplied(rep);
    } catch {
      setSaveError(true);
    } finally {
      applyingRef.current = false;
      setSaving(false);
    }
  }, [lessonId]);

  // Mode vocal : le verdict est appliqué automatiquement à la fin de session.
  const autoQuality = cards && cards.length > 0 ? qualityFromRatio(successes / cards.length) : 'oublie';
  useEffect(() => {
    if (finished && !micDenied && !applied && !saving && !saveError) {
      applyReview(autoQuality);
    }
  }, [finished, micDenied, applied, saving, saveError, autoQuality, applyReview]);

  // ── États chargement / erreur ──
  if (loadError) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Feather name="wifi-off" size={32} color={T.textSecondary} />
        <Text style={[styles.stateText, { color: T.text }]}>{tr('lettre.loadError')}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>{tr('lettre.retry')}</Text>
        </Pressable>
      </View>
    );
  }
  if (!cards) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <ActivityIndicator size="large" color="#6B4DFF" />
      </View>
    );
  }
  if (cards.length === 0) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Text style={[styles.stateText, { color: T.text }]}>{tr('lettre.nothingToReview')}</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryLabel}>{tr('lettre.back')}</Text>
        </Pressable>
      </View>
    );
  }

  // ── Écran de fin ──
  if (finished) {
    const pct = Math.round((successes / cards.length) * 100);
    const verdict = scoreMeta(applied ?? autoQuality);
    return (
      <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.resultGrad}>
          <Text style={styles.headerEmoji}>{micDenied ? '📖' : verdict.emoji}</Text>
          <Text style={styles.headerTitle}>{titre ?? tr('lettre.reviewDefault')}</Text>
          {!micDenied && (
            <>
              <View style={styles.resultCircle}>
                <Text style={styles.resultPct}>{pct}%</Text>
                <Text style={styles.resultSub}>{tr('lettre.pronunciation')}</Text>
              </View>
              <Text style={styles.headerSub}>{tr('lettre.cardsSucceeded', { n: successes, total: cards.length })}</Text>
            </>
          )}
        </LinearGradient>

        <View style={styles.body}>
          {micDenied ? (
            // Fallback manuel : micro refusé → auto-évaluation classique.
            <>
              <Text style={[styles.question, { color: T.text }]}>{tr('lettre.howDidYouFeel')}</Text>
              {saveError && <Text style={styles.errorText}>{tr('lettre.errGeneric')}</Text>}
              <View style={styles.btnsCol}>
                {(['oublie', 'difficile', 'facile'] as Reponse[]).map((rep) => {
                  const s = scoreMeta(rep);
                  return (
                    <Pressable
                      key={rep}
                      style={[styles.repBtn, { backgroundColor: s.bg }, saving && { opacity: 0.6 }]}
                      onPress={async () => { await applyReview(rep); if (!applyingRef.current) router.back(); }}
                      disabled={saving || applied != null}
                    >
                      <Text style={styles.repBtnEmoji}>{s.emoji}</Text>
                      <Text style={styles.repBtnLabel}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            // Mode vocal : verdict appliqué automatiquement depuis le score réel.
            <>
              {saving && (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color="#6B4DFF" />
                  <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('lettre.updatingMastery')}</Text>
                </View>
              )}
              {applied && (
                <View style={styles.center}>
                  <View style={[styles.verdictPill, { backgroundColor: verdict.bg }]}>
                    <Text style={styles.repBtnEmoji}>{verdict.emoji}</Text>
                    <Text style={styles.repBtnLabel}>{verdict.label}</Text>
                  </View>
                  <Text style={[styles.stateText, { color: T.textSecondary }]}>
                    {tr('lettre.verdictApplied')}
                  </Text>
                </View>
              )}
              {saveError && (
                <View style={styles.center}>
                  <Text style={styles.errorText}>{tr('lettre.saveError')}</Text>
                  <Pressable style={styles.retryBtn} onPress={() => applyReview(autoQuality)}>
                    <Text style={styles.retryLabel}>{tr('lettre.retry')}</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}

          <Pressable
            style={styles.restartBtn}
            onPress={() => { setIndex(0); setPhase('idle'); setSuccesses(0); setFinished(false); setApplied(null); setSaveError(false); }}
            disabled={saving}
          >
            <Feather name="refresh-cw" size={16} color="#6B4DFF" />
            <Text style={styles.restartTxt}>{tr('lettre.restart')}</Text>
          </Pressable>
          {applied != null && (
            <Pressable style={styles.quitBtn} onPress={() => router.back()}>
              <Text style={styles.quitTxt}>{tr('lettre.finish')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  // ── Carte courante ──
  const card = cards[index];
  const showAnswer = phase === 'correct' || phase === 'wrong';
  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="x" size={24} color={T.textSecondary} />
        </Pressable>
        <View style={[styles.progTrack, { backgroundColor: T.isDark ? '#2E2D3F' : '#E6E8ED' }]}>
          <View style={[styles.progFill, { width: `${((index + 1) / cards.length) * 100}%` }]} />
        </View>
        <Text style={[styles.progText, { color: T.textSecondary }]}>{index + 1}/{cards.length}</Text>
      </View>

      <View style={styles.cardZone}>
        <Text style={[styles.consigne, { color: T.textSecondary }]}>
          {phase === 'idle' && (micDenied ? tr('lettre.howToReadLetter') : tr('lettre.pronounceAloud'))}
          {phase === 'recording' && tr('lettre.listening')}
          {phase === 'analyzing' && tr('lettre.analyzingPronunciation')}
          {phase === 'correct' && tr('lettre.wellPronounced')}
          {phase === 'wrong' && tr('lettre.listenCorrectPronunciation')}
        </Text>

        <View
          style={[
            styles.flashcard,
            { backgroundColor: T.cardBg },
            phase === 'correct' && styles.cardOk,
            phase === 'wrong' && styles.cardKo,
          ]}
        >
          <ArabicText style={[styles.arabe, { color: T.text }]} harakatColor={T.isDark ? '#B9A8FF' : '#6B4DFF'}>{card.arabe}</ArabicText>
          {showAnswer && (
            <>
              <Text style={styles.translit}>{card.translitteration}</Text>
              <Text style={[styles.traduction, { color: T.textSecondary }]}>{card.traduction}</Text>
              <Pressable style={styles.audioBtn} onPress={() => { exitRecordingMode(); playCard(card); }} hitSlop={8}>
                <Feather name="volume-2" size={26} color="#2A9E1C" />
              </Pressable>
            </>
          )}
          {phase === 'analyzing' && <ActivityIndicator size="small" color="#6B4DFF" style={{ marginTop: 8 }} />}
        </View>

        {cardError && (
          <Text style={styles.cardErrorText}>{cardError}</Text>
        )}
      </View>

      <View style={styles.footer}>
        {micDenied ? (
          // Fallback sans micro : révéler puis passer.
          showAnswer ? (
            <Pressable style={styles.nextBtn} onPress={next}>
              <Text style={styles.nextLabel}>{index + 1 >= cards.length ? tr('lettre.finish') : tr('lettre.next')}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>
          ) : (
            <Pressable style={[styles.nextBtn, { backgroundColor: '#6B4DFF', borderBottomColor: '#4A30CC' }]} onPress={() => { setPhase('wrong'); playCard(card); }}>
              <Text style={styles.nextLabel}>{tr('lettre.reveal')}</Text>
              <Feather name="eye" size={18} color="#fff" />
            </Pressable>
          )
        ) : phase === 'idle' ? (
          <Pressable style={[styles.micBtn, { backgroundColor: '#6B4DFF' }]} onPress={startRecording}>
            <Feather name="mic" size={26} color="#fff" />
            <Text style={styles.nextLabel}>{tr('lettre.tapAndPronounce')}</Text>
          </Pressable>
        ) : phase === 'recording' ? (
          <Pressable style={[styles.micBtn, { backgroundColor: '#FF4B4B' }]} onPress={stopAndJudge}>
            <Feather name="square" size={22} color="#fff" />
            <Text style={styles.nextLabel}>{tr('lettre.imDone')}</Text>
          </Pressable>
        ) : phase === 'analyzing' ? (
          <View style={[styles.micBtn, { backgroundColor: '#9AA0AA' }]}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.nextLabel}>{tr('lettre.analyzingShort')}</Text>
          </View>
        ) : (
          <Pressable style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextLabel}>{index + 1 >= cards.length ? tr('lettre.finish') : tr('lettre.next')}</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12 },
  progTrack: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 6, backgroundColor: '#34C724' },
  progText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  cardZone: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 20 },
  consigne: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17, textAlign: 'center' },
  flashcard: {
    width: '100%', maxWidth: 380, borderRadius: 28, paddingVertical: 44, paddingHorizontal: 24,
    alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 4,
  },
  cardOk: { borderWidth: 3, borderColor: '#34C724' },
  cardKo: { borderWidth: 3, borderColor: '#FF6B6B' },
  cardErrorText: {
    fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#FF4B4B',
    textAlign: 'center', paddingHorizontal: 12,
  },
  arabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 84, lineHeight: 120, textAlign: 'center' },
  translit: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#6B4DFF' },
  traduction: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center' },
  audioBtn: {
    marginTop: 8, width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(52,199,36,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  footer: { padding: 20, paddingBottom: 28 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#34C724', borderRadius: 16, paddingVertical: 16,
    borderBottomWidth: 4, borderBottomColor: '#2A9E1C',
  },
  micBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 16,
  },
  nextLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },

  resultGrad: { paddingTop: 16, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center', gap: 6 },
  headerEmoji: { fontSize: 40, marginBottom: 4 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff', textAlign: 'center' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  resultCircle: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginVertical: 8,
  },
  resultPct: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  resultSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.85)' },

  body: { flex: 1, padding: 24, justifyContent: 'center' },
  question: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, textAlign: 'center', marginBottom: 24 },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#FF4B4B', textAlign: 'center', marginBottom: 8 },
  btnsCol: { gap: 12 },
  repBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 16,
  },
  repBtnEmoji: { fontSize: 22 },
  repBtnLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  verdictPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12,
  },
  restartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, paddingVertical: 12,
  },
  restartTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  quitBtn: {
    marginTop: 4, backgroundColor: '#34C724', borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#2A9E1C',
  },
  quitTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
});
