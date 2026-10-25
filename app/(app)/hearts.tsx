import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import DeviceStatusBar from '../../components/StatusBar';
import { HeartIcon, GemIcon, FreezeIcon } from '../../components/IslamicIcons';
import { useTheme } from '../../utils/useTheme';
import { useUserStore, MAX_HEARTS, HEART_REGEN_MS } from '../../store/userStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { refillHeartsWithGems } from '../../lib/api/gems';
import { buyHearts, type CheckoutSession } from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { askPaymentProvider } from '../../utils/askPaymentProvider';
import { useT, t } from '../../lib/i18n';

/** Formate un nombre de ms en "Xh Ymin" / "Y min". */
function formatRemaining(ms: number): string {
  if (ms <= 0) return t('heartsPage.soon');
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return t('heartsPage.remainingHM', { h, m: m.toString().padStart(2, '0') });
  return t('heartsPage.remainingM', { m });
}

/** Rayon de l'anneau de recharge autour d'un slot de cœur. */
const SLOT_R = 20;
const SLOT_C = 2 * Math.PI * SLOT_R;

/**
 * Cœur du héros : il bat, et se remplit à hauteur du nombre de cœurs restants.
 *
 *  Le remplissage est un cœur blanc rogné par un conteneur dont on anime la
 *  hauteur — un `scaleY` déformerait le tracé au lieu de le découvrir, et une
 *  jauge rectangulaire par-dessus laisserait des angles droits visibles aux
 *  bords du cœur.
 */
function HeroHeart({ hearts, isPremium }: { hearts: number; isPremium: boolean }) {
  const battement = useSharedValue(0);
  // 7 % de marge basse : la pointe du cœur est si fine qu'un remplissage
  // partant de 0 n'y est pas visible du tout.
  const cible = isPremium ? 1 : (hearts / MAX_HEARTS) * 0.86 + 0.07;
  const remplissage = useSharedValue(cible);

  useEffect(() => {
    battement.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 190, easing: Easing.out(Easing.quad) }),
        withTiming(0.2, { duration: 180, easing: Easing.in(Easing.quad) }),
        withTiming(0.7, { duration: 170, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 680, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, []);

  useEffect(() => {
    remplissage.value = withSpring(cible, { damping: 16, stiffness: 90 });
  }, [cible]);

  const styleBattement = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + battement.value * 0.08 }],
  }));

  const styleRemplissage = useAnimatedStyle(() => ({
    height: `${remplissage.value * 100}%`,
  }));

  return (
    <Animated.View style={[styles.heroHeart, styleBattement]}>
      {/* Creux : le cœur vide, très pâle. */}
      <HeartIcon size={150} color="rgba(255,255,255,0.22)" glare={false} />
      {/* Remplissage, ancré en bas et rogné. */}
      <Animated.View style={[styles.remplissageWrap, styleRemplissage]}>
        <View style={styles.remplissageInner}>
          <HeartIcon size={150} color="#FFFFFF" glare={false} />
        </View>
      </Animated.View>
      {/* Contour par-dessus : sans lui, la coupe du remplissage se lit comme
          un cœur cassé en deux au lieu d'un niveau qui monte. */}
      <View style={styles.contourWrap} pointerEvents="none">
        <HeartIcon size={150} color="rgba(255,255,255,0.85)" outline strokeWidth={1.3} />
      </View>
      <View style={styles.heroHeartNumWrap}>
        <Text style={styles.heroHeartNum} adjustsFontSizeToFit numberOfLines={1}>
          {isPremium ? '∞' : `${hearts}/${MAX_HEARTS}`}
        </Text>
      </View>
    </Animated.View>
  );
}

/**
 * Carte d'option, en grille deux par ligne.
 *
 *  La barre de progression ne s'affiche que là où elle veut dire quelque
 *  chose (gemmes accumulées, révisions faites). Ailleurs, on garde sa place en
 *  `opacity: 0` pour que les quatre cartes restent de la même hauteur.
 */
