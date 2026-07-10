import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, {
  Easing,
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import LessonHeader from '../../../components/LessonHeader';
import { useUserStore } from '../../../store/userStore';
import {
  type Lesson,
  type DiscoveryStep,
  type WrittenStep,
  type OrderingStep,
  type MatchingStep,
  type VoiceStep,
} from '../../../constants/lessonEngine';
import { fetchLesson, answerStep, reciteLessonStep, ApiError } from '../../../lib/api';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { ensureMicPermission, enterRecordingMode, exitRecordingMode } from '../../../lib/audio/recorder';
import { playRemoteAudio, playRemoteAudioAsync, stopRemoteAudio, setRemotePlaybackRate, correctFeedback, wrongFeedback } from '../../../constants/sounds';
import { getLetterSound } from '../../../constants/letterSounds';
import * as Speech from 'expo-speech';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Phase = 'answering' | 'correct' | 'wrong';

export default function LessonPlayScreen() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const isPremium = useUserStore((s) => s.isPremium);
  const voiceEnabled = useUserStore((s) => s.voiceEnabled);

  // Leçon chargée depuis l'API (GET /lessons/:id). Les vrais cuid des steps
  // sont nécessaires pour le judging serveur.
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!lessonId) { setLoadError(true); return; }
    let cancelled = false;
    fetchLesson(lessonId)
      .then((l) => {
        if (cancelled) return;
        // « Voix & enregistrements » désactivé → on saute les étapes micro.
        setLesson(voiceEnabled ? l : { ...l, steps: l.steps.filter((s) => s.type !== 'voice') });
      })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [lessonId, voiceEnabled]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [correctCount, setCorrectCount] = useState(0);
  // true pendant l'appel de judging (désactive le bouton Valider).
  const [judging, setJudging] = useState(false);
  // Bonne réponse révélée par le serveur APRÈS la réponse (pour surligner).
  const [revealed, setRevealed] = useState<string | null>(null);

  // Horodatage de début pour mesurer la durée de la leçon (envoyée au backend).
  const startedAt = useRef(Date.now());

  if (loadError) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Feather name="wifi-off" size={34} color="#9AA0AA" />
        <Text style={styles.stateText}>Impossible de charger la leçon.</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
          <Text style={styles.retryLabel}>Retour au parcours</Text>
        </Pressable>
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={styles.stateText}>Chargement de la leçon…</Text>
      </View>
    );
  }

  // Leçon sans contenu (étapes pas encore rédigées) : on évite le crash sur
  // lesson.steps[0] et on renvoie proprement au parcours.
  if (lesson.steps.length === 0) {
    return (
      <View style={[styles.screen, styles.centerState]}>
        <Feather name="clock" size={34} color="#9AA0AA" />
        <Text style={styles.stateText}>Cette leçon n'est pas encore disponible.</Text>
        <Pressable style={styles.retryBtn} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
          <Text style={styles.retryLabel}>Retour au parcours</Text>
        </Pressable>
      </View>
    );
  }

  const step = lesson.steps[index];
  const total = lesson.steps.length;
  const progress = index / total;
  // Étapes notées côté serveur (written + ordering + voice). Matching est client-side.
  const scoredTotal = lesson.steps.filter((s) => s.type === 'written' || s.type === 'ordering' || s.type === 'voice').length;

  // Passe à l'étape suivante, ou termine la leçon → écran de fin.
  // L'XP/streak/cœurs sont désormais crédités par le backend (POST /lesson/complete),
  // déclenché dans finish.tsx à partir des params ci-dessous.
  const goNext = () => {
    setRevealed(null);
    if (index + 1 >= total) {
      router.replace({
        pathname: '/(app)/lesson/finish',
        params: {
          lessonId: lesson.id, // vrai cuid → finish appelle /lesson/complete
          correct: String(correctCount),
          total: String(scoredTotal),
          durationMs: String(Date.now() - startedAt.current),
        },
      });
      return;
    }
    setIndex((i) => i + 1);
    setPhase('answering');
  };

  // Soumet une réponse écrite au JUDGING SERVEUR (autoritaire). Le serveur
  // décide correct/faux et gère la perte de cœur ; on reflète son verdict.
  const onSubmitWritten = async (st: WrittenStep, optionId: string) => {
    if (judging) return;
    setJudging(true);
    try {
      const res = await answerStep(lesson.id, st.id, { optionId });
      setRevealed(res.bonneReponse ?? null);
      if (res.correct) {
        setCorrectCount((c) => c + 1);
        setPhase('correct');
        correctFeedback();
      } else {
        setPhase('wrong');
        wrongFeedback();
      }
    } catch (e) {
      // OUT_OF_HEARTS (403) ou réseau : on bascule au blocage si plus de cœurs.
      if (e instanceof ApiError && e.status === 403) {
        router.replace('/(app)/lesson/out-of-hearts');
      } else {
        setLoadError(true);
      }
    } finally {
      setJudging(false);
    }
  };

  const onSubmitOrdering = async (st: OrderingStep, positions: number[]) => {
    if (judging) return;
    setJudging(true);
    try {
      const res = await answerStep(lesson.id, st.id, { positions });
      if (res.correct) {
        setCorrectCount((c) => c + 1);
        setPhase('correct');
        correctFeedback();
      } else {
        setPhase('wrong');
        wrongFeedback();
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        router.replace('/(app)/lesson/out-of-hearts');
      } else {
        setLoadError(true);
      }
    } finally {
      setJudging(false);
    }
  };

  // Soumet l'enregistrement d'une étape 'voice' au jugement Whisper serveur.
  // Même sémantique que written : le serveur décide et gère les cœurs.
  const onSubmitVoice = async (st: VoiceStep, audioUri: string) => {
    if (judging) return;
    setJudging(true);
    try {
      const res = await reciteLessonStep(lesson.id, st.id, audioUri);
      if (res.correct) {
        setCorrectCount((c) => c + 1);
        setPhase('correct');
        correctFeedback();
      } else {
        setPhase('wrong');
        wrongFeedback();
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        router.replace('/(app)/lesson/out-of-hearts');
      } else {
        setLoadError(true);
      }
    } finally {
      setJudging(false);
    }
  };

  // "Continuer" après un feedback : si plus de cœurs → écran de blocage.
  const onContinueAfterFeedback = () => {
    const hearts = useUserStore.getState().hearts;
    if (!isPremium && hearts <= 0) {
      router.replace('/(app)/lesson/out-of-hearts');
      return;
    }
    goNext();
  };

  return (
    <View style={styles.screen}>
      <LessonHeader progress={progress} progressColor={phase === 'wrong' ? '#FF4B4B' : '#34C724'} />

      {/* key={index} : re-montage à chaque étape. On évite ici les animations
          de layout reanimated (entering/exiting) qui peuvent provoquer une
          « render error » sur certaines configs New Architecture / Expo Go —
          la transition reste nette, l'étape s'affiche directement. */}
      <View key={index} style={styles.stepWrap}>
        {step.type === 'discovery' && (
          step.mots && step.mots.length > 0
            ? <FullVerseReader step={step} onContinue={goNext} />
            : <DiscoveryView step={step} onContinue={goNext} isFullVerse={step.id.startsWith('disc-full')} />
        )}
        {step.type === 'written' && (
          <WrittenView
            step={step}
            phase={phase}
            judging={judging}
            revealed={revealed}
            onValidate={(optionId) => onSubmitWritten(step, optionId)}
            onContinue={onContinueAfterFeedback}
          />
        )}
        {step.type === 'ordering' && (
          <OrderingView
            step={step}
            phase={phase}
            judging={judging}
            onValidate={(positions) => onSubmitOrdering(step, positions)}
            onContinue={onContinueAfterFeedback}
          />
        )}
        {step.type === 'matching' && (
          <MatchingView step={step} onContinue={goNext} />
        )}
        {step.type === 'voice' && (
          <VoiceView
            step={step}
            phase={phase}
            judging={judging}
            onValidate={(uri) => onSubmitVoice(step, uri)}
            onContinue={onContinueAfterFeedback}
          />
        )}
      </View>
    </View>
  );
}

