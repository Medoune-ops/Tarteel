import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Animated, { SlideInRight, SlideOutLeft, Easing } from 'react-native-reanimated';
import LessonHeader from '../../../components/LessonHeader';
import { useUserStore } from '../../../store/userStore';
import {
  buildSampleLesson,
  type LessonStep,
  type DiscoveryStep,
  type WrittenStep,
} from '../../../constants/lessonEngine';

type Phase = 'answering' | 'correct' | 'wrong';

export default function LessonPlayScreen() {
  const router = useRouter();
  const loseHeart = useUserStore((s) => s.loseHeart);
  const isPremium = useUserStore((s) => s.isPremium);
  const addXP = useUserStore((s) => s.addXP);

  // ⚠️ Plus tard : remplacer par le fetch GET /lessons/:id.
  const lesson = useMemo(() => buildSampleLesson(), []);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [correctCount, setCorrectCount] = useState(0);

  const step = lesson.steps[index];
  const total = lesson.steps.length;
  const progress = index / total;

  // Passe à l'étape suivante, ou termine la leçon.
  const goNext = () => {
    if (index + 1 >= total) {
      addXP(15 + correctCount * 2);
      router.replace('/(app)/lesson/finish');
      return;
    }
    setIndex((i) => i + 1);
    setPhase('answering');
  };

  // Résultat d'une étape de test (written / voice).
  const onTestResult = (success: boolean) => {
    if (success) {
      setCorrectCount((c) => c + 1);
      setPhase('correct');
      return;
    }
    // Échec → on perd un cœur (sauf premium).
    const left = loseHeart();
    setPhase('wrong');
    if (!isPremium && left === 0) {
      // On laisse l'utilisateur voir le feedback, puis blocage au "Continuer".
    }
  };

  // "Continuer" après un feedback : si plus de cœurs → écran de blocage.
  const onContinueAfterFeedback = () => {
    const hearts = useUserStore.getState().hearts;
    if (!isPremium && hearts === 0) {
      router.replace('/(app)/lesson/out-of-hearts');
      return;
    }
    goNext();
  };

  return (
    <View style={styles.screen}>
      <LessonHeader progress={progress} progressColor={phase === 'wrong' ? '#FF4B4B' : '#34C724'} />

      {/* La key={index} force le re-montage à chaque étape → déclenche le glissement. */}
      <Animated.View
        key={index}
        style={styles.stepWrap}
        entering={SlideInRight.duration(280).easing(Easing.out(Easing.cubic))}
        exiting={SlideOutLeft.duration(220).easing(Easing.in(Easing.cubic))}
      >
        {step.type === 'discovery' && (
          <DiscoveryView
            step={step}
            onContinue={goNext}
            isFullVerse={step.id.startsWith('disc-full')}
          />
        )}
        {step.type === 'written' && (
          <WrittenView
            step={step}
            phase={phase}
            onValidate={onTestResult}
            onContinue={onContinueAfterFeedback}
          />
        )}
      </Animated.View>
    </View>
  );
}

// ─── Étape DÉCOUVERTE (aucun cœur) ───────────────────────────────────────────
function DiscoveryView({
  step, onContinue, isFullVerse,
}: {
  step: DiscoveryStep;
  onContinue: () => void;
  isFullVerse?: boolean;
}) {
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

        <Pressable style={styles.playBtn}>
          <Feather name="volume-2" size={40} color="#2A9E1C" />
        </Pressable>
        <Text style={styles.hint}>
          {isFullVerse ? 'Appuie pour écouter, puis répète à voix basse' : 'Écoute et répète à voix basse'}
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
function WrittenView({
  step, phase, onValidate, onContinue,
}: {
  step: WrittenStep;
  phase: Phase;
  onValidate: (success: boolean) => void;
  onContinue: () => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const answered = phase !== 'answering';

  const validate = () => {
    if (picked == null) return;
    onValidate(picked === step.bonneReponse);
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
          const isRight = o.id === step.bonneReponse;
          let tint = styles.optionInactive;
          if (answered && isRight) tint = styles.optionRight;
          else if (answered && isPicked && !isRight) tint = styles.optionWrong;
          else if (isPicked) tint = styles.optionActive;
          return (
            <Pressable
              key={o.id}
              disabled={answered}
              style={[styles.option, tint]}
              onPress={() => setPicked(o.id)}
            >
              <View style={[styles.badge, { backgroundColor: isPicked || (answered && isRight) ? '#34C724' : '#D7DBE0' }]}>
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
          label="Valider"
          color={picked ? '#34C724' : '#C9CDD4'}
          colorDark={picked ? '#2A9E1C' : '#B0B5BE'}
          disabled={!picked}
          onPress={validate}
        />
      ) : (
        <FeedbackBar correct={phase === 'correct'} onContinue={onContinue} />
      )}
    </View>
  );
}

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
