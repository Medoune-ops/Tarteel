import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { LIGUES } from '../../constants/ligues';
import { fetchPodiums, claimPodium, fetchMyLeague, ApiError, type PodiumEntry } from '../../lib/api';
import { playSound } from '../../constants/sounds';
import { useT } from '../../lib/i18n';
import { useTheme } from '../../utils/useTheme';
import DeviceStatusBar from '../../components/StatusBar';
import Otter from '../../components/Otter';
import OfflineState from '../../components/OfflineState';
import { TrophyIcon, GemIcon } from '../../components/IslamicIcons';

// ─── Palette de la maquette (Tarteel Widgets et Podiums) ───────────────────
type Palette = {
  bg: string; card: string; ink: string; muted: string;
  hero: readonly [string, string, string];
  pendBg: string; pendBorder: string; pendRow: string; okInk: string;
};
const LIGHT: Palette = {
  bg: '#F5F4F1', card: '#FFFFFF', ink: '#1C1A26', muted: '#6F6C7A',
  hero: ['#F2B33D', '#E0A02C', '#C9821A'],
  pendBg: '#FFF7E4', pendBorder: '#F0CD7A', pendRow: '#FFF7E4', okInk: '#2E9A5A',
};
const DARK: Palette = {
  bg: '#0D0C11', card: '#17161E', ink: '#EFEEF4', muted: '#9290A2',
  hero: ['#B9852A', '#9A6A1C', '#6E4A12'],
  pendBg: 'rgba(224,160,44,0.12)', pendBorder: 'rgba(224,160,44,0.4)', pendRow: 'rgba(224,160,44,0.1)', okInk: '#5CD08C',
};

const G155 = { start: { x: 0.29, y: 0 }, end: { x: 0.71, y: 1 } };

const MEDALS: Record<1 | 2 | 3, { colors: readonly [string, string]; ring: [string, string] }> = {
  1: { colors: ['#FFD866', '#E0A02C'], ring: ['rgba(224,160,44,0.22)', 'rgba(224,160,44,0.3)'] },
  2: { colors: ['#D9DEE6', '#9AA3B2'], ring: ['rgba(154,163,178,0.25)', 'rgba(154,163,178,0.3)'] },
  3: { colors: ['#E7A872', '#B86A34'], ring: ['rgba(184,106,52,0.22)', 'rgba(184,106,52,0.3)'] },
};

/** Couronne pleine (glyphe « crown » de la maquette). */
function Crown({ size = 28, color = '#FFE27A' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M2.5 7.5l4.8 4 4.7-7 4.7 7 4.8-4-2 11h-15z M4.5 20.5h15"
        fill={color} stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round"
      />
    </Svg>
  );
}

/** Marche du podium : dégradé vertical + liseré bas foncé et reflet haut. */
function Step({ width, height, colors, inset, children }: {
  width: number; height: number; colors: readonly [string, string]; inset: string; children: React.ReactNode;
}) {
  return (
    <LinearGradient colors={colors} style={[st.step, { width, height }]}>
      <View style={st.stepHighlight} />
      <View style={[st.stepInset, { backgroundColor: inset }]} />
      {children}
    </LinearGradient>
  );
}

