import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing, ActivityIndicator, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../../components/StatusBar';
import { useTheme } from '../../../utils/useTheme';
import { useScrollToTopOnTabPress } from '../../../utils/useScrollToTopOnTabPress';
import { getOrJoinLeague, type LeagueView, type LeagueMember } from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { useT, type I18nKey } from '../../../lib/i18n';
import OfflineState from '../../../components/OfflineState';

// Style VISUEL du podium par rang (avatar, marche). Les DONNÉES (nom,
// initiales, xp) viennent du backend ; seul l'habillage est ici.
type PodiumStyle = {
  avatar: number; step: number; avatarColors: readonly [string, string]; ring: string;
  rankColor: string; rankSize: number;
  stepLight: readonly [string, string]; stepDark: readonly [string, string];
};
const PODIUM_STYLE: Record<number, PodiumStyle> = {
  1: { avatar: 72, step: 124, avatarColors: ['#FFD25C', '#F5A800'], ring: '#F5B820', rankColor: '#E5A400', rankSize: 36,
       stepLight: ['#FFE9A8', '#FFF4D6'], stepDark: ['rgba(245,184,32,0.35)', 'rgba(245,184,32,0.08)'] },
  2: { avatar: 58, step: 88, avatarColors: ['#C9CED8', '#9AA2B1'], ring: '#B5BCC8', rankColor: '#9AA2B1', rankSize: 30,
       stepLight: ['#E3E7EE', '#F1F3F7'], stepDark: ['rgba(181,188,200,0.28)', 'rgba(181,188,200,0.06)'] },
  3: { avatar: 58, step: 66, avatarColors: ['#E2A574', '#C07A45'], ring: '#D69060', rankColor: '#C07A45', rankSize: 28,
       stepLight: ['#F5D9C2', '#FBEDE2'], stepDark: ['rgba(214,144,96,0.3)', 'rgba(214,144,96,0.06)'] },
};

// Ordre d'affichage du podium : 2e à gauche, 1er au centre, 3e à droite.
const PODIUM_ORDER = [2, 1, 3];

// Ordre des ligues, de la plus basse à la plus haute (clés normalisées).
const LEAGUE_ORDER = ['bronze', 'argent', 'or', 'emeraude', 'saphir', 'rubis', 'diamant'];

// Habillage de la carte d'en-tête selon la vraie ligue de l'utilisateur.
// `colors` = dégradé du fond, `shadow` = ombre « marche » sous la carte.
// Clé = nom de ligue normalisé (minuscules, sans accents). Fallback = 'or'.
type LeagueTheme = { colors: readonly [string, string, string]; shadow: string };
const LEAGUE_THEME: Record<string, LeagueTheme> = {
  bronze:   { colors: ['#E6B07A', '#C67E3A', '#A75F1E'], shadow: '#87481A' },
  argent:   { colors: ['#C9D2DE', '#A2AEBF', '#8391A5'], shadow: '#6B7A90' },
  or:       { colors: ['#FFC247', '#F0A41E', '#E07A0C'], shadow: '#B5600A' },
  emeraude: { colors: ['#2BC07A', '#17A062', '#0E8350'], shadow: '#0B6B41' },
  saphir:   { colors: ['#6FB4FF', '#3B82F6', '#1E5FD6'], shadow: '#1749A8' },
  rubis:    { colors: ['#FF7A8A', '#F0384E', '#C71F33'], shadow: '#9E1828' },
  diamant:  { colors: ['#7FE7FF', '#3BC4E6', '#1E97C7'], shadow: '#17779E' },
};

/** Normalise un nom de ligue backend (français, avec accents) en clé stable. */
function leagueKey(nom?: string | null): string {
  // NFD sépare lettre + accent ; ̀-ͯ = plage des diacritiques combinants.
  return (nom ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Choisit l'habillage de la carte à partir du nom de ligue (fallback = or). */
function leagueTheme(nom?: string | null): LeagueTheme {
  return LEAGUE_THEME[leagueKey(nom)] ?? LEAGUE_THEME.or;
}

/** Libellé de ligue traduit (le backend renvoie toujours le nom en français). */
const LEAGUE_NAME_KEYS: Record<string, I18nKey> = {
  bronze: 'ligues.name.bronze',
  argent: 'ligues.name.argent',
  or: 'ligues.name.or',
  emeraude: 'ligues.name.emeraude',
  saphir: 'ligues.name.saphir',
  rubis: 'ligues.name.rubis',
  diamant: 'ligues.name.diamant',
};

/** Couleurs d'avatar des lignes du classement, stables par joueur. */
const ROW_COLORS = ['#E0407A', '#14A3B8', '#8A6BFF', '#F0820C', '#2FA81F', '#E5A400', '#1F9A6E'];
function rowColor(userId: string): string {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) | 0;
  return ROW_COLORS[Math.abs(h) % ROW_COLORS.length]!;
}

/** Formate un délai (ms) en "Jj Hh" (ex: 3 j 14 h). */
function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Terminé';
  const totalH = Math.floor(ms / 3_600_000);
  const j = Math.floor(totalH / 24);
  const h = totalH % 24;
  return j > 0 ? `${j} j ${h} h` : `${h} h`;
}