function OptionCard({
  icon, iconBg, iconFg, gain, title, sub, cta, ctaBg, ctaFg,
  pct, showBar, onPress, disabled, loading, T,
}: {
  icon: React.ReactNode; iconBg: string; iconFg: string; gain: string;
  title: string; sub: string; cta: string; ctaBg: string; ctaFg: string;
  pct?: number; showBar: boolean;
  onPress: () => void; disabled?: boolean; loading?: boolean;
  T: ReturnType<typeof useTheme>;
}) {
  return (
    <Pressable
      style={[
        styles.opt,
        { backgroundColor: T.cardBg, shadowColor: T.shadow },
        disabled && { opacity: 0.55 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <View style={styles.optTop}>
        <View style={[styles.optIcone, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={[styles.optGain, { backgroundColor: iconBg }]}>
          <Text style={[styles.optGainTxt, { color: iconFg }]}>{gain}</Text>
        </View>
      </View>
      <Text style={[styles.optTitre, { color: T.text }]}>{title}</Text>
      <Text style={[styles.optSous, { color: T.textSecondary }]}>{sub}</Text>
      <View style={{ flex: 1 }} />
      <View
        style={[
          styles.optBarre,
          { backgroundColor: T.isDark ? '#221F2A' : '#F0EDE8' },
          !showBar && { opacity: 0 },
        ]}
      >
        <View style={[styles.optBarreRemplie, { width: `${pct ?? 0}%`, backgroundColor: iconFg }]} />
      </View>
      <View style={[styles.optCta, { backgroundColor: ctaBg }]}>
        {loading ? (
          <ActivityIndicator size="small" color={ctaFg} />
        ) : (
          <Text style={[styles.optCtaTxt, { color: ctaFg }]}>{cta}</Text>
        )}
      </View>
    </Pressable>
  );
}

export default function HeartsScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  // Voir streak.tsx : on normalise les compteurs a la lecture.
  const hearts = useUserStore((s) => s.hearts) ?? 0;
  const gems = useUserStore((s) => s.gems) ?? 0;
  const isPremium = useUserStore((s) => s.isPremium);
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);
  const REFILL_GEM_COST = useAppConfigStore((s) => s.pricing.gemCostHeartRefill);
  const syncHearts = useUserStore((s) => s.syncHearts);
  const msUntilNextHeart = useUserStore((s) => s.msUntilNextHeart);

  const [remaining, setRemaining] = useState(msUntilNextHeart());
  const [refilling, setRefilling] = useState(false);
  const [buying, setBuying] = useState(false);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const full = isPremium || hearts >= MAX_HEARTS;

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

  /** Acheter un refill complet avec de l'argent — demande le mode de paiement puis ouvre le checkout. */
  const onBuyMoney = async () => {
    if (buying || full) return;
    const provider = await askPaymentProvider();
    if (!provider) return;
    setBuying(true);
    try {
      const s = await buyHearts(provider);
      setSession(s);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status !== 0 ? e.message : tr('heartsPage.paymentFailed');
      Alert.alert(tr('heartsPage.paymentTitle'), msg);
    } finally {
      setBuying(false);
    }
  };

  const degradeHero: [string, string, string] = T.isDark
    ? ['#B23A44', '#8E2A36', '#5E1A24']
    : ['#FF7A7A', '#F2545B', '#D93A48'];

  const SOFT = {
    blue: T.isDark ? 'rgba(28,176,246,0.15)' : '#E3F4FD',
    gold: T.isDark ? 'rgba(224,160,44,0.16)' : '#FFF4D6',
    green: T.isDark ? 'rgba(46,154,90,0.18)' : '#E4F5EA',
    purple: T.isDark ? 'rgba(107,77,255,0.16)' : '#EEEAFF',
    red: T.isDark ? 'rgba(229,72,77,0.16)' : '#FDE8E8',
  };
  const DIS = { bg: T.isDark ? '#24222C' : '#EFEDF2', fg: T.isDark ? '#6E6A80' : '#A4A0B4' };

  const peutConvertir = !full && gems >= REFILL_GEM_COST;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Héros ── */}
        <LinearGradient colors={degradeHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroHalo} pointerEvents="none" />

          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
              <Feather name="chevron-left" size={26} color="#B4232F" />
            </Pressable>
            <Text style={styles.heroTitle}>{tr('heartsPage.title')}</Text>
            <Pressable style={styles.gemChip} onPress={() => router.push('/(app)/gems')}>
              <GemIcon size={13} color="#BFE9FF" />
              <Text style={styles.gemChipVal}>{gems.toLocaleString()}</Text>
            </Pressable>
          </View>

          <HeroHeart hearts={hearts} isPremium={isPremium} />

          {/* Les cinq slots : le prochain à revenir porte l'anneau de recharge. */}
          {!isPremium && (
            <View style={styles.slots}>
              {Array.from({ length: MAX_HEARTS }, (_, i) => {
                const plein = i < hearts;
                const encharge = !full && i === hearts;
                // Part écoulée du cycle de régénération en cours.
                const progression = encharge ? 1 - remaining / HEART_REGEN_MS : 0;
                return (
                  <View
                    key={i}
                    style={[
                      styles.slot,
                      { backgroundColor: plein ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.12)' },
                    ]}
                  >
                    {encharge && (
                      <Svg width={46} height={46} viewBox="0 0 46 46" style={styles.slotSvg}>
                        <Circle cx={23} cy={23} r={SLOT_R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
                        <Circle
                          cx={23} cy={23} r={SLOT_R}
                          fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"
                          strokeDasharray={`${SLOT_C * Math.max(0, Math.min(1, progression))} ${SLOT_C}`}
                          transform="rotate(-90 23 23)"
                        />
                      </Svg>
                    )}
                    <HeartIcon
                      size={20}
                      color={plein ? '#fff' : 'rgba(255,255,255,0.45)'}
                      glare={false}
                    />
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.heroMsg}>
            <Feather name={full ? 'check-circle' : 'clock'} size={15} color="#fff" />
            <Text style={styles.heroMsgTxt}>
              {isPremium
                ? tr('heartsPage.premiumSub')
                : full
                  ? tr('heartsPage.heroFull')
                  : tr('heartsPage.heroNext', { time: formatRemaining(remaining) })}
            </Text>
          </View>
        </LinearGradient>

        {/* ── Premium ── */}
        {isPremium ? (
          <View style={[styles.premiumActif, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}>
            <View style={styles.premiumActifIcone}>
              <Feather name="award" size={26} color="#FFD36B" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.premiumActifTitre, { color: T.text }]}>{tr('heartsPage.youArePremium')}</Text>
              <Text style={[styles.premiumActifSous, { color: T.textSecondary }]}>{tr('heartsPage.premiumHint')}</Text>
            </View>
          </View>
        ) : paymentsEnabled && (
          <LinearGradient
            colors={['#2A1B5E', '#4A2EA8', '#7A4DFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.promo}
          >
            <View style={styles.promoHalo} pointerEvents="none" />
            <LinearGradient
              colors={['#FFD36B', '#F0A41E']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.promoBadge}
            >
              <Feather name="award" size={12} color="#4A2A00" />
              <Text style={styles.promoBadgeTxt}>{tr('heartsPage.premiumBadge')}</Text>
            </LinearGradient>
            <Text style={styles.promoTitre}>{tr('heartsPage.premiumPitch')}</Text>
            <View style={styles.promoPerks}>
              {[tr('heartsPage.perk1'), tr('heartsPage.perk2'), tr('heartsPage.perk3')].map((p) => (
                <View key={p} style={styles.promoPerk}>
                  <Feather name="check" size={14} color="#FFD36B" />
                  <Text style={styles.promoPerkTxt}>{p}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.promoCta} onPress={() => router.push('/(app)/subscription')}>
              <Text style={styles.promoCtaTxt}>{tr('heartsPage.premiumTry')}</Text>
            </Pressable>
          </LinearGradient>
        )}

        {/* ── Recharger ── */}
        {!isPremium && (
          <>
            <Text style={[styles.titreSection, { color: T.text }]}>{tr('heartsPage.rechargeTitle')}</Text>
            <View style={styles.grilleOpts}>
              <OptionCard
                T={T}
                icon={<GemIcon size={22} color="#1CB0F6" />}
                iconBg={SOFT.blue} iconFg="#2BA8EC"
                gain="+5"
                title={tr('heartsPage.convertGems')}
                sub={
                  full
                    ? tr('heartsPage.convertSubFull')
                    : gems >= REFILL_GEM_COST
                      ? tr('heartsPage.convertSubOk', { n: REFILL_GEM_COST })
                      : tr('heartsPage.convertSubShort', { n: REFILL_GEM_COST - gems })
                }
                cta={String(REFILL_GEM_COST)}
                ctaBg={peutConvertir ? '#2BA8EC' : DIS.bg}
                ctaFg={peutConvertir ? '#fff' : DIS.fg}
                pct={Math.min(100, (gems / REFILL_GEM_COST) * 100)}
                showBar
                onPress={onRefillGems}
                loading={refilling}
                disabled={!peutConvertir}
              />

              {paymentsEnabled && (
                <OptionCard
                  T={T}
                  icon={<Feather name="credit-card" size={21} color="#E0A02C" />}
                  iconBg={SOFT.gold} iconFg="#E0A02C"
                  gain="+5"
                  title={tr('heartsPage.buyWithMoney')}
                  sub={tr('heartsPage.buySub')}
                  cta={tr('heartsPage.buy')}
                  ctaBg={full ? DIS.bg : '#E0A02C'}
                  ctaFg={full ? DIS.fg : '#fff'}
                  showBar={false}
                  onPress={onBuyMoney}
                  loading={buying}
                  disabled={full}
                />
              )}

              <OptionCard
                T={T}
                icon={<Feather name="book-open" size={21} color="#2E9A5A" />}
                iconBg={SOFT.green} iconFg="#2E9A5A"
                gain="+1"
                title={tr('heartsPage.reviewForHearts')}
                sub={tr('heartsPage.reviewSub')}
                cta={tr('heartsPage.reviewCta')}
                ctaBg={full ? DIS.bg : '#2E9A5A'}
                ctaFg={full ? DIS.fg : '#fff'}
                showBar={false}
                onPress={() => router.push({ pathname: '/(app)/(tabs)/revisions', params: { regagner: '1' } })}
                disabled={full}
              />

              <OptionCard
                T={T}
                icon={<Feather name="users" size={21} color="#6B4DFF" />}
                iconBg={SOFT.purple} iconFg="#6B4DFF"
                gain="+5"
                title={tr('heartsPage.referFriends')}
                sub={tr('heartsPage.referSub')}
                cta={tr('heartsPage.referCta')}
                ctaBg="#6B4DFF" ctaFg="#fff"
                showBar={false}
                onPress={() => router.push('/(app)/referral')}
              />
            </View>

            {/* ── Règles ── */}
            <Text style={[styles.titreSection, { color: T.text }]}>{tr('heartsPage.howTitle')}</Text>
            <View style={[styles.carteRegles, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}>
              {[
                { bg: SOFT.red, icon: <HeartIcon size={17} color="#E5484D" glare={false} />, txt: tr('heartsPage.rule1') },
                { bg: SOFT.blue, icon: <Feather name="clock" size={16} color="#1CB0F6" />, txt: tr('heartsPage.rule2') },
                { bg: SOFT.gold, icon: <Feather name="lock" size={16} color="#E0A02C" />, txt: tr('heartsPage.rule3') },
              ].map((r, i) => (
                <View key={r.txt} style={[styles.regle, i > 0 && { borderTopWidth: 1, borderTopColor: T.divider }]}>
                  <View style={[styles.regleIcone, { backgroundColor: r.bg }]}>{r.icon}</View>
                  <Text style={[styles.regleTxt, { color: T.text }]}>{r.txt}</Text>
                </View>
              ))}
            </View>

          </>
        )}

        {/* ── Geler sa série ──
         *
         * Hors du bloc `!isPremium` : un abonné garde ses gemmes et sa série,
         * et sans ce raccourci la page Premium n'était qu'un héros suivi d'un
         * grand vide. */}
        <Pressable
          style={[styles.lienStreak, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}
          onPress={() => router.push('/(app)/streak')}
        >
          <View style={[styles.regleIcone, { backgroundColor: SOFT.blue }]}>
            <FreezeIcon size={17} color="#1CB0F6" />
          </View>
          <Text style={[styles.objTxt, { color: T.text }]}>{tr('streak.freezeCardTitle')}</Text>
          <Feather name="chevron-right" size={18} color={T.textSecondary} />
        </Pressable>

        {/* Le même raccourci vers les gemmes, pour ne pas enfermer l'abonné
            dans une page sans issue. */}
        <Pressable
          style={[styles.lienStreak, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}
          onPress={() => router.push('/(app)/gems')}
        >
          <View style={[styles.regleIcone, { backgroundColor: SOFT.blue }]}>
            <GemIcon size={17} color="#1CB0F6" />
          </View>
          <Text style={[styles.objTxt, { color: T.text }]}>{tr('gems.headerTitle')}</Text>
          <Feather name="chevron-right" size={18} color={T.textSecondary} />
        </Pressable>

        <View style={{ height: 32 }} />
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
  scroll: { paddingBottom: 12 },

  /* ── Héros ── */
  hero: {
    paddingTop: 10, paddingBottom: 26, paddingHorizontal: 18,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    alignItems: 'center', overflow: 'hidden',
  },
  heroHalo: {
    position: 'absolute', top: 40, width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: 6 },
  back: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
  gemChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 34, paddingHorizontal: 11, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  gemChipVal: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },

  heroHeart: { width: 150, height: 150, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  // Ancré en bas : la hauteur animée découvre le cœur du bas vers le haut.
  remplissageWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  // Le cœur plein garde sa taille entière dans un conteneur rogné ; sans ce
  // calage en bas, il serait écrasé avec la hauteur du parent.
  remplissageInner: { position: 'absolute', bottom: 0, width: 150, height: 150 },
  contourWrap: { position: 'absolute', width: 150, height: 150 },
  heroHeartNumWrap: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 8 },
  heroHeartNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, color: '#B4232F' },

  slots: { flexDirection: 'row', gap: 10, marginTop: 16 },
  slot: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  slotSvg: { position: 'absolute' },

  heroMsg: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 14, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  heroMsgTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },

  /* ── Premium ── */
  premiumActif: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 18, marginTop: -18, borderRadius: 24, padding: 16,
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 6,
  },
  premiumActifIcone: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(240,164,30,0.16)',
  },
  premiumActifTitre: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18 },
  premiumActifSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },

  promo: {
    marginHorizontal: 18, marginTop: 18, borderRadius: 26, padding: 18, overflow: 'hidden',
  },
  promoHalo: {
    position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,211,107,0.18)',
  },
  promoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10,
  },
  promoBadgeTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 0.6, color: '#4A2A00' },
  // Pas de maxWidth : à 230 px le titre cassait en « pour / toujours », une
  // coupure qui laisse une ligne orpheline de deux mots.
  promoTitre: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 23, color: '#fff', marginTop: 10, lineHeight: 28 },
  promoPerks: { gap: 5, marginTop: 10 },
  promoPerk: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  promoPerkTxt: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.95)', flex: 1 },
  promoCta: {
    marginTop: 14, height: 48, borderRadius: 15, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 26,
  },
  promoCtaTxt: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#4A2EA8' },

  /* ── Options ── */
  titreSection: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginHorizontal: 20, marginTop: 24, marginBottom: 10 },
  grilleOpts: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 13 },
  opt: {
    width: '50%', minHeight: 182,
    borderRadius: 22, padding: 14, margin: 5,
    // `width: 50%` + marge dépasserait la ligne : on retire la marge de la
    // largeur calculée.
    maxWidth: '47%',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  optTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optIcone: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optGain: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9 },
  optGainTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  optTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, marginTop: 12 },
  optSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 3 },
  optBarre: { height: 6, borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  optBarreRemplie: { height: '100%', borderRadius: 3 },
  optCta: { marginTop: 10, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  optCtaTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  /* ── Règles ── */
  carteRegles: {
    marginHorizontal: 18, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 4,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  regle: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  regleIcone: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  regleTxt: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 13 },

  lienStreak: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 18, marginTop: 12, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  objTxt: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
});