function PodiumHero({ P, p1, p2, p3, wins, top3, league, onBack }: {
  P: Palette; p1: number; p2: number; p3: number; wins: number; top3: number; league: string; onBack: () => void;
}) {
  const tr = useT();
  return (
    <LinearGradient colors={P.hero} locations={[0, 0.5, 1]} {...G155} style={st.hero}>
      <DeviceStatusBar />
      <View style={st.heroBar}>
        <Pressable onPress={onBack} hitSlop={10} style={st.backBtn}>
          <Feather name="chevron-left" size={24} color="#9A5A00" />
        </Pressable>
        <Text style={st.heroTitle}>{tr('podiums.headerTitle')}</Text>
      </View>

      <View style={st.podiumWrap}>
        {/* Halo radial derrière la loutre */}
        <Svg width={260} height={180} style={st.glow}>
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFF0BE" stopOpacity={0.55} />
              <Stop offset="0.65" stopColor="#FFF0BE" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={130} cy={90} rx={130} ry={90} fill="url(#glow)" />
        </Svg>

        <View style={st.steps}>
          <View style={st.col2}>
            <Text style={st.countSm}>{p2}×</Text>
            <Step width={84} height={64} colors={['#E4E8EE', '#A9B1BE']} inset="#8A93A2">
              <View style={st.rankBubble}><Text style={st.rankText}>2</Text></View>
            </Step>
          </View>

          <View style={st.col1}>
            <View style={st.otterWrap}>
              <Otter size={78} />
              <View style={st.crown}><Crown /></View>
            </View>
            <Text style={st.countLg}>{p1}×</Text>
            <Step width={98} height={96} colors={['#FFE27A', '#E0A02C']} inset="#B47E12">
              <View style={st.trophyBubble}><TrophyIcon size={20} color="#fff" /></View>
            </Step>
          </View>

          <View style={st.col2}>
            <Text style={st.countSm}>{p3}×</Text>
            <Step width={84} height={46} colors={['#F2B98A', '#C9733C']} inset="#A65A2A">
              <View style={st.rankBubble}><Text style={st.rankText}>3</Text></View>
            </Step>
          </View>
        </View>
        <View style={st.base} />
      </View>

      <View style={st.stats}>
        <View style={st.stat}>
          <Text style={st.statValue}>{wins}</Text>
          <Text style={st.statLabel}>{tr('podiums.statWins')}</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statValue}>{top3}</Text>
          <Text style={st.statLabel}>{tr('podiums.statPodiums')}</Text>
        </View>
        <View style={st.stat}>
          <Text style={st.statValue} numberOfLines={1} adjustsFontSizeToFit>{league}</Text>
          <Text style={st.statLabel}>{tr('podiums.statLeague')}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

export default function PodiumsScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = T.isDark ? DARK : LIGHT;

  // Historique RÉEL des podiums (GET /me/podiums). Vide = aucun trophée gagné.
  const [entries, setEntries] = useState<PodiumEntry[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  // Ligue de la semaine en cours (GET /leagues/me) — secondaire : un échec
  // ne bloque pas l'écran, on retombe sur la meilleure ligue de l'historique.
  const [currentLeague, setCurrentLeague] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    fetchMyLeague()
      .then((v) => setCurrentLeague(v.league?.nom.replace(/^Ligue\s+/i, '') ?? null))
      .catch(() => {});
    try {
      setEntries(await fetchPodiums());
    } catch (e) {
      setError(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const claim = async (ref: string) => {
    if (claiming) return;
    setClaiming(ref);
    try {
      const gained = await claimPodium(ref);
      playSound('finish');
      Alert.alert(tr('podiums.claimAlertTitle'), tr('podiums.claimAlertMsg', { n: gained }));
      await load(); // rafraîchit l'état "réclamé"
    } catch (e) {
      Alert.alert(tr('podiums.errorTitle'), e instanceof ApiError ? e.message : tr('podiums.claimError'));
    } finally {
      setClaiming(null);
    }
  };

  // « Tout récupérer » : réclame chaque podium en attente l'un après l'autre.
  // TODO backend : un endpoint groupé (POST /me/podiums/claim-all) éviterait
  // N appels — remplacer cette boucle quand il existera.
  const claimAll = async (pending: PodiumEntry[]) => {
    if (claiming) return;
    setClaiming('all');
    let total = 0;
    try {
      for (const e of pending) total += await claimPodium(e.id);
      playSound('finish');
      Alert.alert(tr('podiums.claimAlertTitle'), tr('podiums.claimAlertMsg', { n: total }));
    } catch (e) {
      Alert.alert(tr('podiums.errorTitle'), e instanceof ApiError ? e.message : tr('podiums.claimError'));
    } finally {
      await load();
      setClaiming(null);
    }
  };

  const list = entries ?? [];
  const pending = list.filter((e) => !e.claimed);
  const pendingXp = pending.reduce((a, e) => a + e.reward, 0);
  const p1 = list.filter((e) => e.rang === 1).length;
  const p2 = list.filter((e) => e.rang === 2).length;
  const p3 = list.filter((e) => e.rang === 3).length;
  const order: Record<string, number> = { bronze: 1, argent: 2, or: 3, emeraude: 4, diamant: 5 };
  const best = list.reduce<PodiumEntry | null>(
    (b, e) => (LIGUES[e.ligue] && (!b || order[e.ligue] > order[b.ligue]) ? e : b), null,
  );
  const leagueLabel = currentLeague
    ?? (best ? LIGUES[best.ligue].nom.replace(/^Ligue\s+/i, '') : '—');

  const rankLabel = (r: 1 | 2 | 3) => tr(r === 1 ? 'podiums.rank1' : r === 2 ? 'podiums.rank2' : 'podiums.rank3');

  return (
    <View style={[st.screen, { backgroundColor: P.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <PodiumHero
          P={P} p1={p1} p2={p2} p3={p3} wins={p1} top3={list.length}
          league={leagueLabel} onBack={() => router.back()}
        />

        {!entries && !error && (
          <View style={st.centerState}>
            <ActivityIndicator size="large" color="#E0A02C" />
            <Text style={[st.stateText, { color: P.muted }]}>{tr('podiums.loading')}</Text>
          </View>
        )}

        {!!error && (
          <View style={{ minHeight: 320 }}>
            <OfflineState error={error} onRetry={load} />
          </View>
        )}

        {entries && pending.length > 0 && (
          <View style={[st.pending, { backgroundColor: P.pendBg, borderColor: P.pendBorder }]}>
            <GemIcon size={26} color="#E0A02C" />
            <View style={{ flex: 1 }}>
              <Text style={[st.pendTitle, { color: P.ink }]}>
                {tr(pending.length > 1 ? 'podiums.pendingMany' : 'podiums.pendingOne', { n: pending.length, xp: pendingXp })}
              </Text>
              <Text style={[st.pendSub, { color: P.muted }]}>{tr('podiums.pendingSub')}</Text>
            </View>
            <Pressable style={st.goldBtn} disabled={claiming != null} onPress={() => claimAll(pending)}>
              {claiming === 'all'
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={st.goldBtnText}>{tr('podiums.claimAll')}</Text>}
            </Pressable>
          </View>
        )}

        {entries && (
          <>
            <Text style={[st.sectionLabel, { color: P.muted }]}>{tr('podiums.historyLabel')}</Text>

            {list.length === 0 ? (
              <View style={st.emptyBox}>
                <TrophyIcon size={48} color="#E0A02C" />
                <Text style={[st.emptyTitle, { color: P.ink }]}>{tr('podiums.emptyTitle')}</Text>
                <Text style={[st.emptyText, { color: P.muted }]}>{tr('podiums.emptyText')}</Text>
              </View>
            ) : (
              <View style={[st.history, { backgroundColor: P.card }, !T.isDark && st.shadow]}>
                {list.map((e) => {
                  const m = MEDALS[e.rang] ?? MEDALS[3];
                  const ligue = LIGUES[e.ligue] ?? LIGUES.bronze;
                  return (
                    <View key={e.id} style={[st.row, !e.claimed && { backgroundColor: P.pendRow }]}>
                      <View style={[st.medalRing, { backgroundColor: m.ring[T.isDark ? 1 : 0] }]}>
                        <LinearGradient colors={m.colors} style={st.medal}>
                          <View style={st.medalInset} />
                          <Text style={st.medalText}>{e.rang}</Text>
                        </LinearGradient>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[st.rowTitle, { color: P.ink }]}>{tr('podiums.weekLabel', { n: e.semaine })}</Text>
                        <Text style={[st.rowSub, { color: P.muted }]} numberOfLines={1}>
                          {ligue.nom} · {rankLabel(e.rang)}
                        </Text>
                      </View>
                      {e.claimed ? (
                        <View style={st.claimed}>
                          <Feather name="check" size={14} color={P.okInk} />
                          <Text style={[st.claimedText, { color: P.okInk }]}>+{e.reward} XP</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={[st.goldBtn, st.goldBtnSm]}
                          disabled={claiming != null}
                          onPress={() => claim(e.id)}
                        >
                          {claiming === e.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <GemIcon size={13} color="#fff" />
                              <Text style={st.goldBtnText}>+{e.reward}</Text>
                            </>
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1 },

  hero: {
    paddingHorizontal: 20, paddingBottom: 22,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden',
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 4,
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },

  podiumWrap: { alignItems: 'center', marginTop: 8 },
  glow: { position: 'absolute', top: 10 },
  steps: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  col1: { width: 98, alignItems: 'center' },
  col2: { width: 84, alignItems: 'center' },
  otterWrap: { marginBottom: -14, zIndex: 1, alignItems: 'center' },
  crown: { position: 'absolute', top: -12 },
  countSm: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 22, color: '#fff' },
  countLg: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, lineHeight: 28, color: '#fff', marginTop: 14 },
  step: {
    marginTop: 6, alignItems: 'center', paddingTop: 8, overflow: 'hidden',
    borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
  },
  stepHighlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  stepInset: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 6 },
  rankBubble: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, lineHeight: 22, color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2,
  },
  trophyBubble: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  base: { width: 290, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.15)' },

  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: {
    flex: 1, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center',
  },
  statValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: '#fff' },
  statLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: 'rgba(255,255,255,0.9)' },

  centerState: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },

  pending: {
    marginTop: 16, marginHorizontal: 18, paddingVertical: 14, paddingLeft: 16, paddingRight: 14,
    borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  pendTitle: { fontFamily: 'Nunito_900Black', fontSize: 14 },
  pendSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  goldBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#E0A02C',
    borderBottomWidth: 3, borderBottomColor: '#B47E12',
  },
  goldBtnSm: { paddingVertical: 9, paddingHorizontal: 12 },
  goldBtnText: { fontFamily: 'Nunito_900Black', fontSize: 13, color: '#fff' },

  sectionLabel: {
    fontFamily: 'Nunito_900Black', fontSize: 12, letterSpacing: 1,
    paddingTop: 24, paddingHorizontal: 22, paddingBottom: 10,
  },
  history: { marginHorizontal: 18, borderRadius: 22, padding: 6 },
  shadow: {
    shadowColor: '#28200A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16 },
  medalRing: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  medal: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  medalInset: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.15)' },
  medalText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, lineHeight: 24, color: '#fff' },
  rowTitle: { fontFamily: 'Nunito_900Black', fontSize: 15 },
  rowSub: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  claimed: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  claimedText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },

  emptyBox: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24, gap: 8 },
  emptyTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18 },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