export default function LiguesScreen() {
  const T = useTheme();
  const tr = useT();
  const scrollRef = useScrollToTopOnTabPress();

  // Vue de ligue chargée depuis le backend (GET /leagues/me, auto-join sinon).
  const [view, setView] = useState<LeagueView | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // SWR : classement affiché immédiatement depuis le cache, refresh en fond.
      setView(await swrFetch('league', getOrJoinLeague, setView));
    } catch (e) {
      setError(e);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Valeurs d'animation à capacité fixe (podium ≤ 3, liste ≤ 8) — évite de
  // recréer des hooks quand les données changent.
  const rows = useRef(Array.from({ length: 8 }, () => new Animated.Value(0))).current;
  const podium = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    if (!view) return;
    Animated.stagger(90, podium.map((v) =>
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 })
    )).start();
    Animated.stagger(70, rows.map((v) =>
      Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    )).start();
  }, [view]);

  // ── États de chargement / erreur ──
  if (!view && !error) {
    return (
      <View style={[styles.screen, styles.centerState, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <ActivityIndicator size="large" color="#6B4DFF" />
        <Text style={[styles.stateText, { color: T.textSecondary }]}>{tr('ligues.loading')}</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <OfflineState error={error} onRetry={load} showOfflineExits />
      </View>
    );
  }

  const v = view!;
  const key = leagueKey(v.league?.nom);
  // Habillage de la carte d'en-tête selon la vraie ligue (bronze/argent/or/…).
  const lt = leagueTheme(v.league?.nom);
  // Le backend renvoie toujours le nom en français ("Or", "Argent"…) : on le
  // traduit via la clé normalisée, avec repli sur le nom brut si inconnu.
  const leagueNameKey = LEAGUE_NAME_KEYS[key];
  const leagueDisplayName = leagueNameKey ? tr(leagueNameKey) : (v.league?.nom ?? '—');
  const nextKey = LEAGUE_ORDER[LEAGUE_ORDER.indexOf(key) + 1];
  const nextName = nextKey ? tr(LEAGUE_NAME_KEYS[nextKey]!) : null;
  // Podium ordonné (2,1,3) à partir des données backend.
  const podiumByRank = new Map(v.podium.map((m) => [m.rang, m]));
  const podiumDisplay = PODIUM_ORDER
    .map((rank) => podiumByRank.get(rank))
    .filter((m): m is LeagueMember => !!m);
  const me = [...v.podium, ...v.around].find((m) => m.me) ?? null;
  // Barre de la carte : un segment par participant (borné), les places de
  // promotion allumées.
  const segments = Math.max(Math.min(v.participants, 12), v.promotionZone, 1);
  const promoLine = T.isDark ? 'rgba(43,192,122,0.35)' : 'rgba(23,160,98,0.3)';
  const relegLine = T.isDark ? 'rgba(255,75,75,0.35)' : 'rgba(255,75,75,0.3)';

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: T.text }]}>{tr('ligues.title')}</Text>
          <View style={[styles.infoBtn, { backgroundColor: T.selectorBg }]}>
            <Feather name="help-circle" size={19} color={T.textSecondary} />
          </View>
        </View>

        {/* Carte ligue — dégradé adapté à la vraie ligue de l'utilisateur,
            posée sur une « marche » de sa couleur sombre. */}
        <View style={[styles.cardStep, { backgroundColor: lt.shadow }]}>
          <LinearGradient colors={lt.colors} locations={[0, 0.55, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.leagueCard}>
            <View style={styles.cardGlow} pointerEvents="none" />
            <View style={styles.cardRow}>
              <View style={styles.medalBox}>
                <Feather name="award" size={26} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{tr('ligues.leagueName', { nom: leagueDisplayName })}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {v.semaine != null ? tr('ligues.weekLabel', { n: v.semaine }) : ''}
                  {tr(v.participants > 1 ? 'ligues.participants' : 'ligues.participant', { n: v.participants })}
                </Text>
              </View>
              <View style={styles.timerPill}>
                <Feather name="clock" size={13} color="#fff" />
                <Text style={styles.timerText}>{formatCountdown(v.msUntilEnd)}</Text>
              </View>
            </View>
            <View style={styles.segments}>
              {Array.from({ length: segments }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.segment, { backgroundColor: i < v.promotionZone ? '#fff' : 'rgba(255,255,255,0.3)' }]}
                />
              ))}
            </View>
            <View style={styles.cardFoot}>
              <Text style={styles.cardFootText}>{tr('ligues.topPromoted', { n: v.promotionZone })}</Text>
              <Text style={styles.cardFootText}>
                {nextName ? tr('ligues.nextLeague', { nom: nextName }) : tr('ligues.topLeague')}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Podium ── */}
        <View style={styles.podium}>
          {podiumDisplay.map((p, i) => {
            const first = p.rang === 1;
            const st = PODIUM_STYLE[p.rang] ?? PODIUM_STYLE[3]!;
            const anim = podium[i]!;
            return (
              <Animated.View
                key={p.userId}
                style={[
                  styles.podCol,
                  {
                    opacity: anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                  },
                ]}
              >
                {first && <Feather name="award" size={22} color="#F5B820" style={{ marginBottom: 2 }} />}
                <View
                  style={[
                    styles.podRing,
                    {
                      width: st.avatar + 6, height: st.avatar + 6, borderRadius: (st.avatar + 6) / 2,
                      backgroundColor: st.ring,
                    },
                    first && styles.podGlow,
                  ]}
                >
                  <LinearGradient
                    colors={st.avatarColors}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 0.8, y: 1 }}
                    style={[styles.podAvatar, {
                      width: st.avatar - 2, height: st.avatar - 2, borderRadius: st.avatar / 2,
                      borderColor: T.cardBg,
                    }]}
                  >
                    <Text style={[styles.podInitials, { fontSize: first ? 24 : 20 }]}>{p.initials}</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.podName, { color: T.text }]} numberOfLines={1}>{p.name}</Text>
                <View style={styles.podXpRow}>
                  <Feather name="zap" size={11} color="#F5B820" />
                  <Text style={[styles.podXp, { color: T.textSecondary }]}>{p.weeklyXp} XP</Text>
                </View>
                <LinearGradient
                  colors={T.isDark ? st.stepDark : st.stepLight}
                  style={[styles.podStep, { height: st.step }]}
                >
                  <Text style={[styles.podRank, { color: st.rankColor, fontSize: st.rankSize }]}>{p.rang}</Text>
                </LinearGradient>
              </Animated.View>
            );
          })}
        </View>

        {/* Bandeau promotion */}
        <View style={styles.zoneTag}>
          <View style={[styles.zoneLine, { backgroundColor: promoLine }]} />
          <View style={styles.zoneLabel}>
            <Feather name="trending-up" size={13} color="#17A062" />
            <Text style={[styles.zoneText, { color: '#17A062' }]}>{tr('ligues.promotionZone')}</Text>
          </View>
          <View style={[styles.zoneLine, { backgroundColor: promoLine }]} />
        </View>

        {/* Liste participants (animée) */}
        <View style={styles.list}>
          {v.around.map((p, i) => (
            <Animated.View
              key={p.userId}
              style={{
                opacity: rows[i] ?? 1,
                transform: [{ translateX: (rows[i] ?? new Animated.Value(1)).interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              }}
            >
              {/* Un seul bandeau, juste avant le premier joueur en relégation. */}
              {p.relegation && !v.around[i - 1]?.relegation && (
                <View style={styles.zoneTag}>
                  <View style={[styles.zoneLine, { backgroundColor: relegLine }]} />
                  <View style={styles.zoneLabel}>
                    <Feather name="trending-down" size={13} color="#FF4B4B" />
                    <Text style={[styles.zoneText, { color: '#FF4B4B' }]}>{tr('ligues.relegationZone')}</Text>
                  </View>
                  <View style={[styles.zoneLine, { backgroundColor: relegLine }]} />
                </View>
              )}

              <View
                style={[
                  styles.row,
                  { backgroundColor: T.cardBg, borderColor: p.me ? '#6B4DFF' : T.border },
                  p.me && { borderWidth: 2 },
                ]}
              >
                <View style={[styles.rankBox, { backgroundColor: p.me ? '#6B4DFF' : T.selectorBg }]}>
                  <Text style={[styles.rankText, { color: p.me ? '#fff' : p.relegation ? '#FF4B4B' : T.textSecondary }]}>{p.rang}</Text>
                </View>
                <View style={[styles.avatar, { backgroundColor: p.me ? '#6B4DFF' : rowColor(p.userId) }]}>
                  <Text style={styles.avatarText}>{p.initials}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: T.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[styles.rowSub, { color: p.relegation ? '#FF4B4B' : T.textSecondary }]} numberOfLines={1}>
                    {p.promotion ? tr('ligues.promotionTag') : p.relegation ? tr('ligues.relegationTag') : tr('ligues.maintenanceZone')}
                  </Text>
                </View>
                <View style={[styles.xpPill, { backgroundColor: T.selectorBg }]}>
                  <Feather name="zap" size={13} color="#F5B820" />
                  <Text style={[styles.xpText, { color: T.text }]}>{p.weeklyXp}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
          {v.around.length === 0 && (
            <Text style={[styles.emptyList, { color: T.textSecondary }]}>
              {tr('ligues.emptyList')}
            </Text>
          )}
        </View>

        {/* espace pour la carte sticky */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── Carte « ta position » fixée au-dessus de la TabBar ── */}
      <View style={styles.myStep}>
        <View style={styles.myCard}>
          <View style={styles.myRank}>
            <Text style={styles.myRankText}>{me?.rang ?? v.myRank ?? '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.myLabel}>{tr('ligues.myPosition')}</Text>
            <Text style={styles.myHint} numberOfLines={1}>
              {me?.promotion
                ? tr('ligues.myHintPromotion')
                : me?.relegation
                  ? tr('ligues.myHintRelegation')
                  : tr('ligues.myHintDefault', { n: v.participants })}
            </Text>
          </View>
          <View style={styles.myXp}>
            <Feather name="zap" size={14} color="#FFD25C" />
            <Text style={styles.myXpText}>{me?.weeklyXp ?? 0}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  emptyList: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  content: { paddingHorizontal: 18, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 40 },
  infoBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  // Carte ligue
  cardStep: { borderRadius: 24, paddingBottom: 6 },
  leagueCard: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  cardGlow: {
    position: 'absolute', right: -36, top: -46, width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medalBox: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, lineHeight: 26, color: '#fff' },
  cardSub: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  timerPill: {
    height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.18)',
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  timerText: { fontFamily: 'Nunito_900Black', fontSize: 13, color: '#fff' },
  segments: { flexDirection: 'row', gap: 4, marginTop: 14 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  cardFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  cardFootText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: 'rgba(255,255,255,0.9)' },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginTop: 22 },
  podCol: { flex: 1, alignItems: 'center' },
  podRing: { alignItems: 'center', justifyContent: 'center' },
  podGlow: { shadowColor: '#F5AA00', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  podAvatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  podInitials: { fontFamily: 'Baloo2_800ExtraBold', color: '#fff' },
  podName: { fontFamily: 'Nunito_900Black', fontSize: 13, marginTop: 8, maxWidth: '100%' },
  podXpRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  podXp: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  podStep: {
    alignSelf: 'stretch', marginTop: 8, alignItems: 'center', paddingTop: 8,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  podRank: { fontFamily: 'Baloo2_800ExtraBold' },

  // Bandeaux zone
  zoneTag: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  zoneLine: { flex: 1, height: 1.5, borderRadius: 1 },
  zoneLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  zoneText: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1 },

  // Liste
  list: { gap: 8, marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 20, borderWidth: 1,
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  rankBox: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#fff' },
  name: { fontFamily: 'Nunito_900Black', fontSize: 14 },
  rowSub: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  xpPill: { height: 34, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  xpText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15 },

  // Carte « ta position » sticky, posée sur sa marche
  myStep: {
    position: 'absolute', left: 14, right: 14, bottom: 12,
    borderRadius: 20, paddingBottom: 5, backgroundColor: '#4A2FC4',
    shadowColor: '#4B32C8', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10,
  },
  myCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 20, padding: 10, paddingHorizontal: 12, backgroundColor: '#6B4DFF',
  },
  myRank: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  myRankText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
  myLabel: { fontFamily: 'Nunito_900Black', fontSize: 14, color: '#fff' },
  myHint: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.88)' },
  myXp: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)' },
  myXpText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#fff' },
});
