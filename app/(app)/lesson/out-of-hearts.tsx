import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Otter from '../../../components/Otter';
import { useUserStore } from '../../../store/userStore';
import { useAppConfigStore } from '../../../store/appConfigStore';
import { refillHeartsWithGems } from '../../../lib/api/gems';
import { ApiError } from '../../../lib/api/client';
import { useT, t } from '../../../lib/i18n';

/** Coût serveur d'un refill complet (source de vérité : backend, 350 gemmes). */
const REFILL_COST = 350;

/** Formate un nombre de ms en "Xh Ymin". */
function formatRemaining(ms: number): string {
  if (ms <= 0) return t('common.soon');
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}min`;
  return `${m} min`;
}

export default function OutOfHeartsScreen() {
  const router = useRouter();
  const syncHearts = useUserStore((s) => s.syncHearts);
  const msUntilNextHeart = useUserStore((s) => s.msUntilNextHeart);
  const hearts = useUserStore((s) => s.hearts);
  const gems = useUserStore((s) => s.gems);
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);

  const [remaining, setRemaining] = useState(msUntilNextHeart());
  const [refilling, setRefilling] = useState(false);
  const tr = useT();

  // Tic chaque seconde : met à jour le compte à rebours et régénère si besoin.
  useEffect(() => {
    const id = setInterval(() => {
      syncHearts();
      setRemaining(useUserStore.getState().msUntilNextHeart());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Dès qu'un cœur est régénéré, on peut repartir.
  useEffect(() => {
    if (hearts > 0) router.replace('/(app)/(tabs)/parcours');
  }, [hearts]);

  /** Porte n°3 : refill instantané contre gemmes (débit jugé côté serveur). */
  const onRefill = async () => {
    if (refilling) return;
    setRefilling(true);
    try {
      await refillHeartsWithGems();
      router.replace('/(app)/(tabs)/parcours');
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'INSUFFICIENT_GEMS'
          ? t('hearts.refillFailInsufficient', { n: REFILL_COST })
          : t('hearts.refillFailGeneric');
      Alert.alert(t('hearts.refillFailTitle'), msg);
    } finally {
      setRefilling(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Pressable style={styles.close} onPress={() => router.replace('/(app)/(tabs)/parcours')} hitSlop={10}>
        <Feather name="x" size={26} color="#9AA0AA" />
      </Pressable>

      <View style={styles.otterWrap}>
        <Otter size={104} />
        <View style={styles.brokenHeart}>
          <Text style={{ fontSize: 30 }}>💔</Text>
        </View>
      </View>

      <Text style={styles.title}>{tr('hearts.title')}</Text>

      {/* Porte n°1 — Réviser pour regagner (gratuit, toujours en premier). */}
      <Pressable
        style={styles.reviewBtn}
        onPress={() => router.replace({ pathname: '/(app)/(tabs)/revisions', params: { regagner: '1' } })}
      >
        <Text style={{ fontSize: 22 }}>📖</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewLabel}>{tr('hearts.reviewTitle')}</Text>
          <Text style={styles.reviewHint}>{tr('hearts.reviewHint')}</Text>
        </View>
        <Feather name="chevron-right" size={22} color="#2E7D32" />
      </Pressable>

      {/* Porte n°2 — Attendre (compte à rebours). */}
      <View style={styles.timerCard}>
        <Feather name="clock" size={22} color="#FF4B4B" />
        <View>
          <Text style={styles.timerLabel}>{tr('hearts.nextIn')}</Text>
          <Text style={styles.timerValue}>{formatRemaining(remaining)}</Text>
        </View>
      </View>

      {/* Porte n°3 — Refill gemmes. */}
      <Pressable style={[styles.gemBtn, refilling && { opacity: 0.6 }]} onPress={onRefill} disabled={refilling}>
        {refilling ? (
          <ActivityIndicator color="#1CB0F6" />
        ) : (
          <>
            <Text style={{ fontSize: 22 }}>💎</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.gemLabel}>{tr('hearts.refillTitle')}</Text>
              <Text style={styles.gemHint}>{tr('hearts.balance', { n: gems })}</Text>
            </View>
            <Text style={styles.gemCost}>{REFILL_COST}</Text>
          </>
        )}
      </Pressable>

      <View style={{ flex: 1 }} />

      {/* Porte n°4 — Premium (CTA doux, jamais agressif). Masqué si les
          paiements sont désactivés (ex: revue store en cours). */}
      {paymentsEnabled && (
        <Pressable onPress={() => router.replace('/(app)/subscription')} style={{ width: '100%' }}>
          <LinearGradient colors={['#FFA53D', '#F0820C']} style={styles.premiumCta}>
            <Feather name="star" size={20} color="#fff" />
            <Text style={styles.premiumLabel}>{tr('hearts.premiumCta')}</Text>
          </LinearGradient>
        </Pressable>
      )}

      <Pressable style={styles.waitBtn} onPress={() => router.replace('/(app)/(tabs)/parcours')}>
        <Text style={styles.waitLabel}>{tr('hearts.wait')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 28, paddingTop: 78, paddingBottom: 36, alignItems: 'center' },
  close: { position: 'absolute', top: 54, right: 24 },
  otterWrap: { alignItems: 'center', justifyContent: 'center' },
  brokenHeart: { position: 'absolute', bottom: -6, right: -10 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333', marginTop: 14, marginBottom: 18 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%',
    backgroundColor: '#EAF9EA', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: '#BCE5BD',
  },
  reviewLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#2E7D32' },
  reviewHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#4E8B52' },
  timerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%',
    backgroundColor: '#FFF0F0', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, marginTop: 12,
    borderWidth: 1.5, borderColor: '#FFD9D9',
  },
  timerLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#C53A3A' },
  timerValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#FF4B4B' },
  gemBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%',
    backgroundColor: '#EAF6FF', borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20, marginTop: 12,
    borderWidth: 1.5, borderColor: '#BFE3FB', minHeight: 72, justifyContent: 'center',
  },
  gemLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#1077B4' },
  gemHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#4A94C4' },
  gemCost: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#1CB0F6' },
  premiumCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 60, borderRadius: 18, borderBottomWidth: 4, borderBottomColor: '#C56400',
  },
  premiumLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  waitBtn: { paddingVertical: 16, marginTop: 6 },
  waitLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#8A8F99' },
});
