import { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import DeviceStatusBar from '../../components/StatusBar';
import { FlameIcon, GemIcon, FreezeIcon } from '../../components/IslamicIcons';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { fetchGems, fetchMe, repairStreak, buyStreakFreeze, type GemLedgerEntry, type CheckoutSession } from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import DexPayCheckout from '../../components/DexPayCheckout';
import { askPaymentProvider } from '../../utils/askPaymentProvider';
import { useT } from '../../lib/i18n';

/** Raisons du ledger de gemmes qui concernent la SÉRIE. Sert à la fois à
 *  filtrer l'historique et à colorier le calendrier. */
const STREAK_REASONS = ['daily_streak', 'streak_bonus', 'streak_freeze'] as const;

/** Paliers de série et bonus en gemmes — doivent rester alignés sur le backend. */
const MILESTONES: { d: number; gems: number }[] = [
  { d: 7, gems: 50 },
  { d: 14, gems: 100 },
  { d: 30, gems: 250 },
  { d: 50, gems: 400 },
  { d: 100, gems: 1000 },
];

/** Rayon de l'anneau de progression, en unités du viewBox. */
const RING_R = 90;
const RING_C = 2 * Math.PI * RING_R;

/** Clé `YYYY-MM-DD` en heure LOCALE.
 *
 *  `toISOString()` convertit en UTC : à Dakar (UTC+0) c'est sans effet, mais
 *  pour un utilisateur à UTC+2 une lecture faite à 1 h du matin basculerait
 *  sur la veille et le calendrier colorierait le mauvais jour. */
function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${j}`;
}

/**
 * Flamme du héros.
 *
 *  Allumée, elle vacille : la flamme externe se déforme très légèrement
 *  (scaleX/scaleY en opposition) tandis que le cœur monte et descend. Éteinte,
 *  elle est grise et immobile — c'est l'absence de mouvement qui dit que la
 *  série est cassée, bien plus que la couleur.
 */
function HeroFlame({ lit }: { lit: boolean }) {
  const vacille = useSharedValue(0);
  const coeur = useSharedValue(0);

  useEffect(() => {
    if (!lit) return;
    vacille.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    coeur.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [lit]);

  const styleExterne = useAnimatedStyle(() => ({
    transform: [
      { scaleX: 1 + vacille.value * 0.04 },
      { scaleY: 1 - vacille.value * 0.03 },
      { rotate: `${-1.5 + vacille.value * 3}deg` },
    ],
  }));

  const styleCoeur = useAnimatedStyle(() => ({
    transform: [{ translateY: -coeur.value * 4 }, { scale: 1 + coeur.value * 0.06 }],
  }));

  if (!lit) {
    return (
      <View style={styles.flammeWrap}>
        <FlameIcon size={104} color="rgba(255,255,255,0.3)" inner="rgba(255,255,255,0.18)" />
      </View>
    );
  }

  return (
    <View style={styles.flammeWrap}>
      <Animated.View style={styleExterne}>
        <FlameIcon size={104} color="#FFD36B" inner="transparent" />
      </Animated.View>
      {/* Cœur de flamme animé à part : il respire plus vite que l'enveloppe. */}
      <Animated.View style={[styles.flammeCoeur, styleCoeur]}>
        <FlameIcon size={60} color="#F4633A" inner="#FFF6E4" />
      </Animated.View>
    </View>
  );
}

/** Pastille d'information du héros (record, gels, objectif). */
function HeroChip({ children }: { children: React.ReactNode }) {
  return <View style={styles.heroChip}>{children}</View>;
}

// Page « Ma série » — ouverte en appuyant sur le compteur série du parcours.
export default function StreakScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  // `?? 0` : le store part bien a 0, mais une hydratation partielle
  // laisserait un undefined qui ferait planter tout l'ecran au premier
  // `.toLocaleString()`.
  const streak = useUserStore((s) => s.streak) ?? 0;
  const streakGoal = useUserStore((s) => s.streakGoal);
  const streakFreezes = useUserStore((s) => s.streakFreezes) ?? 0;
  const gems = useUserStore((s) => s.gems) ?? 0;
  const paymentsEnabled = useAppConfigStore((s) => s.paymentsEnabled);
  const friendsEnabled = useAppConfigStore((s) => s.friendsEnabled);
  const FREEZE_COST = useAppConfigStore((s) => s.pricing.gemCostStreakFreeze);

  const [history, setHistory] = useState<GemLedgerEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [buyingFreeze, setBuyingFreeze] = useState(false);
  // Jours de série récupérés en payant la restauration (= lastStreakValue).
  const [recoverable, setRecoverable] = useState(0);
  const [session, setSession] = useState<CheckoutSession | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [g, me] = await Promise.all([fetchGems(), fetchMe()]);
      setHistory(g.transactions.filter((t) => (STREAK_REASONS as readonly string[]).includes(t.reason)));
      setRecoverable(me.lastStreakValue ?? 0);
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const lit = streak > 0;
  const goal = streakGoal ?? 0;
  // Sans objectif fixé, l'anneau reste à vide : le remplir au hasard
  // donnerait une progression inventée.
  const ringPct = goal > 0 ? Math.min(1, streak / goal) : 0;

  /* ── Calendrier du mois en cours ──
   *
   * On ne dispose d'aucun endpoint « jours lus » : le ledger de gemmes est la
   * seule trace datée. Chaque `daily_streak` = un jour lu, chaque
   * `streak_freeze` = un jour gelé. Un jour passé sans évènement et avant
   * aujourd'hui est donc manqué. */
  const { jours, nbLus } = useMemo(() => {
    const lus = new Set<string>();
    const geles = new Set<string>();
    for (const h of history ?? []) {
      const k = dayKey(new Date(h.createdAt));
      if (h.reason === 'streak_freeze') geles.add(k);
      else lus.add(k);
    }

    const now = new Date();
    const annee = now.getFullYear();
    const mois = now.getMonth();
    const aujourdhui = now.getDate();
    const nbJours = new Date(annee, mois + 1, 0).getDate();

    // Décalage pour que la grille commence un LUNDI (getDay: 0=dim).
    const premierJour = new Date(annee, mois, 1).getDay();
    const vide = (premierJour + 6) % 7;

    const out: {
      key: string; d: number | null; lu: boolean; gele: boolean;
      manque: boolean; cejour: boolean; futur: boolean;
    }[] = [];
    for (let i = 0; i < vide; i++) {
      out.push({ key: `v${i}`, d: null, lu: false, gele: false, manque: false, cejour: false, futur: false });
    }
    let compte = 0;
    for (let d = 1; d <= nbJours; d++) {
      const k = dayKey(new Date(annee, mois, d));
      const estLu = lus.has(k);
      const estGele = geles.has(k);
      if (estLu || estGele) compte++;
      out.push({
        key: k,
        d,
        lu: estLu,
        gele: estGele,
        manque: !estLu && !estGele && d < aujourdhui,
        cejour: d === aujourdhui,
        futur: d > aujourdhui,
      });
    }
    // Complète la dernière ligne, sinon la grille se décale en fin de mois.
    while (out.length % 7 !== 0) {
      out.push({ key: `f${out.length}`, d: null, lu: false, gele: false, manque: false, cejour: false, futur: false });
    }
    return { jours: out, nbLus: compte };
  }, [history]);

  const moisLabel = useMemo(() => {
    const s = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, []);

  const JOURS_SEM = useMemo(() => {
    // Lundi 5 janvier 2026 — point de départ arbitraire pour obtenir les
    // initiales des jours dans la langue du téléphone sans les coder en dur.
    const base = new Date(2026, 0, 5);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(undefined, { weekday: 'narrow' }).toUpperCase();
    });
  }, []);

  /** Palier atteint / palier suivant → remplit la barre des paliers. */
  const { atteints, pctPaliers } = useMemo(() => {
    const n = MILESTONES.filter((m) => streak >= m.d).length;
    const suivant = MILESTONES[n];
    const precedent = n > 0 ? MILESTONES[n - 1]!.d : 0;
    const pct = suivant
      ? n * 25 + ((streak - precedent) / (suivant.d - precedent)) * 25
      : 100;
    return { atteints: n, pctPaliers: Math.min(100, Math.max(0, pct)) };
  }, [streak]);

  // Restaure la série cassée en payant — ouvre le checkout DexPay (carte).
  const onRepair = useCallback(async () => {
    if (repairing) return;
    const provider = await askPaymentProvider();
    if (!provider) return;
    setRepairing(true);
    try {
      const s = await repairStreak(provider);
      setSession(s);
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status !== 0 ? e.message : tr('streak.repairFailMsg');
      Alert.alert(tr('streak.repairFailTitle'), msg);
    } finally {
      setRepairing(false);
    }
  }, [repairing, tr]);

  const onBuyFreeze = useCallback(async () => {
    if (buyingFreeze || gems < FREEZE_COST) return;
    setBuyingFreeze(true);
    try {
      await buyStreakFreeze();
      Alert.alert(tr('gems.freezeOkTitle'), tr('gems.freezeOkMsg'));
      load();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'INSUFFICIENT_GEMS'
          ? tr('gems.errorInsufficient')
          : tr('gems.errorGeneric');
      Alert.alert(tr('gems.errorTitle'), msg);
    } finally {
      setBuyingFreeze(false);
    }
  }, [buyingFreeze, gems, FREEZE_COST, tr, load]);

  // Le héros s'assombrit quand la flamme est éteinte : le dégradé orange sur
  // une flamme grise envoyait un signal contradictoire.
  const degradeHero: [string, string, string] = lit
    ? (T.isDark ? ['#C9661A', '#A8481A', '#7E3216'] : ['#FFA43A', '#F27A1A', '#E0601A'])
    : (T.isDark ? ['#3A2E3A', '#2A2030', '#1A1622'] : ['#8C7A86', '#6E5C6E', '#4E4258']);

  const freezeDispo = gems >= FREEZE_COST;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Héros ── */}
        <LinearGradient colors={degradeHero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          {/* Halo central, pour que la flamme ne flotte pas sur un aplat. */}
          <View style={styles.heroHalo} pointerEvents="none" />

          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
              <Feather name="chevron-left" size={26} color={lit ? '#B4560A' : '#4E4258'} />
            </Pressable>
            <Text style={styles.heroTitle}>{tr('streak.headerTitle')}</Text>
            <Pressable style={styles.gemChip} onPress={() => router.push('/(app)/gems')}>
              <GemIcon size={13} color="#BFE9FF" />
              <Text style={styles.gemChipVal}>{gems.toLocaleString()}</Text>
            </Pressable>
          </View>

          {/* Ma série / Entre amis — l'onglet amis ouvre la page Amis. */}
          {friendsEnabled && (
            <View style={styles.tabs}>
              <View style={[styles.tab, styles.tabOn]}>
                <FlameIcon size={14} />
                <Text style={[styles.tabText, { color: lit ? '#B4560A' : '#4E4258' }]}>{tr('streak.tabMine')}</Text>
              </View>
              <Pressable style={styles.tab} onPress={() => router.push('/(app)/friends')}>
                <Feather name="users" size={14} color="#fff" />
                <Text style={[styles.tabText, { color: '#fff' }]}>{tr('streak.tabFriends')}</Text>
              </Pressable>
            </View>
          )}

          {/* Anneau + flamme */}
          <View style={styles.ringWrap}>
            <Svg width={200} height={200} viewBox="0 0 200 200" style={styles.ringSvg}>
              <Circle cx={100} cy={100} r={RING_R} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={8} />
              {ringPct > 0 && (
                <Circle
                  cx={100} cy={100} r={RING_R}
                  fill="none" stroke="#FFE07A" strokeWidth={8} strokeLinecap="round"
                  strokeDasharray={`${RING_C * ringPct} ${RING_C}`}
                  // -90° pour démarrer en haut et non à 3 h.
                  transform="rotate(-90 100 100)"
                />
              )}
            </Svg>
            <View style={styles.ringDisc} />
            <HeroFlame lit={lit} />
            <Text style={styles.ringLabel}>
              {goal > 0 ? tr('streak.ringLabel', { n: streak, goal }) : tr('streak.noGoal')}
            </Text>
          </View>

          <Text style={styles.heroNum} adjustsFontSizeToFit numberOfLines={1}>{streak}</Text>
          <Text style={styles.heroLine}>
            {lit
              ? (streak > 1 ? tr('streak.headerSubMany', { n: streak }) : tr('streak.headerSubOne', { n: streak }))
              : tr('streak.heroExtinct')}
          </Text>

          <View style={styles.heroChips}>
            <HeroChip>
              <FreezeIcon size={13} color="#BFE9FF" />
              <Text style={styles.heroChipTxt}>
                {streakFreezes === 1 ? tr('streak.freezeLabel', { n: 1 }) : tr('streak.freezesLabel', { n: streakFreezes })}
              </Text>
            </HeroChip>
            {goal > 0 && (
              <HeroChip>
                <Feather name="target" size={13} color="#fff" />
                <Text style={styles.heroChipTxt}>{tr('streak.goalLabel', { n: goal })}</Text>
              </HeroChip>
            )}
          </View>
        </LinearGradient>

        {/* ── Carte d'état, chevauchant le héros ── */}
        <View style={[styles.carteFlottante, styles.carteAlive, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}>
          <View style={styles.aliveIcone}>
            <FlameIcon size={30} color={lit ? '#F4633A' : T.textTertiary} inner={lit ? '#FFD95E' : T.lockedBg} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.aliveTitre, { color: T.text }]}>
              {lit ? tr('streak.aliveTitle') : tr('streak.headerSubZero')}
            </Text>
            <Text style={[styles.aliveSous, { color: T.textSecondary }]}>
              {lit && goal > streak
                ? tr('streak.aliveSubGoal', { n: goal - streak })
                : tr('streak.aliveSubNoGoal')}
            </Text>
          </View>
        </View>

        {/* ── Restauration payante ──
         *
         * Affichée tant qu'il reste des jours à récupérer (`lastStreakValue`),
         * ou quand la flamme est éteinte — c'est là qu'on cherche la
         * restauration, et le cas « rien à restaurer » doit alors s'expliquer.
         * Sur une série bien vivante et sans rien à reprendre, la carte
         * n'aurait aucun sens : un bandeau « SÉRIE PERDUE » et un bouton
         * « Payer » grisé au-dessus d'une flamme qui brûle. */}
        {paymentsEnabled && (recoverable > 0 || !lit) && (
          // Toute la carte est tactile : viser le seul bouton du bas sur une
          // carte aussi dense est inconfortable au pouce.
          <Pressable
            style={[styles.carteRestaure, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}
            onPress={onRepair}
            disabled={repairing || recoverable === 0}
          >
            <View style={styles.liseret} />
            <Text style={styles.badgePerdu}>{tr('streak.lostBadge')}</Text>
            <Text style={[styles.perduTitre, { color: T.text }]}>{tr('streak.repairTitle')}</Text>
            <Text style={[styles.perduSous, { color: T.textSecondary }]}>
              {recoverable > 0
                ? (recoverable > 1
                    ? tr('streak.repairHintMany', { n: recoverable })
                    : tr('streak.repairHintOne', { n: recoverable }))
                : tr('streak.repairHintNone')}
            </Text>

            {recoverable > 0 && (
              <View style={[styles.offreBox, { backgroundColor: T.isDark ? 'rgba(244,99,58,0.10)' : '#FFEEE4' }]}>
                <View style={[styles.offreIcone, { backgroundColor: T.cardBg }]}>
                  <Feather name="credit-card" size={20} color="#F4633A" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.badgePayante}>{tr('streak.paidBadge')}</Text>
                  <Text style={[styles.offreDesc, { color: T.text }]}>
                    {recoverable > 1
                      ? tr('streak.paidDescMany', { n: recoverable })
                      : tr('streak.paidDescOne', { n: recoverable })}
                  </Text>
                </View>
              </View>
            )}

            <View
              style={[
                styles.boutonRallumer,
                recoverable === 0 && { backgroundColor: '#B0B5BE', borderBottomColor: '#949AA4' },
                repairing && { opacity: 0.6 },
              ]}
            >
              {repairing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="credit-card" size={18} color="#fff" />
                  <Text style={styles.boutonRallumerTxt}>
                    {recoverable > 0
                      ? tr('streak.repairCtaPay', { n: recoverable })
                      : tr('streak.repairCtaPayDefault')}
                  </Text>
                </>
              )}
            </View>
            {recoverable > 0 && (
              <Text style={[styles.noteSecure, { color: T.textSecondary }]}>{tr('streak.secureNote')}</Text>
            )}
          </Pressable>
        )}

        {/* ── Paliers ── */}
        <Text style={[styles.titreSection, { color: T.text }]}>{tr('streak.milestones')}</Text>
        <View style={[styles.carte, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}>
          <View style={[styles.barrePaliers, { backgroundColor: T.isDark ? '#221F2A' : '#F0EDE8' }]}>
            <LinearGradient
              colors={['#FFB13D', '#F4633A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.barrePaliersRemplie, { width: `${pctPaliers}%` }]}
            />
          </View>
          <View style={styles.paliers}>
            {MILESTONES.map((m, i) => {
              const ok = streak >= m.d;
              const suivant = i === atteints;
              return (
                <View key={m.d} style={styles.palier}>
                  <View
                    style={[
                      styles.palierRond,
                      ok
                        ? styles.palierRondOk
                        : { backgroundColor: T.cardBg, borderWidth: 2, borderColor: suivant ? '#1CB0F6' : T.border },
                    ]}
                  >
                    {ok ? (
                      <FlameIcon size={16} color="#FFE07A" inner="#fff" />
                    ) : suivant ? (
                      <GemIcon size={15} color="#1CB0F6" />
                    ) : (
                      <Feather name="lock" size={13} color={T.textTertiary} />
                    )}
                  </View>
                  <Text style={[styles.palierJours, { color: T.text }]}>{tr('streak.milestoneDays', { n: m.d })}</Text>
                  <View style={styles.palierGain}>
                    <Text style={[styles.palierGainTxt, { color: T.isDark ? '#5CC8FF' : '#1E8FD0' }]}>+{m.gems}</Text>
                    <GemIcon size={10} color="#1CB0F6" />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Gels de série ── */}
        <View style={[styles.carteGel, { backgroundColor: T.isDark ? 'rgba(28,176,246,0.10)' : '#E8F5FD' }]}>
          <View style={styles.gelSlots}>
            {[0, 1].map((i) => {
              const plein = i < streakFreezes;
              return (
                <View
                  key={i}
                  style={[
                    styles.gelSlot,
                    plein
                      ? styles.gelSlotPlein
                      : { backgroundColor: T.isDark ? 'rgba(28,176,246,0.14)' : '#D3EAF8' },
                  ]}
                >
                  <FreezeIcon size={18} color={plein ? '#fff' : 'rgba(28,176,246,0.5)'} />
                </View>
              );
            })}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.gelTitre, { color: T.text }]}>{tr('streak.freezeCardTitle')}</Text>
            <Text style={[styles.gelSous, { color: T.textSecondary }]}>{tr('streak.freezeCardSub')}</Text>
          </View>
          <Pressable
            style={[styles.gelBouton, !freezeDispo && { backgroundColor: '#9AA6B2' }]}
            onPress={onBuyFreeze}
            disabled={buyingFreeze || !freezeDispo}
          >
            {buyingFreeze ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <GemIcon size={12} color="#fff" />
                <Text style={styles.gelBoutonTxt}>{FREEZE_COST}</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* ── Objectif ── */}
        <Pressable
          style={[styles.ligneObjectif, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}
          onPress={() => router.push('/(app)/streak-goal')}
        >
          <View style={[styles.objIcone, { backgroundColor: T.isDark ? 'rgba(240,130,12,0.15)' : '#FFEEDD' }]}>
            <Feather name="target" size={20} color="#F27A1A" />
          </View>
          <Text style={[styles.objTxt, { color: T.text }]}>
            {streakGoal ? tr('streak.goalEdit') : tr('streak.goalSet')}
          </Text>
          <Feather name="chevron-right" size={18} color={T.textSecondary} />
        </Pressable>

        {/* ── Calendrier du mois ── */}
        <View style={styles.enteteMois}>
          <Text style={[styles.titreSection, styles.titreSectionInline, { color: T.text }]}>{moisLabel}</Text>
          {history != null && (
            <Text style={[styles.moisCompte, { color: T.textSecondary }]}>
              {nbLus === 1 ? tr('streak.monthReadOne', { n: nbLus }) : tr('streak.monthReadMany', { n: nbLus })}
            </Text>
          )}
        </View>

        <View style={[styles.carte, styles.carteCal, { backgroundColor: T.cardBg, shadowColor: T.shadow }]}>
          {error ? (
            <View style={styles.boiteEtat}>
              <Feather name="wifi-off" size={26} color={T.textTertiary} />
              <Text style={[styles.etatTxt, { color: T.textSecondary }]}>{tr('streak.loadError')}</Text>
              <Pressable style={styles.retry} onPress={load}>
                <Text style={styles.retryTxt}>{tr('common.retry')}</Text>
              </Pressable>
            </View>
          ) : history == null ? (
            <View style={styles.boiteEtat}>
              <ActivityIndicator size="large" color="#F0820C" />
            </View>
          ) : (
            <>
              <View style={styles.grille}>
                {JOURS_SEM.map((j, i) => (
                  <View key={`h${i}`} style={styles.celluleWrap}>
                    <Text style={[styles.jourSem, { color: T.textSecondary }]}>{j}</Text>
                  </View>
                ))}
                {jours.map((c) => (
                  <View key={c.key} style={styles.celluleWrap}>
                    {c.d == null ? (
                      <View style={styles.cellule} />
                    ) : (
                      <View
                        style={[
                          styles.cellule,
                          c.gele && styles.celluleGel,
                          c.lu && styles.celluleLue,
                          c.manque && styles.celluleManquee,
                          c.cejour && !c.lu && !c.gele && styles.celluleCeJour,
                          c.futur && { opacity: 0.45 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.celluleTxt,
                            { color: c.lu || c.gele ? '#fff' : c.cejour ? '#F27A1A' : c.manque ? '#E5484D' : T.textSecondary },
                          ]}
                        >
                          {c.d}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              <View style={[styles.legende, { borderTopColor: T.divider }]}>
                <View style={styles.legendeItem}>
                  <View style={[styles.legendePuce, styles.celluleLue]} />
                  <Text style={[styles.legendeTxt, { color: T.textSecondary }]}>{tr('streak.legendRead')}</Text>
                </View>
                <View style={styles.legendeItem}>
                  <View style={[styles.legendePuce, styles.celluleGel]} />
                  <Text style={[styles.legendeTxt, { color: T.textSecondary }]}>{tr('streak.legendFreeze')}</Text>
                </View>
                <View style={styles.legendeItem}>
                  <View style={[styles.legendePuce, styles.celluleManquee]} />
                  <Text style={[styles.legendeTxt, { color: T.textSecondary }]}>{tr('streak.legendMissed')}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {session && (
        <DexPayCheckout
          visible
          paymentUrl={session.paymentUrl}
          reference={session.reference}
          onDone={(outcome) => {
            setSession(null);
            if (outcome === 'success') {
              load();
              Alert.alert(tr('streak.repairOkTitle'), tr('streak.repairOkMsg'));
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', alignSelf: 'stretch', marginTop: 12, padding: 4, gap: 4,
    borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.14)',
  },
  tab: { flex: 1, height: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: '#fff' },
  tabText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14 },
  screen: { flex: 1 },
  scroll: { paddingBottom: 12 },

  /* ── Héros ── */
  hero: {
    paddingTop: 10, paddingBottom: 30, paddingHorizontal: 18,
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

  ringWrap: { width: 200, height: 200, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute' },
  ringDisc: {
    position: 'absolute', width: 156, height: 156, borderRadius: 78,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  flammeWrap: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  flammeCoeur: { position: 'absolute', bottom: 8 },
  ringLabel: {
    position: 'absolute', bottom: 22,
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: 'rgba(255,255,255,0.9)',
  },

  // Pas de lineHeight : Baloo 2 a une ascendante haute, un lineHeight serré
  // rogne le chiffre par le haut.
  heroNum: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 68, color: '#fff', marginTop: 2 },
  heroLine: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: 'rgba(255,255,255,0.95)', marginTop: -4 },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  heroChipTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#fff' },

  /* ── Cartes ── */
  carteFlottante: {
    marginHorizontal: 18, marginTop: -18, borderRadius: 24, padding: 16, overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 6,
  },
  // Même carte, mais posée dans le flux : elle suit la carte d'état au lieu
  // de chevaucher le héros.
  carteRestaure: {
    marginHorizontal: 18, marginTop: 12, borderRadius: 24, padding: 16, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3,
  },
  liseret: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#F4633A' },
  badgePerdu: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 1, color: '#F4633A' },
  perduTitre: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, marginTop: 8 },
  perduSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 3 },
  offreBox: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 12, marginTop: 14 },
  offreIcone: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgePayante: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, letterSpacing: 0.8, color: '#F4633A' },
  offreDesc: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, marginTop: 1 },
  boutonRallumer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 54, borderRadius: 16, marginTop: 12, backgroundColor: '#F4633A',
    borderBottomWidth: 4, borderBottomColor: '#C9441E',
  },
  boutonRallumerTxt: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: '#fff' },
  noteSecure: { fontFamily: 'Nunito_700Bold', fontSize: 11, textAlign: 'center', marginTop: 8 },

  carteAlive: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aliveIcone: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(244,99,58,0.12)',
  },
  aliveTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  aliveSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },

  titreSection: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginHorizontal: 20, marginTop: 24, marginBottom: 10 },
  titreSectionInline: { marginHorizontal: 0, marginTop: 0, marginBottom: 0 },
  enteteMois: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginHorizontal: 20, marginTop: 24, marginBottom: 10, gap: 10,
  },
  moisCompte: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },

  carte: {
    marginHorizontal: 18, borderRadius: 24, padding: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },

  /* ── Paliers ── */
  barrePaliers: { height: 8, borderRadius: 4, marginHorizontal: 14, overflow: 'hidden' },
  barrePaliersRemplie: { height: '100%', borderRadius: 4 },
  paliers: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -22 },
  palier: { flex: 1, alignItems: 'center', gap: 5 },
  palierRond: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  palierRondOk: {
    backgroundColor: '#F4633A',
    borderWidth: 3, borderColor: '#FFD36B',
  },
  palierJours: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15 },
  palierGain: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  palierGainTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },

  /* ── Gels ── */
  carteGel: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 18, marginTop: 12, borderRadius: 24, padding: 16,
  },
  gelSlots: { flexDirection: 'row', gap: 6 },
  gelSlot: { width: 40, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gelSlotPlein: { backgroundColor: '#2BA8EC' },
  gelTitre: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  gelSous: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  gelBouton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    minWidth: 58, height: 36, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#2BA8EC',
  },
  gelBoutonTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },

  /* ── Objectif ── */
  ligneObjectif: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 18, marginTop: 12, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2,
  },
  objIcone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  objTxt: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },

  /* ── Calendrier ── */
  carteCal: { paddingHorizontal: 12, paddingVertical: 14 },
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  // Les sept colonnes se partagent la largeur. `14.2857%` (= 100/7) évite le
  // débordement qu'un `flex: 1` dans un wrap provoque.
  celluleWrap: { width: '14.2857%', paddingHorizontal: 2, paddingVertical: 3 },
  jourSem: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, textAlign: 'center', paddingBottom: 4 },
  cellule: { height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  celluleLue: { backgroundColor: '#F4633A' },
  celluleGel: { backgroundColor: '#2BA8EC' },
  celluleManquee: { borderWidth: 1.5, borderColor: 'rgba(229,72,77,0.55)' },
  celluleCeJour: { borderWidth: 2, borderColor: '#F4633A' },
  celluleTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  legende: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 14,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendePuce: { width: 11, height: 11, borderRadius: 4 },
  legendeTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },

  /* ── États (chargement, erreur) ── */
  boiteEtat: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 32, paddingHorizontal: 20 },
  etatTxt: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center' },
  retry: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F0820C' },
  retryTxt: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

});
