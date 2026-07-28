import { useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay,
  Easing, FadeInDown,
} from 'react-native-reanimated';
import Confetti from './Confetti';
import { playSound } from '../constants/sounds';
import { useGiftModalStore, type GiftKind } from '../store/giftModalStore';
import { useT } from '../lib/i18n';

const GIFT_META: Record<GiftKind, { emoji: string; labelKey: 'gift.hearts' | 'gift.gems' | 'gift.premium' | 'gift.xp' }> = {
  hearts: { emoji: '❤️', labelKey: 'gift.hearts' },
  gems: { emoji: '💎', labelKey: 'gift.gems' },
  premium: { emoji: '👑', labelKey: 'gift.premium' },
  xp: { emoji: '⚡', labelKey: 'gift.xp' },
};

/**
 * Modale plein écran affichée quand un admin offre cœurs/gemmes/premium depuis
 * le back-office : le cadeau 🎁 grossit puis "explose" (scale-out rapide),
 * l'icône du don en sort en grandissant, confettis + son. Montée une fois dans
 * app/(app)/_layout.tsx — le listener de notification push y appelle
 * useGiftModalStore.getState().show(kind, amount) à la réception d'un push
 * `{ type: 'admin_grant' }`. Les compteurs (cœurs/gemmes/premium) affichés
 * ailleurs se mettent à jour tout seuls via hydrateFromBackend() (Zustand
 * réactif), pas besoin de rafraîchir manuellement.
 */
export default function GiftModal() {
  const tr = useT();
  const { visible, kind, amount, burstKey, hide } = useGiftModalStore();

  const boxScale = useSharedValue(0);
  const boxOpacity = useSharedValue(1);
  const giftScale = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    boxScale.value = 0;
    boxOpacity.value = 1;
    giftScale.value = 0;

    // Le cadeau grossit puis "explose" (scale-out rapide + fade).
    boxScale.value = withSequence(
      withSpring(1.15, { damping: 6, stiffness: 160, mass: 0.6 }),
      withTiming(1.4, { duration: 160, easing: Easing.in(Easing.quad) }),
    );
    boxOpacity.value = withDelay(360, withTiming(0, { duration: 140 }));

    // Ce qui sort de l'explosion : l'icône du don, avec un pop à ressort.
    giftScale.value = withDelay(
      420,
      withSpring(1, { damping: 7, stiffness: 150, mass: 0.7 }),
    );

    playSound('finish');
  }, [visible, burstKey]);

  const boxStyle = useAnimatedStyle(() => ({
    opacity: boxOpacity.value,
    transform: [{ scale: boxScale.value }],
  }));
  const giftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: giftScale.value }],
  }));

  if (!kind || amount == null) return null;
  const meta = GIFT_META[kind];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <View style={styles.backdrop}>
        <Confetti burstKey={burstKey} count={56} />

        <Animated.Text style={[styles.box, boxStyle]}>🎁</Animated.Text>

        <Animated.View style={[styles.result, giftStyle]}>
          <Text style={styles.resultEmoji}>{meta.emoji}</Text>
          <Text style={styles.amount}>
            {kind === 'premium' ? tr('gift.premium') : tr(meta.labelKey, { n: amount })}
          </Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(700).springify()} style={styles.title}>
          {tr('gift.title')}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(850).springify()}>
          <Pressable style={styles.continueBtn} onPress={hide}>
            <Feather name="check" size={20} color="#fff" />
            <Text style={styles.continueText}>{tr('gift.continue')}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,10,40,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  box: {
    position: 'absolute',
    fontSize: 90,
  },
  result: {
    alignItems: 'center',
    gap: 8,
  },
  resultEmoji: {
    fontSize: 72,
  },
  amount: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 26,
    color: '#fff',
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 20,
    color: '#fff',
    marginTop: 28,
    textAlign: 'center',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#34C724',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 24,
  },
  continueText: {
    fontFamily: 'Baloo2_800ExtraBold',
    fontSize: 16,
    color: '#fff',
  },
});
