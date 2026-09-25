import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Otter from './Otter';
import { useReviewPromptStore } from '../store/reviewPromptStore';
import { requestStoreReview } from '../lib/storeReview';
import { useT } from '../lib/i18n';

/** Étapes de la modale : la question, puis la branche selon la réponse. */
type Step = 'ask' | 'thanks' | 'feedback';

/**
 * Pré-question de notation : « Tu aimes Tarteel ? ». La popup NATIVE de
 * notation n'est déclenchée que sur une réponse positive ; un « pas trop »
 * redirige vers le support plutôt que vers le store.
 *
 * Montée une fois dans app/(app)/_layout.tsx, comme GiftModal — l'appelant
 * (écran de fin de leçon) ne fait que `show()` après avoir vérifié
 * `canPrompt()`, il n'a aucune UI à porter.
 *
 * ⚠️ Apple interdit de déclencher `requestReview()` depuis un bouton
 * explicitement libellé « Noter l'app ». Ici le bouton de l'étape `thanks`
 * conclut un dialogue que l'app a initié, ce qui est le motif toléré ; ne pas
 * réutiliser `requestStoreReview()` derrière une entrée de menu Réglages —
 * utiliser `StoreReview.storeUrl()` dans ce cas.
 */
export default function ReviewPromptModal() {
  const tr = useT();
  const router = useRouter();
  const { visible, hide, markRated, markDeclined } = useReviewPromptStore();
  const [step, setStep] = useState<Step>('ask');

  // Réinitialise l'étape à chaque ouverture, sinon une réouverture repartirait
  // sur l'écran de remerciement de la fois précédente.
  useEffect(() => {
    if (visible) setStep('ask');
  }, [visible]);

  const onYes = () => setStep('thanks');
  const onNo = () => setStep('feedback');

  const onRate = async () => {
    // markRated() AVANT l'appel natif : on ne saura jamais si la popup s'est
    // affichée ni si la note a été laissée, et quelqu'un qui a dit « oui » puis
    // cliqué « Noter » a fait sa part — le redemander serait du harcèlement.
    markRated();
    await requestStoreReview();
  };

  const onFeedback = () => {
    markDeclined();
    router.push('/(app)/support');
  };

  const content = {
    ask: {
      title: tr('review.title'),
      sub: tr('review.sub'),
      primary: { label: tr('review.yes'), onPress: onYes },
      secondary: { label: tr('review.no'), onPress: onNo },
    },
    thanks: {
      title: tr('review.thanksTitle'),
      sub: tr('review.thanksSub'),
      primary: { label: tr('review.rate'), onPress: onRate },
      secondary: { label: tr('review.later'), onPress: markDeclined },
    },
    feedback: {
      title: tr('review.feedbackTitle'),
      sub: tr('review.feedbackSub'),
      primary: { label: tr('review.feedbackCta'), onPress: onFeedback },
      secondary: { label: tr('review.later'), onPress: markDeclined },
    },
  }[step];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeInDown.springify()} style={styles.card}>
          <Otter size={92} />

          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.sub}>{content.sub}</Text>

          <Pressable style={styles.primaryBtn} onPress={content.primary.onPress}>
            <Text style={styles.primaryLabel}>{content.primary.label}</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={content.secondary.onPress}>
            <Text style={styles.secondaryLabel}>{content.secondary.label}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,10,40,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 24,
    color: '#1B2333',
    textAlign: 'center',
    marginTop: 12,
  },
  sub: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: '#8A8F99',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  primaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#6B4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  primaryLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: '#fff' },
  secondaryBtn: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  secondaryLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#8A8F99' },
});