// ─── Étape VERSET COMPLET — lecteur mot par mot (aucun cœur) ─────────────────
// Affiche tous les mots du verset (tappables) + une auto-lecture qui enchaîne
// les mots avec un surlignage qui suit. Rendu quand le step porte `mots`.
// Vitesses de lecture proposées sous la récitation.
const SPEEDS = [0.5, 0.75, 1, 1.5] as const;

function FullVerseReader({ step, onContinue }: { step: DiscoveryStep; onContinue: () => void }) {
  const mots = step.mots ?? [];
  // Mot en cours de lecture (par position) — surlignage.
  const [playing, setPlaying] = useState<number | null>(null);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const autoRef = useRef(false);

  // Applique la vitesse choisie au moteur audio (player en cours + suivants).
  const changeSpeed = (rate: number) => {
    setSpeed(rate);
    setRemotePlaybackRate(rate);
  };

  const stopAuto = () => {
    autoRef.current = false;
    setAutoPlaying(false);
    setPlaying(null);
    stopRemoteAudio();
  };

  // Coupe toute lecture en quittant l'étape et rétablit la vitesse normale.
  useEffect(() => () => { stopAuto(); setRemotePlaybackRate(1); }, []);

  const playWord = (position: number, url: string | null) => {
    if (!url) return;
    if (autoRef.current) stopAuto();            // un tap reprend la main
    setPlaying(position);
    playRemoteAudio(url);
    setTimeout(() => setPlaying((p) => (p === position ? null : p)), 1500);
  };

  // Enchaîne les mots (avec audio) en déplaçant le surlignage.
  const startAuto = async () => {
    const seq = mots.filter((m) => m.audioUrl);
    if (seq.length === 0) return;
    autoRef.current = true;
    setAutoPlaying(true);
    for (const m of seq) {
      if (!autoRef.current) break;
      setPlaying(m.position);
      await playRemoteAudioAsync(m.audioUrl);
      if (!autoRef.current) break;              // stoppé pendant le mot
    }
    if (autoRef.current) {
      autoRef.current = false;
      setAutoPlaying(false);
      setPlaying(null);
    }
  };

  const toggleAuto = () => { if (autoPlaying) stopAuto(); else startAuto(); };

  return (
    <View style={styles.body}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
          <Feather name="volume-2" size={15} color="#E07A0C" />
          <Text style={[styles.tagText, { color: '#E07A0C' }]}>Verset complet</Text>
        </View>
        <Text style={styles.consigne}>Écoute et répète à voix basse</Text>

        <View style={styles.verseCard}>
          {/* Mots en RTL (droite → gauche), tappables */}
          <View style={readerStyles.wordsRow}>
            {mots.map((m) => {
              const active = playing === m.position;
              return (
                <Pressable
                  key={m.position}
                  onPress={() => playWord(m.position, m.audioUrl)}
                  style={[readerStyles.word, active && readerStyles.wordActive]}
                >
                  <Text style={[readerStyles.wordText, active && readerStyles.wordTextActive]}>{m.texteArabe}</Text>
                </Pressable>
              );
            })}
          </View>
          {!!step.translitteration && <Text style={styles.translit}>{step.translitteration}</Text>}
          {!!step.traduction && <Text style={styles.traduction}>{step.traduction}</Text>}
        </View>

        <Pressable style={[readerStyles.autoBtn, autoPlaying && readerStyles.autoBtnActive]} onPress={toggleAuto}>
          <Feather name={autoPlaying ? 'pause' : 'play'} size={20} color="#fff" />
          <Text style={readerStyles.autoLabel}>
            {autoPlaying ? 'Lecture en cours — appuie pour arrêter' : 'Lecture automatique mot par mot'}
          </Text>
        </Pressable>

        {/* Sélecteur de vitesse — ralentir pour répéter plus facilement. */}
        <View style={readerStyles.speedRow}>
          {SPEEDS.map((s) => {
            const active = speed === s;
            return (
              <Pressable
                key={s}
                onPress={() => changeSpeed(s)}
                style={[readerStyles.speedChip, active && readerStyles.speedChipActive]}
              >
                <Text style={[readerStyles.speedText, active && readerStyles.speedTextActive]}>
                  {`${s}×`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.hint}>Appuie sur un mot, ou lance la lecture automatique 🔊</Text>
      </ScrollView>

      <Footer label="J'ai répété" color="#34C724" colorDark="#2A9E1C" onPress={onContinue} />
    </View>
  );
}

const readerStyles = StyleSheet.create({
  wordsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  word: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  wordActive: { backgroundColor: '#DCF5D6' },
  wordText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 40, color: '#1B2333', lineHeight: 70 },
  wordTextActive: { color: '#2A9E1C' },
  autoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#6B4DFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
    marginTop: 26, width: '100%',
  },
  autoBtnActive: { backgroundColor: '#2A9E1C' },
  autoLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  speedRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  speedChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#EDEDF2', borderWidth: 1.5, borderColor: '#E4E7EC',
  },
  speedChipActive: { backgroundColor: '#EDE8FF', borderColor: '#6B4DFF' },
  speedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#7A828F' },
  speedTextActive: { color: '#6B4DFF' },
});

// ─── Étape DÉCOUVERTE (aucun cœur) ───────────────────────────────────────────
function DiscoveryView({
  step, onContinue, isFullVerse,
}: {
  step: DiscoveryStep;
  onContinue: () => void;
  isFullVerse?: boolean;
}) {
  const [noAudio, setNoAudio] = useState(false);
  const playBtnScale = useSharedValue(1);
  const playBtnAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playBtnScale.value }],
  }));

  return (
    <View style={styles.body}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tag, isFullVerse && { backgroundColor: '#FFF3E0' }]}>
          <Feather name={isFullVerse ? 'volume-2' : 'book-open'} size={15} color={isFullVerse ? '#E07A0C' : '#6B4DFF'} />
          <Text style={[styles.tagText, isFullVerse && { color: '#E07A0C' }]}>
            {isFullVerse ? 'Verset complet' : 'Découverte'}
          </Text>
        </View>

        {isFullVerse && (
          <Text style={styles.consigne}>Écoute et répète à voix basse</Text>
        )}

        <View style={styles.verseCard}>
          <Text style={styles.arabic}>{step.arabe}</Text>
          <Text style={styles.translit}>{step.translitteration}</Text>
          <Text style={styles.traduction}>{step.traduction}</Text>
        </View>

        <AnimatedPressable
          style={[styles.playBtn, playBtnAnimStyle, (!step.audioUrl && !step.ttsText && !step.letterKey) && styles.playBtnDisabled]}
          onPressIn={() => {
            playBtnScale.value = withTiming(0.88, { duration: 80 });
          }}
          onPressOut={() => {
            playBtnScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.back(2)) });
          }}
          onPress={() => {
            const localSrc = getLetterSound(step.letterKey);
            if (localSrc != null) {
              playRemoteAudio(localSrc);
            } else if (step.ttsText) {
              Speech.speak(step.ttsText, { language: 'ar' });
            } else {
              const ok = playRemoteAudio(step.audioUrl);
              if (!ok) setNoAudio(true);
            }
          }}
        >
          <Feather name="volume-2" size={40} color={(step.audioUrl || step.ttsText || step.letterKey) ? '#2A9E1C' : '#9AA0AA'} />
        </AnimatedPressable>
        <Text style={styles.hint}>
          {noAudio
            ? 'Audio indisponible pour cette étape'
            : isFullVerse
              ? 'Appuie pour écouter, puis répète à voix basse'
              : 'Écoute et répète à voix basse'}
        </Text>

        {isFullVerse && (
          <View style={styles.tipRow}>
            <Feather name="info" size={15} color="#6B4DFF" />
            <Text style={styles.tipText}>Pas d'évaluation — concentre-toi sur la prononciation</Text>
          </View>
        )}
      </ScrollView>

      <Footer
        label={isFullVerse ? "J'ai répété" : "J'ai compris"}
        color="#34C724"
        colorDark="#2A9E1C"
        onPress={onContinue}
      />
    </View>
  );
}

