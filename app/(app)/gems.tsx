import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import DeviceStatusBar from '../../components/StatusBar';
import { GemIcon, HeartIcon, FreezeIcon, FlameIcon, TrophyIcon } from '../../components/IslamicIcons';
import { useTheme } from '../../utils/useTheme';
import { useUserStore, MAX_HEARTS } from '../../store/userStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { refillHeartsWithGems, buyStreakFreeze, buyDoubleXp, buyGemPack, type GemPackId } from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { askPaymentProvider } from '../../utils/askPaymentProvider';
import { useT } from '../../lib/i18n';

// Packs de gemmes (achat avec de l'argent).
const PACKS: { id: GemPackId; gems: number; tag?: 'popular' | 'best' }[] = [
  { id: 'p500', gems: 500 },
  { id: 'p3000', gems: 3000, tag: 'popular' },
  { id: 'p7000', gems: 7000, tag: 'best' },
];

/** Disposition des gemmes dans l'illustration d'un pack : plus le pack est
 *  gros, plus le tas est garni. */
const PILES: { x: number; y: number; s: number; r: number }[][] = [
  [{ x: 18, y: 8, s: 36, r: 0 }],
  [{ x: 4, y: 18, s: 30, r: -14 }, { x: 30, y: 4, s: 36, r: 8 }],
  [{ x: 0, y: 22, s: 28, r: -16 }, { x: 38, y: 22, s: 28, r: 16 }, { x: 17, y: 2, s: 38, r: 0 }],
];

/**
 * Gemme du héros : elle flotte, et un reflet la balaie.
 *
 *  Le reflet est une bande blanche en dégradé qu'on fait traverser la pastille
 *  (rognée par `overflow: hidden`), inclinée à 25°. C'est ce balayage qui dit
 *  « précieux » ; une gemme immobile, à cette taille, se lit comme une icône.
 */
