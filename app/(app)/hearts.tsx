import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { useUserStore, MAX_HEARTS } from '../../store/userStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { refillHeartsWithGems } from '../../lib/api/gems';
import { buyHearts, type CheckoutSession } from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { useT, t } from '../../lib/i18n';

/** Coût serveur d'un refill complet en gemmes (source de vérité : backend). */
const REFILL_GEM_COST = 350;

/** Formate un nombre de ms en "Xh Ymin" / "Y min". */
function formatRemaining(ms: number): string {
  if (ms <= 0) return t('heartsPage.soon');
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return t('heartsPage.remainingHM', { h, m: m.toString().padStart(2, '0') });
  return t('heartsPage.remainingM', { m });
}

function OptionCard({
  emoji, title, hint, cta, tint, onPress, disabled, loading, cardBg, textColor,
}: {
  emoji: string; title: string; hint: string; cta?: string; tint: string;
  onPress: () => void; disabled?: boolean; loading?: boolean; cardBg: string; textColor: string;
}) {
  return (
    <Pressable
      style={[styles.card, { backgroundColor: cardBg, borderColor: tint + '55' }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={[styles.cardIcon, { backgroundColor: tint + '1A' }]}>
        <Text style={{ fontSize: 24 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
        <Text style={styles.cardHint}>{hint}</Text>
      </View>
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : cta ? (
        <View style={[styles.cardCta, { backgroundColor: tint }]}>
          <Text style={styles.cardCtaText}>{cta}</Text>
        </View>
      ) : (
        <Feather name="chevron-right" size={22} color={tint} />
      )}
    </Pressable>
  );
}

export default function HeartsScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const hearts = useUserStore((s) => s.hearts);
  const gems = useUserStore((s) => s.gems);
  const isPremium = useUserStore((s) => s.isPremium);
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);
  const syncHearts = useUserStore((s) => s.syncHearts);
  const msUntilNextHeart = useUserStore((s) => s.msUntilNextHeart);

  const [remaining, setRemaining] = useState(msUntilNextHeart());
  const [refilling, setRefilling] = useState(false);
  const [buying, setBuying] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const full = hearts >= MAX_HEARTS;

  useEffect(() => {
    const id = setInterval(() => {
      syncHearts();
      setRemaining(useUserStore.getState().msUntilNextHeart());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /** Convertir des gemmes en cœurs (débit jugé côté serveur). */
  const onRefillGems = async () => {
    if (refilling || full) return;
    setRefilling(true);
    try {
      await refillHeartsWithGems();
      Alert.alert(tr('heartsPage.refillOkTitle'), tr('heartsPage.refillOkMsg'));
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'INSUFFICIENT_GEMS'
          ? tr('heartsPage.refillFailInsufficient', { n: REFILL_GEM_COST })
          : tr('heartsPage.refillFailGeneric');
      Alert.alert(tr('heartsPage.oops'), msg);
    } finally {
      setRefilling(false);
    }
  };

  /** Acheter un refill complet avec de l'argent — ouvre le checkout DexPay (carte). */
  const onBuyMoney = async () => {
    if (buying || full) return;
    setBuying(true);
    try {
      const s = await buyHearts();
      setSession(s);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status !== 0
          ? e.message
          : tr('heartsPage.paymentFailed');
      Alert.alert(tr('heartsPage.paymentTitle'), msg);
    } finally {
      setBuying(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      {/* Header */}
      <LinearGradient colors={['#FF6B6B', '#FF4B4B']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.heartBig}>
          <Feather name="heart" size={40} color="#fff" />
          <Text style={styles.heartCount}>{isPremium ? '∞' : `${hearts}/${MAX_HEARTS}`}</Text>
        </View>
        <Text style={styles.headerTitle}>{tr('heartsPage.title')}</Text>
        <Text style={styles.headerSub}>
          {isPremium
            ? tr('heartsPage.premiumSub')
            : full
              ? tr('heartsPage.fullSub')
              : tr('heartsPage.nextIn', { time: formatRemaining(remaining) })}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {isPremium ? (
          <View style={styles.premiumNote}>
            <Text style={{ fontSize: 40 }}>💫</Text>
            <Text style={[styles.premiumTitle, { color: T.text }]}>{tr('heartsPage.youArePremium')}</Text>
            <Text style={styles.premiumHint}>{tr('heartsPage.premiumHint')}</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('heartsPage.getHearts')}</Text>

            <OptionCard
              emoji="💎" tint="#1CB0F6" cardBg={T.cardBg} textColor={T.text}
              title={tr('heartsPage.convertGems')}
              hint={tr('heartsPage.convertGemsHint', { n: REFILL_GEM_COST, gems })}
              cta={String(REFILL_GEM_COST)}
              onPress={onRefillGems}
              loading={refilling}
              disabled={full || gems < REFILL_GEM_COST}
            />

            {/* Achat avec argent réel — masqué si les paiements sont
                désactivés (ex: revue store en cours). */}
            {paymentsEnabled && (
              <OptionCard
                emoji="💳" tint="#F0820C" cardBg={T.cardBg} textColor={T.text}
                title={tr('heartsPage.buyWithMoney')}
                hint={tr('heartsPage.buyWithMoneyHint')}
                cta={tr('heartsPage.buy')}
                onPress={onBuyMoney}
                loading={buying}
                disabled={full}
              />
            )}

            <OptionCard
              emoji="📖" tint="#34C724" cardBg={T.cardBg} textColor={T.text}
              title={tr('heartsPage.reviewForHearts')}
              hint={tr('heartsPage.reviewForHeartsHint')}
              onPress={() => router.push({ pathname: '/(app)/(tabs)/revisions', params: { regagner: '1' } })}
              disabled={full}
            />

            <OptionCard
              emoji="👥" tint="#6B4DFF" cardBg={T.cardBg} textColor={T.text}
              title={tr('heartsPage.referFriends')}
              hint={tr('heartsPage.referFriendsHint')}
              onPress={() => router.push('/(app)/referral')}
            />

            {paymentsEnabled && (
              <Pressable onPress={() => router.push('/(app)/subscription')} style={styles.premiumCtaWrap}>
                <LinearGradient colors={['#FFA53D', '#F0820C']} style={styles.premiumCta}>
                  <Feather name="star" size={18} color="#fff" />
                  <Text style={styles.premiumCtaText}>{tr('heartsPage.goPremium')}</Text>
                </LinearGradient>
              </Pressable>
            )}
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {session && (
        <DexPayCheckout
          visible
          paymentUrl={session.paymentUrl}
          reference={session.reference}
          onDone={(outcome) => {
            setSession(null);
            if (outcome === 'success') Alert.alert(tr('heartsPage.buyOkTitle'), tr('heartsPage.buyOkMsg'));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 26, paddingHorizontal: 22, alignItems: 'center' },
  back: { position: 'absolute', top: 16, left: 18, padding: 4, zIndex: 2 },
  heartBig: { alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  heartCount: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff', marginTop: 6 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', marginTop: 8 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  body: { padding: 18 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 12, marginTop: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  cardHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#8A8F99', marginTop: 3 },
  cardCta: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  cardCtaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
  premiumCtaWrap: { marginTop: 8 },
  premiumCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    height: 56, borderRadius: 18, borderBottomWidth: 4, borderBottomColor: '#C56400',
  },
  premiumCtaText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#fff' },
  premiumNote: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  premiumTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22 },
  premiumHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', textAlign: 'center', paddingHorizontal: 30 },
});