// ─── Étape TEST ÉCRIT (QCM) ──────────────────────────────────────────────────
// Le judging est SERVEUR : on n'a pas la bonne réponse en local. `revealed` est
// l'id de la bonne option renvoyé par le serveur APRÈS la réponse (surlignage).
function WrittenView({
  step, phase, judging, revealed, onValidate, onContinue,
}: {
  step: WrittenStep;
  phase: Phase;
  judging: boolean;
  revealed: string | null;
  onValidate: (optionId: string) => void;
  onContinue: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = phase !== 'answering';

  const validate = () => {
    if (picked == null) return;
    onValidate(picked);
  };

  return (
    <View style={styles.body}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
          <Feather name="edit-3" size={15} color="#E07A0C" />
          <Text style={[styles.tagText, { color: '#E07A0C' }]}>Test écrit</Text>
        </View>

        <Text style={styles.consigne}>{step.consigne}</Text>
        <View style={styles.wordCard}>
          <Text style={styles.arabicSmall}>{step.arabe}</Text>
          {!!step.translitteration && <Text style={styles.translit}>{step.translitteration}</Text>}
        </View>

        {step.options.map((o) => {
          const isPicked = picked === o.id;
          // La bonne option n'est connue qu'après réponse (revealed du serveur).
          const isRight = answered && revealed === o.id;
          let tint = styles.optionInactive;
          if (isRight) tint = styles.optionRight;
          else if (answered && isPicked && !isRight) tint = styles.optionWrong;
          else if (isPicked) tint = styles.optionActive;
          return (
            <Pressable
              key={o.id}
              disabled={answered || judging}
              style={[styles.option, tint]}
              onPress={() => setPicked(o.id)}
            >
              <View style={[styles.badge, { backgroundColor: isPicked || isRight ? '#34C724' : '#D7DBE0' }]}>
                <Text style={styles.badgeText}>{o.id}</Text>
              </View>
              <Text style={styles.optionText}>{o.text}</Text>
            </Pressable>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>

      {!answered ? (
        <Footer
          label={judging ? 'Validation…' : 'Valider'}
          color={picked && !judging ? '#34C724' : '#C9CDD4'}
          colorDark={picked && !judging ? '#2A9E1C' : '#B0B5BE'}
          disabled={!picked || judging}
          onPress={validate}
        />
      ) : (
        <FeedbackBar correct={phase === 'correct'} onContinue={onContinue} />
      )}
    </View>
  );
}

// ─── Utilitaire shuffle (initialiseurs useState) ─────────────────────────────
function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ─── Étape REMISE EN ORDRE ─────────────────────────────────────────────────
// Les mots du verset sont présentés dans un ordre aléatoire (banque). L'utilisateur
// les place un à un dans la zone de réponse. Un tap sur un mot placé le renvoie
// dans la banque. Le judging (positions → serveur) coûte un cœur si faux.
function OrderingView({
  step, phase, judging, onValidate, onContinue,
}: {
  step: OrderingStep;
  phase: Phase;
  judging: boolean;
  onValidate: (positions: number[]) => void;
  onContinue: () => void;
}) {
  const [bank, setBank]     = useState(() => shuffleArr([...step.mots]));
  const [placed, setPlaced] = useState<Array<{ position: number; texteArabe: string }>>([]);
  const answered = phase !== 'answering';
  const ready = placed.length === step.mots.length;

  const tapBank = (mot: { position: number; texteArabe: string }) => {
    if (answered || judging) return;
    setBank((b) => b.filter((m) => m.position !== mot.position));
    setPlaced((p) => [...p, mot]);
  };

  const tapPlaced = (mot: { position: number; texteArabe: string }) => {
    if (answered || judging) return;
    setPlaced((p) => p.filter((m) => m.position !== mot.position));
    setBank((b) => [...b, mot]);
  };

  const validate = () => {
    if (!ready || judging) return;
    onValidate(placed.map((m) => m.position));
  };

  return (
    <View style={styles.body}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tag, { backgroundColor: '#E8F4FF' }]}>
          <Feather name="layers" size={15} color="#0070CC" />
          <Text style={[styles.tagText, { color: '#0070CC' }]}>Remise en ordre</Text>
        </View>

        <Text style={styles.consigne}>{step.consigne ?? 'Remets les mots dans le bon ordre'}</Text>

        {/* Zone de réponse (RTL) */}
        <View style={orderStyles.placedZone}>
          {placed.length === 0 ? (
            <Text style={orderStyles.placeholder}>Appuie sur un mot ci-dessous</Text>
          ) : (
            <View style={orderStyles.placedRow}>
              {placed.map((m) => (
                <Pressable
                  key={m.position}
                  disabled={answered}
                  onPress={() => tapPlaced(m)}
                  style={[
                    orderStyles.chip,
                    orderStyles.chipPlaced,
                    answered && phase === 'correct' && orderStyles.chipCorrect,
                    answered && phase === 'wrong'   && orderStyles.chipWrong,
                  ]}
                >
                  <Text style={orderStyles.chipText}>{m.texteArabe}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Banque de mots */}
        <View style={orderStyles.bankRow}>
          {bank.map((m) => (
            <Pressable
              key={m.position}
              disabled={answered || judging}
              onPress={() => tapBank(m)}
              style={orderStyles.chip}
            >
              <Text style={orderStyles.chipText}>{m.texteArabe}</Text>
            </Pressable>
          ))}
        </View>

        {!answered && (
          <Text style={styles.hintSmall}>Tape un mot placé pour le remettre dans la banque</Text>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {!answered ? (
        <Footer
          label={judging ? 'Validation…' : 'Valider'}
          color={ready && !judging ? '#34C724' : '#C9CDD4'}
          colorDark={ready && !judging ? '#2A9E1C' : '#B0B5BE'}
          disabled={!ready || judging}
          onPress={validate}
        />
      ) : (
        <FeedbackBar correct={phase === 'correct'} onContinue={onContinue} />
      )}
    </View>
  );
}

const orderStyles = StyleSheet.create({
  placedZone: {
    width: '100%', minHeight: 80, backgroundColor: '#E6E8ED', borderRadius: 18,
    borderWidth: 2, borderColor: '#D0D3DA', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 16,
  },
  placeholder: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#9AA0AA' },
  placedRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  bankRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#D0D3DA',
  },
  chipPlaced: { backgroundColor: '#EDE8FF', borderColor: '#6B4DFF' },
  chipCorrect: { backgroundColor: '#DEF5E5', borderColor: '#34C724' },
  chipWrong:   { backgroundColor: '#FFE7E7', borderColor: '#FF4B4B' },
  chipText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, color: '#1B2333' },
});

// ─── Étape ASSOCIATION verset ↔ traduction ────────────────────────────────────
// Client-side uniquement : aucun appel serveur, aucun cœur en jeu. L'utilisateur
// relie chaque ligne arabe à sa traduction. Toutes les paires trouvées → Continuer.
function MatchingView({ step, onContinue }: { step: MatchingStep; onContinue: () => void }) {
  const [arabeOrder] = useState(() => shuffleArr([...step.paires]));
  const [tradOrder]  = useState(() => shuffleArr([...step.paires]));
  const [selArabe, setSelArabe] = useState<string | null>(null);
  const [selTrad,  setSelTrad]  = useState<string | null>(null);
  const [matched,  setMatched]  = useState<Set<string>>(new Set());
  const [wrongId,  setWrongId]  = useState<string | null>(null);

  const allMatched = matched.size === step.paires.length;

  const tryMatch = (arabeId: string, tradId: string) => {
    if (arabeId === tradId) {
      setMatched((m) => new Set([...m, arabeId]));
      setSelArabe(null);
      setSelTrad(null);
      correctFeedback();
    } else {
      setWrongId(arabeId);
      wrongFeedback();
      setTimeout(() => { setWrongId(null); setSelArabe(null); setSelTrad(null); }, 700);
    }
  };

  const tapArabe = (id: string) => {
    if (matched.has(id) || wrongId) return;
    const next = selArabe === id ? null : id;
    setSelArabe(next);
    if (next && selTrad) tryMatch(next, selTrad);
  };

  const tapTrad = (id: string) => {
    if (matched.has(id) || wrongId) return;
    const next = selTrad === id ? null : id;
    setSelTrad(next);
    if (selArabe && next) tryMatch(selArabe, next);
  };

  return (
    <View style={styles.body}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tag, { backgroundColor: '#FEF4FF' }]}>
          <Feather name="link" size={15} color="#9C27B0" />
          <Text style={[styles.tagText, { color: '#9C27B0' }]}>Association</Text>
        </View>

        <Text style={styles.consigne}>Relie chaque verset à sa traduction</Text>

        <View style={matchStyles.columns}>
          <View style={matchStyles.col}>
            {arabeOrder.map((p) => {
              const isMatched = matched.has(p.id);
              const isSel  = selArabe === p.id && !isMatched;
              const isWrong = wrongId === p.id;
              return (
                <Pressable
                  key={p.id}
                  disabled={isMatched || !!wrongId}
                  onPress={() => tapArabe(p.id)}
                  style={[
                    matchStyles.card,
                    isMatched && matchStyles.cardMatched,
                    isSel     && matchStyles.cardSelected,
                    isWrong   && matchStyles.cardWrong,
                  ]}
                >
                  <Text style={[matchStyles.arabeText, isMatched && matchStyles.textMatched]}>{p.arabe}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={matchStyles.col}>
            {tradOrder.map((p) => {
              const isMatched = matched.has(p.id);
              const isSel = selTrad === p.id && !isMatched;
              return (
                <Pressable
                  key={p.id}
                  disabled={isMatched || !!wrongId}
                  onPress={() => tapTrad(p.id)}
                  style={[
                    matchStyles.card,
                    isMatched && matchStyles.cardMatched,
                    isSel     && matchStyles.cardSelected,
                  ]}
                >
                  <Text style={[matchStyles.tradText, isMatched && matchStyles.textMatched]}>{p.traduction}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {allMatched && (
          <View style={matchStyles.successBanner}>
            <Feather name="check-circle" size={18} color="#2A9E1C" />
            <Text style={matchStyles.successText}>Toutes les paires trouvées !</Text>
          </View>
        )}
        <Text style={styles.hintSmall}>Appuie sur un verset, puis sur sa traduction</Text>
        <View style={{ height: 20 }} />
      </ScrollView>

      <Footer
        label={allMatched ? 'Continuer' : `${matched.size} / ${step.paires.length} paires`}
        color={allMatched ? '#34C724' : '#C9CDD4'}
        colorDark={allMatched ? '#2A9E1C' : '#B0B5BE'}
        disabled={!allMatched}
        onPress={onContinue}
      />
    </View>
  );
}

const matchStyles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 10, width: '100%', alignItems: 'flex-start' },
  col: { flex: 1, gap: 10 },
  card: {
    borderRadius: 14, padding: 12, backgroundColor: '#fff',
    borderWidth: 2, borderColor: '#E4E7EC', alignItems: 'center',
  },
  cardSelected: { borderColor: '#6B4DFF', backgroundColor: '#EDE8FF' },
  cardMatched:  { borderColor: '#34C724', backgroundColor: '#DEF5E5' },
  cardWrong:    { borderColor: '#FF4B4B', backgroundColor: '#FFE7E7' },
  arabeText: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 26, color: '#1B2333', textAlign: 'center' },
  tradText:  { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#1B2333', textAlign: 'center' },
  textMatched: { color: '#2A9E1C' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  successText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#2A9E1C' },
});

// ─── Étape RÉCITATION (micro → jugement Whisper serveur) ─────────────────────
// L'utilisateur écoute la référence (si dispo), s'enregistre au micro
// (expo-audio), réécoute s'il veut, puis valide → l'audio part au serveur qui
// transcrit et juge. Faux = −1 cœur (géré serveur), comme un test écrit.
type RecState = 'idle' | 'recording' | 'recorded';

function VoiceView({
  step, phase, judging, onValidate, onContinue,
}: {
  step: VoiceStep;
  phase: Phase;
  judging: boolean;
  onValidate: (audioUri: string) => void;
  onContinue: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recState, setRecState] = useState<RecState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [micDenied, setMicDenied] = useState(false);
  const answered = phase !== 'answering';

  // Sécurité : couper l'enregistrement et rétablir le mode lecture en sortie.
  useEffect(() => () => {
    if (recorder.isRecording) recorder.stop().catch(() => {});
    exitRecordingMode();
  }, []);

  const startRecording = async () => {
    const granted = await ensureMicPermission();
    if (!granted) { setMicDenied(true); return; }
    setMicDenied(false);
    stopRemoteAudio(); // coupe la référence si elle joue encore
    await enterRecordingMode();
    await recorder.prepareToRecordAsync();
    recorder.record();
    setAudioUri(null);
    setRecState('recording');
  };

  const stopRecording = async () => {
    await recorder.stop();
    await exitRecordingMode();
    setAudioUri(recorder.uri);
    setRecState('recorded');
  };

  const toggleRecording = () => {
    if (judging || answered) return;
    if (recState === 'recording') stopRecording();
    else startRecording();
  };

  const recording = recState === 'recording';
  const ready = recState === 'recorded' && !!audioUri;

  return (
    <View style={styles.body}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.tag, { backgroundColor: '#FFE8F0' }]}>
          <Feather name="mic" size={15} color="#E0398B" />
          <Text style={[styles.tagText, { color: '#E0398B' }]}>Récitation</Text>
        </View>

        <Text style={styles.consigne}>{step.consigne ?? 'Récite ce verset à voix haute'}</Text>

        <View style={styles.verseCard}>
          <Text style={styles.arabic}>{step.arabe}</Text>
          {!!step.translitteration && <Text style={styles.translit}>{step.translitteration}</Text>}
          {!!step.traduction && <Text style={styles.traduction}>{step.traduction}</Text>}
        </View>

        {/* Écouter la référence avant de s'enregistrer */}
        {!!step.audioUrl && !recording && (
          <Pressable style={voiceStyles.refBtn} onPress={() => playRemoteAudio(step.audioUrl)}>
            <Feather name="volume-2" size={18} color="#6B4DFF" />
            <Text style={voiceStyles.refLabel}>Écouter la récitation</Text>
          </Pressable>
        )}

        {/* Bouton micro (toggle enregistrer / arrêter) */}
        <Pressable
          style={[voiceStyles.micBtn, recording && voiceStyles.micBtnRecording]}
          onPress={toggleRecording}
          disabled={judging || answered}
        >
          <Feather name={recording ? 'square' : 'mic'} size={38} color="#fff" />
        </Pressable>
        <Text style={styles.hint}>
          {micDenied
            ? 'Autorise le micro dans les réglages pour réciter'
            : recording
              ? 'Enregistrement… appuie pour arrêter'
              : ready
                ? 'Enregistré ! Valide, ou recommence'
                : 'Appuie sur le micro et récite'}
        </Text>

        {/* Réécouter son enregistrement avant de valider */}
        {ready && !answered && (
          <Pressable style={voiceStyles.refBtn} onPress={() => playRemoteAudio(audioUri)}>
            <Feather name="play" size={18} color="#6B4DFF" />
            <Text style={voiceStyles.refLabel}>Réécouter mon enregistrement</Text>
          </Pressable>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {!answered ? (
        <Footer
          label={judging ? 'Analyse de ta récitation…' : 'Valider'}
          color={ready && !judging ? '#34C724' : '#C9CDD4'}
          colorDark={ready && !judging ? '#2A9E1C' : '#B0B5BE'}
          disabled={!ready || judging}
          onPress={() => { if (audioUri) onValidate(audioUri); }}
        />
      ) : (
        <FeedbackBar correct={phase === 'correct'} onContinue={onContinue} />
      )}
    </View>
  );
}

const voiceStyles = StyleSheet.create({
  micBtn: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#E0398B',
    alignItems: 'center', justifyContent: 'center', marginTop: 26,
    borderBottomWidth: 6, borderBottomColor: '#B02268',
  },
  micBtnRecording: { backgroundColor: '#FF4B4B', borderBottomColor: '#D43A3A' },
  refBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16,
    backgroundColor: '#EDE8FF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10,
  },
  refLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
});

// ─── Barre de feedback (correct / faux) ──────────────────────────────────────
function FeedbackBar({ correct, onContinue }: { correct: boolean; onContinue: () => void }) {
  return (
    <View style={[styles.feedbackBar, { backgroundColor: correct ? '#DEF5E5' : '#FFE7E7' }]}>
      <Text style={[styles.feedbackTitle, { color: correct ? '#2A9E1C' : '#E03434' }]}>
        {correct ? '✓ Correct !' : '✕ Pas tout à fait'}
      </Text>
      <Text style={[styles.feedbackSub, { color: correct ? '#3C7A30' : '#C53A3A' }]}>
        {correct ? 'Bien joué, continue !' : 'Tu as perdu un cœur. Continue !'}
      </Text>
      <Pressable
        style={[styles.footerBtn, { backgroundColor: correct ? '#34C724' : '#FF4B4B', borderBottomColor: correct ? '#2A9E1C' : '#D43A3A' }]}
        onPress={onContinue}
      >
        <Text style={styles.footerLabel}>Continuer</Text>
      </Pressable>
    </View>
  );
}

// ─── Pied de page bouton plein ───────────────────────────────────────────────
function Footer({
  label, color, colorDark, onPress, disabled,
}: {
  label: string; color: string; colorDark: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <View style={styles.footer}>
      <Pressable
        style={[styles.footerBtn, { backgroundColor: color, borderBottomColor: colorDark }]}
        disabled={disabled}
        onPress={onPress}
      >
        <Text style={styles.footerLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#7A828F', textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  stepWrap: { flex: 1 },
  body: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 12, alignItems: 'center' },

  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EDE8FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 18 },
  tagText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#6B4DFF' },

  verseCard: { width: '100%', backgroundColor: '#E6E8ED', borderRadius: 22, paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center' },
  arabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 44, color: '#1B2333', lineHeight: 76, textAlign: 'center', writingDirection: 'rtl' },
  arabicSmall: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 40, color: '#1B2333' },
  translit: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#6B4DFF', marginTop: 8 },
  traduction: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 8, textAlign: 'center' },

  playBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DCF5D6', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  playBtnDisabled: { backgroundColor: '#ECEEF1' },
  hint: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#7A828F', marginTop: 14 },
  hintSmall: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#9AA0AA', marginTop: 14, textAlign: 'center' },

  consigne: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333', textAlign: 'center', marginBottom: 14 },
  wordCard: { width: '100%', backgroundColor: '#E6E8ED', borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 16 },
  option: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, marginBottom: 12 },
  optionInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E4E7EC' },
  optionActive: { backgroundColor: '#E7F8E4', borderWidth: 3, borderColor: '#34C724' },
  optionRight: { backgroundColor: '#DEF5E5', borderWidth: 3, borderColor: '#34C724' },
  optionWrong: { backgroundColor: '#FFE7E7', borderWidth: 3, borderColor: '#FF4B4B' },
  badge: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  optionText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },

  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 4 },
  tipText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#6B4DFF', flex: 1 },

  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30 },
  footerBtn: { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
  footerLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },

  feedbackBar: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 30, borderTopWidth: 3, borderTopColor: 'rgba(0,0,0,0.06)' },
  feedbackTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24 },
  feedbackSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#C53A3A', marginTop: 2, marginBottom: 12 },
});