function HeroGem() {
  const flotte = useSharedValue(0);
  const reflet = useSharedValue(0);

  useEffect(() => {
    flotte.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    // Le reflet reste hors champ la majeure partie du cycle : un balayage
    // continu donnerait un clignotement fatigant.
    reflet.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1600 }),
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, []);

  const stylePastille = useAnimatedStyle(() => ({
    transform: [
      { translateY: -flotte.value * 8 },
      { rotate: `${-6 + flotte.value * 3}deg` },
    ],
  }));

  const styleReflet = useAnimatedStyle(() => ({
    transform: [{ translateX: -70 + reflet.value * 220 }, { rotate: '25deg' }],
  }));

  return (
    <Animated.View style={[styles.gemPastille, stylePastille]}>
      <GemIcon size={58} color="#FFFFFF" />
      <Animated.View style={[styles.refletWrap, styleReflet]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

/** Petite gemme satellite qui scintille autour du héros. */
function Scintille({
  style, size, color, delay,
}: { style: object; size: number; color: string; delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, []);
  const anim = useAnimatedStyle(() => ({
    opacity: 0.3 + v.value * 0.7,
    transform: [{ scale: 0.7 + v.value * 0.4 }],
  }));
  return (
    <Animated.View style={[style, anim]} pointerEvents="none">
      <GemIcon size={size} color={color} />
    </Animated.View>
  );
}

/**
 * Carte de la boutique : vignette illustrée à gauche, contenu à droite.
 *
 *  La barre de progression dit « combien il te manque » sans faire de calcul
 *  mental : à 100 % l'achat est possible. C'est plus lisible qu'un prix barré
 *  ou qu'un bouton simplement grisé.
 */
function ShopCard({
  art, glyph, title, sub, subColor, cost, owned, ownedTxt, pct, barColor,
  ctaBg, ctaFg, onPress, disabled, loading, T,
}: {
  art: [string, string]; glyph: React.ReactNode;
  title: string; sub: string; subColor: string; cost: number;
  owned: boolean; ownedTxt: string; pct: number; barColor: string;
  ctaBg: string; ctaFg: string;
  onPress: () => void; disabled?: boolean; loading?: boolean;
  T: ReturnType<typeof useTheme>;
}) {
  return (
    // Carte entièrement tactile : le prix seul fait une cible trop petite, et
    // l'utilisateur vise naturellement la carte.
    <Pressable
      style={[styles.shop, { backgroundColor: T.cardBg, shadowColor: T.shadow }, disabled && { opacity: 0.6 }]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <LinearGradient colors={art} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shopArt}>
        <View style={styles.shopArtDisc} />
        {glyph}
      </LinearGradient>
      <View style={styles.shopBody}>
        <View style={styles.shopTop}>
          <Text style={[styles.shopTitre, { color: T.text }]} numberOfLines={1}>{title}</Text>
          {owned && (
            <View style={[styles.shopOwned, { backgroundColor: T.isDark ? 'rgba(28,176,246,0.15)' : '#E3F4FD' }]}>
              <Text style={styles.shopOwnedTxt}>{ownedTxt}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.shopSous, { color: subColor }]}>{sub}</Text>
        <View style={styles.shopBas}>
          <View style={[styles.shopBarre, { backgroundColor: T.isDark ? '#221F2A' : '#F0EDE8' }]}>
            <View style={[styles.shopBarreRemplie, { width: `${pct}%`, backgroundColor: barColor }]} />
          </View>
          <View style={[styles.shopCta, { backgroundColor: ctaBg }]}>
            {loading ? (
              <ActivityIndicator size="small" color={ctaFg} />
            ) : (
              <>
                <GemIcon size={12} color={ctaFg} />
                <Text style={[styles.shopCtaTxt, { color: ctaFg }]}>{cost}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Page « Mes gemmes » — ouverte en appuyant sur le compteur gemmes du parcours.
export default function GemsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  // Voir streak.tsx : on normalise les compteurs a la lecture.
  const gems = useUserStore((s) => s.gems) ?? 0;
  const hearts = useUserStore((s) => s.hearts) ?? 0;
  const isPremium = useUserStore((s) => s.isPremium);
  const streakFreezes = useUserStore((s) => s.streakFreezes) ?? 0;
  const doubleXpUntil = useUserStore((s) => s.doubleXpUntil);
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);
  const pricing = useAppConfigStore((s) => s.pricing);
  const REFILL_COST = pricing.gemCostHeartRefill;
  const FREEZE_COST = pricing.gemCostStreakFreeze;
  const DOUBLE_XP_COST = pricing.gemCostDoubleXp;

  // Action en cours (clé unique) → désactive et montre le spinner sur la bonne carte.
  const [busy, setBusy] = useState<string | null>(null);
  const doubleXpActive = doubleXpUntil != null && doubleXpUntil > Date.now();
  const [session, setSession] = useState<{ reference: string; paymentUrl: string } | null>(null);
  const [pendingPackMsg, setPendingPackMsg] = useState<{ title: string; msg: string } | null>(null);

  const full = isPremium || hearts >= MAX_HEARTS;

  // Enveloppe commune : lance l'action serveur, alerte succès/échec, jamais bloquant.
  const run = async (key: string, fn: () => Promise<unknown>, okTitle: string, okMsg: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
      Alert.alert(okTitle, okMsg);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'INSUFFICIENT_GEMS'
          ? tr('gems.errorInsufficient')
          : e instanceof ApiError && e.status !== 0
            ? e.message
            : tr('gems.errorGeneric');
      Alert.alert(tr('gems.errorTitle'), msg);
    } finally {
      setBusy(null);
    }
  };

  // Achat d'un pack de gemmes avec de l'argent — ouvre le checkout DexPay
  // (carte). Contrairement aux autres actions (payées en gemmes), celle-ci
  // ne crédite rien immédiatement : il faut confirmer via le paiement carte
  // puis attendre le webhook (voir components/DexPayCheckout.tsx).
  const onBuyPack = async (p: (typeof PACKS)[number]) => {
    const key = `pack-${p.id}`;
    if (busy) return;
    const provider = await askPaymentProvider();
    if (!provider) return;
    setBusy(key);
    try {
      const s = await buyGemPack(p.id, provider);
      setPendingPackMsg({
        title: tr('gems.packOkTitle'),
        msg: tr('gems.packOkMsg', { count: p.gems.toLocaleString() }),
      });
      setSession(s);
    } catch (e) {
      const msg = e instanceof ApiError && e.status !== 0 ? e.message : tr('gems.errorGeneric');
      Alert.alert(tr('gems.errorTitle'), msg);
    } finally {
      setBusy(null);
    }
  };

  const degradeHero: [string, string, string] = T.isDark
    ? ['#1A6FA8', '#14548A', '#0E3A60']
    : ['#5CCBFA', '#2BA8EC', '#1A86D0'];

  const DIS = { bg: T.isDark ? '#24222C' : '#EFEDF2', fg: T.isDark ? '#6E6A80' : '#A4A0B4' };
  const VIDE = T.isDark ? '#221F2A' : '#F0EDE8';

  const peutRefill = !full && gems >= REFILL_COST;
  const peutGeler = gems >= FREEZE_COST;
  const peutXp = gems >= DOUBLE_XP_COST && !doubleXpActive;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Héros ── */}
        <LinearGradient colors={degradeHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroHalo} pointerEvents="none" />

          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
              <Feather name="chevron-left" size={26} color="#11619C" />
            </Pressable>
            <Text style={styles.heroTitle}>{tr('gems.headerTitle')}</Text>
            {/* Symétrie : laisse la place du bouton retour pour que le titre
                reste centré sur l'écran. */}
            <View style={styles.backGhost} />
          </View>

          <View style={styles.gemScene}>
            <HeroGem />
            <Scintille style={styles.scint1} size={18} color="#DFF4FF" delay={0} />
            <Scintille style={styles.scint2} size={13} color="#FFFFFF" delay={600} />
            <Scintille style={styles.scint3} size={12} color="#DFF4FF" delay={1100} />
          </View>

          <Text style={styles.heroNum} adjustsFontSizeToFit numberOfLines={1}>
            {gems.toLocaleString()}
          </Text>
          <Text style={styles.heroSub}>{tr('gems.heroSub')}</Text>
        </LinearGradient>

        {/* ── Boutique ── */}
        <Text style={[styles.titreSection, { color: T.text }]}>{tr('gems.shopTitle')}</Text>
        <View style={styles.shopList}>
          <ShopCard
            T={T}
            art={['#FF7A7A', '#E5484D']}
            glyph={<HeartIcon size={34} color="#FFFFFF" glare={false} />}
            title={tr('gems.refillTitle')}
            sub={
              full
                ? tr('gems.refillSubFull')
                : gems >= REFILL_COST
                  ? tr('gems.refillSubOk')
                  : tr('gems.subShort', { n: REFILL_COST - gems })
            }
            subColor={T.textSecondary}
            cost={REFILL_COST}
            owned={false} ownedTxt=""
            pct={Math.min(100, (gems / REFILL_COST) * 100)}
            barColor="#E5484D"
            ctaBg={peutRefill ? '#E5484D' : DIS.bg}
            ctaFg={peutRefill ? '#fff' : DIS.fg}
            onPress={() => run('refill', refillHeartsWithGems, tr('gems.refillOkTitle'), tr('gems.refillOkMsg'))}
            loading={busy === 'refill'}
            disabled={!peutRefill}
          />

          <ShopCard
            T={T}
            art={['#7FD3FA', '#2BA8EC']}
            glyph={<FreezeIcon size={34} color="#FFFFFF" />}
            title={tr('gems.freezeTitle')}
            sub={
              gems >= FREEZE_COST
                ? tr('gems.freezeSubOk', { count: streakFreezes })
                : tr('gems.subShort', { n: FREEZE_COST - gems })
            }
            subColor={T.textSecondary}
            cost={FREEZE_COST}
            owned={streakFreezes > 0}
            ownedTxt={tr('gems.ownedFreezeMany', { n: streakFreezes })}
            pct={Math.min(100, (gems / FREEZE_COST) * 100)}
            barColor="#2BA8EC"
            ctaBg={peutGeler ? '#2BA8EC' : DIS.bg}
            ctaFg={peutGeler ? '#fff' : DIS.fg}
            onPress={() => run('freeze', buyStreakFreeze, tr('gems.freezeOkTitle'), tr('gems.freezeOkMsg'))}
            loading={busy === 'freeze'}
            disabled={!peutGeler}
          />

          <ShopCard
            T={T}
            art={['#FFD36B', '#E0A02C']}
            glyph={<Feather name="zap" size={32} color="#FFFFFF" />}
            title={doubleXpActive ? tr('gems.xpTitleActive') : tr('gems.xpTitle')}
            sub={
              doubleXpActive
                ? tr('gems.xpSubActive')
                : gems >= DOUBLE_XP_COST
                  ? tr('gems.xpSubOk')
                  : tr('gems.subShort', { n: DOUBLE_XP_COST - gems })
            }
            subColor={doubleXpActive ? '#2E9A5A' : T.textSecondary}
            cost={DOUBLE_XP_COST}
            owned={doubleXpActive}
            ownedTxt={tr('gems.ownedActive')}
            pct={doubleXpActive ? 100 : Math.min(100, (gems / DOUBLE_XP_COST) * 100)}
            barColor="#E0A02C"
            ctaBg={peutXp ? '#E0A02C' : DIS.bg}
            ctaFg={peutXp ? '#fff' : DIS.fg}
            onPress={() => run('xp', buyDoubleXp, tr('gems.xpOkTitle'), tr('gems.xpOkMsg'))}
            loading={busy === 'xp'}
            disabled={!peutXp}
          />
        </View>

        {/* ── Gagner des gemmes ── */}
        <Text style={[styles.titreSection, { color: T.text }]}>{tr('gems.earnTitle')}</Text>
        <View style={[styles.carteGagner, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}>
          {[
            {
              key: 'streak',
              bg: T.isDark ? 'rgba(255,140,50,0.15)' : '#FFEEDD',
              icon: <FlameIcon size={20} color="#F4633A" />,
              title: tr('gems.earnStreak'),
              sub: tr('gems.earnStreakSub'),
              gain: '+5',
              go: () => router.push('/(app)/streak'),
            },
            {
              key: 'podium',
              bg: T.isDark ? 'rgba(224,160,44,0.16)' : '#FFF4D6',
              icon: <TrophyIcon size={20} color="#E0A02C" />,
              title: tr('gems.earnPodium'),
              sub: tr('gems.earnPodiumSub'),
              gain: '+500',
              go: () => router.push('/(app)/(tabs)/ligues'),
            },
          ].map((r, i) => (
            <Pressable
              key={r.key}
              style={[styles.gagner, i > 0 && { borderTopWidth: 1, borderTopColor: T.divider }]}
              onPress={r.go}
            >
              <View style={[styles.gagnerIcone, { backgroundColor: r.bg }]}>{r.icon}</View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.gagnerTitre, { color: T.text }]}>{r.title}</Text>
                <Text style={[styles.gagnerSous, { color: T.textSecondary }]}>{r.sub}</Text>
              </View>
              <View style={styles.gagnerGain}>
                <Text style={[styles.gagnerGainTxt, { color: T.isDark ? '#5CC8FF' : '#1E8FD0' }]}>{r.gain}</Text>
                <GemIcon size={13} color="#1CB0F6" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* ── Packs — masqués si les paiements sont désactivés (revue store). ── */}
        {paymentsEnabled && (
          <>
            <Text style={[styles.titreSection, { color: T.text }]}>{tr('gems.packsTitle')}</Text>
            <View style={styles.packs}>
              {PACKS.map((p, i) => {
                const pop = p.tag === 'popular';
                return (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.pack,
                      {
                        backgroundColor: pop ? (T.isDark ? '#1E1A33' : '#F4F1FF') : T.cardBg,
                        shadowColor: T.shadow,
                      },
                      pop && styles.packPop,
                    ]}
                    onPress={() => onBuyPack(p)}
                    disabled={busy != null}
                  >
                    {p.tag && (
                      <View style={[styles.packTag, { backgroundColor: pop ? '#6B4DFF' : '#2E9A5A' }]}>
                        <Text style={styles.packTagTxt} numberOfLines={1} adjustsFontSizeToFit>
                          {pop ? tr('gems.tagPopular') : tr('gems.tagBest')}
                        </Text>
                      </View>
                    )}
                    <View style={styles.packTas}>
                      {PILES[i]!.map((g, k) => (
                        <View
                          key={k}
                          style={[styles.packGem, { left: g.x, top: g.y, transform: [{ rotate: `${g.r}deg` }] }]}
                        >
                          <GemIcon size={g.s} color={g.s >= 36 ? '#2BA8EC' : '#7FD3FA'} />
                        </View>
                      ))}
                    </View>
                    {/* Nombre et unité dans un seul Text : « 500 gemmes » doit
                        rester une étiquette d'un bloc pour les lecteurs
                        d'écran, l'unité simplement plus petite et discrète. */}
                    <Text style={[styles.packNum, { color: T.text }]} adjustsFontSizeToFit numberOfLines={2}>
                      {p.gems.toLocaleString()}{' '}
                      <Text style={[styles.packUnit, { color: T.textSecondary }]}>{tr('gems.packUnit')}</Text>
                    </Text>
                    <View style={styles.packCta}>
                      {busy === `pack-${p.id}` ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.packCtaTxt}>{tr('gems.packCta')}</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {session && (
        <DexPayCheckout
          visible
          paymentUrl={session.paymentUrl}
          reference={session.reference}
          onDone={(outcome) => {
            setSession(null);
            if (outcome === 'success' && pendingPackMsg) {
              Alert.alert(pendingPackMsg.title, pendingPackMsg.msg);
            }
            setPendingPackMsg(null);
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
    paddingTop: 10, paddingBottom: 28, paddingHorizontal: 18,
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
  backGhost: { width: 42, height: 42 },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },

  gemScene: { width: 170, height: 150, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  gemPastille: {
    width: 104, height: 104, borderRadius: 32, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    // Fond assombri, pas éclairci : la gemme est blanche, et sur un voile
    // blanc par-dessus un bleu clair elle disparaissait presque.
    backgroundColor: 'rgba(0,40,70,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)',
  },
  // Bande haute et étroite : inclinée à 25°, elle balaie toute la pastille.
  refletWrap: { position: 'absolute', top: -50, left: 0, width: 40, height: 210 },
  scint1: { position: 'absolute', left: 6, top: 24 },
  scint2: { position: 'absolute', right: 4, top: 50 },
  scint3: { position: 'absolute', left: 22, bottom: 10 },

  heroNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 58, color: '#fff', marginTop: 2 },
  heroSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: 'rgba(255,255,255,0.92)', marginTop: -2 },

  titreSection: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginHorizontal: 20, marginTop: 22, marginBottom: 10 },

  /* ── Boutique ── */
  shopList: { gap: 10, paddingHorizontal: 18 },
  shop: {
    flexDirection: 'row', borderRadius: 24, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  shopArt: { width: 92, alignItems: 'center', justifyContent: 'center' },
  shopArtDisc: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  shopBody: { flex: 1, minWidth: 0, padding: 14 },
  shopTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shopTitre: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  shopOwned: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
  shopOwnedTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#2BA8EC' },
  shopSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  shopBas: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  shopBarre: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  shopBarreRemplie: { height: '100%', borderRadius: 3 },
  shopCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    minWidth: 62, height: 34, paddingHorizontal: 11, borderRadius: 12,
  },
  shopCtaTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  /* ── Gagner ── */
  carteGagner: {
    marginHorizontal: 18, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 2,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  gagner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  gagnerIcone: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  gagnerTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  gagnerSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  gagnerGain: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  gagnerGainTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  /* ── Packs ── */
  // `overflow: visible` est indispensable : l'étiquette dépasse en haut de la
  // carte, et un rognage la couperait en deux.
  packs: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, alignItems: 'flex-end' },
  pack: {
    flex: 1, minWidth: 0, borderRadius: 22, alignItems: 'center',
    paddingTop: 22, paddingBottom: 10, paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  packPop: { borderWidth: 2, borderColor: '#6B4DFF' },
  // L'étiquette déborde volontairement en haut de la carte, mais jamais sur
  // les côtés : `left/right: 4` la borne à la largeur du pack, sinon
  // « MEILLEURE OFFRE » venait recouvrir l'étiquette du pack voisin.
  packTag: {
    position: 'absolute', top: -10, left: 4, right: 4,
    paddingVertical: 3, paddingHorizontal: 4, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  packTagTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8.5, letterSpacing: 0.2, color: '#fff' },
  packTas: { width: 70, height: 60 },
  packGem: { position: 'absolute' },
  packNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, marginTop: 4 },
  packUnit: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  packCta: {
    alignSelf: 'stretch', marginTop: 10, height: 36, borderRadius: 12,
    backgroundColor: '#6B4DFF', alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 3, borderBottomColor: '#4A31C2',
  },
  packCtaTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },
});
