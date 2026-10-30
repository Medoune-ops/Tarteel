import { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceStatusBar from '../../components/StatusBar';
import FriendAvatar from '../../components/FriendAvatar';
import FriendSendModal from '../../components/FriendSendModal';
import { BadgeFlower, BADGE_META } from '../../components/FriendBadge';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import { leagueLabel } from '../../utils/leagueLabel';
import { useUserStore } from '../../store/userStore';
import { getCached } from '../../lib/api/swr';
import {
  fetchFriendProgress, fetchFriendsLeaderboard, fetchFriendsActivity, fetchMyAchievementKeys,
  removeFriend, blockFriend, reportFriend, ApiError,
  type FriendProgressView, type FriendUser, type FriendActivityView, type LeagueView,
} from '../../lib/api';
import { useT, type I18nKey } from '../../lib/i18n';
import { timeAgo } from '../../utils/friendActivity';

type Tr = (key: I18nKey, vars?: Record<string, string | number>) => string;

const PURPLE = '#6B4DFF';
const PINK = '#E0407A';

/** Nom court d'un badge (sous la fleur). */
function badgeLabel(tr: Tr, a: FriendActivityView): string {
  const d = (a.data ?? {}) as { nom?: string; days?: number; titre?: string; league?: string };
  switch (a.type) {
    case 'sourate_mastered': return d.nom ?? '';
    case 'streak_milestone': return tr('friends.badgeStreak', { n: d.days ?? 0 });
    case 'section_completed': return d.titre ?? '';
    case 'challenge_won': return tr('friends.badgeChallenge');
    case 'league_promoted': return tr('friends.badgeLeague', { league: leagueLabel(d.league) ?? '' });
    default: return '';
  }
}

type Me = { streak: number; weeklyXp: number };

export default function FriendProgressScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const insets = useSafeAreaInsets();
  const language = useUserStore((s) => s.language);
  const mySourates = useUserStore((s) => s.sourates);
  const { userId, name, since } = useLocalSearchParams<{ userId: string; name: string; since?: string }>();
  const [progress, setProgress] = useState<FriendProgressView | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [badges, setBadges] = useState<FriendActivityView[]>([]);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');

  const friend: FriendUser = progress?.user ?? { id: userId, displayName: name, username: null, avatarInitials: '' };
  const myLeague = leagueLabel(getCached<LeagueView>('league')?.league?.nom);
  const localeTag = language === 'en' ? 'en-US' : language === 'ar' ? 'ar' : 'fr-FR';

  const load = useCallback(async () => {
    setError(false);
    try {
      setProgress(await fetchFriendProgress(userId));
      // Comparaison et réussites : secondaires, n'empêchent pas l'affichage.
      const [b, a, k] = await Promise.allSettled([
        fetchFriendsLeaderboard(), fetchFriendsActivity(), fetchMyAchievementKeys(),
      ]);
      if (b.status === 'fulfilled') {
        const row = b.value.entries.find((e) => e.isMe);
        setMe(row ? { streak: row.streak, weeklyXp: row.weeklyXp } : null);
      }
      if (a.status === 'fulfilled') setBadges(a.value.activity.filter((x) => x.user.id === userId));
      if (k.status === 'fulfilled') setMine(k.value);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmRemove = () => {
    setMenuOpen(false);
    Alert.alert(tr('friends.remove'), tr('friends.removeConfirm', { name }), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('friends.remove'), style: 'destructive',
        onPress: async () => {
          try { await removeFriend(userId); } catch { /* best-effort */ }
          router.back();
        },
      },
    ]);
  };

  const confirmBlock = () => {
    setMenuOpen(false);
    Alert.alert(tr('friends.block'), tr('friends.blockConfirm', { name }), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('friends.block'), style: 'destructive',
        onPress: async () => {
          try { await blockFriend(userId); } catch { /* best-effort */ }
          router.back();
        },
      },
    ]);
  };

  const sendReport = async () => {
    if (!reason.trim()) return;
    try {
      await reportFriend(userId, reason.trim());
      Alert.alert(tr('friends.reportDone'));
      setReporting(false);
      setReason('');
    } catch (e) {
      Alert.alert(tr('friends.addErrorTitle'), e instanceof ApiError ? e.message : tr('friends.errorCode'));
    }
  };

  const heroColors = T.isDark
    ? (['#6A4FE8', '#4E35C9', '#3A24A0'] as const)
    : (['#8A6BFF', '#6B4DFF', '#5B3FD6'] as const);
  const cardShadow = T.isDark ? styles.shadowDark : styles.shadowLight;
  const first = friend.displayName.split(/\s+/)[0];

  const stats = progress ? [
    { icon: 'zap' as const, color: '#F0700A', value: tr('friends.daysShort', { n: progress.streak }), label: tr('friends.statStreak'), mine: me ? tr('friends.daysShort', { n: me.streak }) : null },
    { icon: 'star' as const, color: '#E5A400', value: progress.weeklyXp.toLocaleString(localeTag), label: tr('friends.statXp'), mine: me ? me.weeklyXp.toLocaleString(localeTag) : null },
    { icon: 'book-open' as const, color: '#2FA81F', value: String(progress.masteredSourates), label: tr('friends.statSourates'), mine: String(mySourates) },
    { icon: 'shield' as const, color: '#2F7BE8', value: leagueLabel(progress.leagueTier) ?? '—', label: tr('friends.statLeague'), mine: myLeague },
  ] : [];

  // Duel d'XP de la semaine.
  const theirXp = progress?.weeklyXp ?? 0;
  const myXp = me?.weeklyXp ?? 0;
  const total = theirXp + myXp;
  const theirShare = total > 0 ? theirXp / total : 0.5;
  const weekNote = !me ? null
    : myXp === theirXp ? tr('friends.weekTie')
    : myXp < theirXp ? tr('friends.weekCatchUp', { n: theirXp - myXp, name: first })
    : tr('friends.weekAhead', { n: myXp - theirXp, name: first });

  const [latest, ...others] = badges;
  const shared = badges.filter((b) => mine.has(`${b.type}:${b.refKey}`)).length;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          <View style={styles.heroGlow} />
          <View style={styles.heroBar}>
            <Pressable style={styles.heroBtn} onPress={() => router.back()} hitSlop={8}>
              <Feather name="chevron-left" size={20} color="#fff" />
            </Pressable>
            <Text style={styles.heroBarTitle}>{tr('friends.profileTitle')}</Text>
            <Pressable style={styles.heroBtn} onPress={() => setMenuOpen((v) => !v)} hitSlop={8} accessibilityLabel={tr('friends.moreOptions')}>
              <Feather name="more-horizontal" size={20} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.heroAvatar}>
            <FriendAvatar name={friend.displayName} id={friend.id} avatarStyle={friend.avatarStyle} size={88} />
          </View>
          <Text style={styles.heroName} numberOfLines={1}>{friend.displayName}</Text>
          <Text style={styles.heroSub} numberOfLines={1}>
            {[
              friend.username ? `@${friend.username}` : null,
              since ? tr('friends.since', { date: new Date(since).toLocaleDateString(localeTag, { month: 'long', year: 'numeric' }) }) : null,
            ].filter(Boolean).join(' · ')}
          </Text>
        </LinearGradient>

        {menuOpen && (
          <View style={[styles.menu, { top: insets.top + 56, backgroundColor: T.cardBg, borderColor: T.border }, cardShadow]}>
            {[
              { icon: 'flag' as const, label: tr('friends.report'), onPress: () => { setMenuOpen(false); setReporting(true); } },
              { icon: 'slash' as const, label: tr('friends.block'), onPress: confirmBlock },
              { icon: 'user-x' as const, label: tr('friends.remove'), onPress: confirmRemove },
            ].map((m, i) => (
              <Pressable key={m.icon} onPress={m.onPress} style={[styles.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}>
                <Feather name={m.icon} size={16} color={P.danger} />
                <Text style={[styles.menuText, { color: P.danger }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.body}>
          {error ? (
            <View style={styles.center}>
              <Feather name="wifi-off" size={32} color="#9AA0AA" />
              <Text style={[styles.stateText, { color: T.text }]}>{tr('friends.loadError')}</Text>
              <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
                <Text style={styles.retryLabel}>{tr('friends.retry')}</Text>
              </Pressable>
            </View>
          ) : loading || !progress ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={PURPLE} />
            </View>
          ) : (
            <>
              {/* Signalement */}
              {reporting && (
                <View style={[styles.card, { backgroundColor: T.cardBg, borderColor: T.border, gap: 10, marginBottom: 14 }]}>
                  <View style={styles.spread}>
                    <Text style={[styles.cardTitle, { color: P.danger }]}>{tr('friends.report')}</Text>
                    <Pressable onPress={() => { setReporting(false); setReason(''); }} hitSlop={8}>
                      <Feather name="x" size={18} color={T.textSecondary} />
                    </Pressable>
                  </View>
                  <TextInput
                    style={[styles.reportInput, { backgroundColor: T.inputBg, color: T.text }]}
                    placeholder={tr('friends.reportHint')}
                    placeholderTextColor={T.textTertiary}
                    multiline
                    value={reason}
                    onChangeText={setReason}
                    maxLength={200}
                  />
                  <Pressable style={[styles.reportSend, !reason.trim() && { opacity: 0.5 }]} onPress={sendReport} disabled={!reason.trim()}>
                    <Text style={styles.reportSendText}>{tr('friends.reportSend')}</Text>
                  </Pressable>
                </View>
              )}

              {/* Statistiques */}
              <View style={styles.grid}>
                {stats.map((s) => (
                  <View key={s.label} style={[styles.stat, { backgroundColor: T.cardBg, borderColor: T.border }, cardShadow]}>
                    <View style={[styles.statIcon, { backgroundColor: `${s.color}${T.isDark ? '2E' : '1A'}` }]}>
                      <Feather name={s.icon} size={17} color={s.color} />
                    </View>
                    <Text style={[styles.statValue, { color: T.text }]} numberOfLines={1}>{s.value}</Text>
                    <Text style={[styles.statLabel, { color: T.textSecondary }]}>{s.label}</Text>
                    {s.mine != null && (
                      <Text style={[styles.statMine, { backgroundColor: T.inputBg, color: T.textSecondary }]} numberOfLines={1}>
                        {tr('friends.youValue', { v: s.mine })}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Cette semaine */}
              <View style={[styles.card, { backgroundColor: T.cardBg, borderColor: T.border, marginTop: 14 }, cardShadow]}>
                <Text style={[styles.cardTitle, { color: T.text }]}>{tr('friends.thisWeek')}</Text>
                <Text style={[styles.cardSub, { color: T.textSecondary }]}>{tr('friends.thisWeekSub')}</Text>
                <View style={[styles.spread, { marginTop: 14 }]}>
                  <View>
                    <Text style={[styles.duelLabel, { color: PINK }]}>{tr('friends.weekXpOf', { name: first })}</Text>
                    <Text style={[styles.duelValue, { color: T.text }]}>{theirXp.toLocaleString(localeTag)}</Text>
                  </View>
                  {me && (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.duelLabel, { color: PURPLE }]}>{tr('friends.weekXpMe')}</Text>
                      <Text style={[styles.duelValue, { color: T.text }]}>{myXp.toLocaleString(localeTag)}</Text>
                    </View>
                  )}
                </View>
                {me && (
                  <View style={[styles.split, { backgroundColor: P.barTrack }]}>
                    <View style={{ flex: Math.max(theirShare, 0.04), backgroundColor: PINK }} />
                    <View style={{ width: 3, backgroundColor: T.cardBg }} />
                    <View style={{ flex: Math.max(1 - theirShare, 0.04), backgroundColor: PURPLE }} />
                  </View>
                )}
                {weekNote && (
                  <Text style={[styles.note, { backgroundColor: T.inputBg, color: T.textSecondary }]}>{weekNote}</Text>
                )}
              </View>

              {/* Réussites */}
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('friends.achievements')}</Text>
                {badges.length > 0 && (
                  <Text style={[styles.sectionMeta, { color: T.textSecondary }]}>
                    {tr('friends.achievementsCount', { n: badges.length, shared })}
                  </Text>
                )}
              </View>
              {!latest ? (
                <View style={[styles.card, styles.empty, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                  <Feather name="award" size={26} color={PURPLE} />
                  <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.achievementsEmpty')}</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.card, styles.latest, { backgroundColor: T.cardBg, borderColor: T.border }, cardShadow]}>
                    <BadgeFlower type={latest.type} size={72} ring />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.latestTag, { color: BADGE_META[latest.type]?.main ?? PURPLE }]}>
                        {tr('friends.latest').toUpperCase()} · {timeAgo(latest.createdAt)}
                      </Text>
                      <Text style={[styles.latestTitle, { color: T.text }]} numberOfLines={2}>{badgeLabel(tr, latest)}</Text>
                      {mine.has(`${latest.type}:${latest.refKey}`) && (
                        <View style={styles.inline}>
                          <Feather name="check-circle" size={13} color="#2FA81F" />
                          <Text style={styles.alsoYou}>{tr('friends.alsoYou')}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {others.length > 0 && (
                    <View style={[styles.card, styles.badgeGrid, { backgroundColor: T.cardBg, borderColor: T.border, marginTop: 10 }]}>
                      {others.map((b) => {
                        const both = mine.has(`${b.type}:${b.refKey}`);
                        return (
                          <View key={b.id} style={styles.badgeCell}>
                            <View>
                              <BadgeFlower type={b.type} size={54} />
                              {both && (
                                <View style={[styles.badgeCheck, { borderColor: T.cardBg }]}>
                                  <Feather name="check" size={10} color="#fff" />
                                </View>
                              )}
                            </View>
                            <Text style={[styles.badgeName, { color: T.text }]} numberOfLines={2}>{badgeLabel(tr, b)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      {progress && !error && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: T.pageBg, borderTopColor: T.border }]}>
          <Pressable style={[styles.footBtn, styles.footPrimary]} onPress={() => router.push('/(app)/friends-challenges')}>
            <Feather name="award" size={17} color="#fff" />
            <Text style={styles.footPrimaryText} numberOfLines={1}>{tr('friends.challengeCta')}</Text>
          </Pressable>
          <Pressable style={[styles.footBtn, { backgroundColor: T.cardBg, borderColor: T.border, borderWidth: 1.5 }]} onPress={() => setSendOpen(true)}>
            <Feather name="send" size={16} color={PURPLE} />
            <Text style={[styles.footSecondaryText, { color: PURPLE }]} numberOfLines={1}>{tr('friends.sendCta')}</Text>
          </Pressable>
        </View>
      )}

      <FriendSendModal
        visible={sendOpen}
        friend={friend}
        onClose={() => setSendOpen(false)}
        onSent={() => load()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: PURPLE },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  shadowLight: { shadowColor: '#1E1446', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 3 },
  shadowDark: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 3 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // En-tête
  hero: { alignItems: 'center', paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' },
  heroGlow: { position: 'absolute', right: -60, top: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroBar: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  heroBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroBarTitle: { fontFamily: 'Nunito_900Black', fontSize: 15, color: '#fff' },
  heroAvatar: { marginTop: 6, padding: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroName: { marginTop: 10, paddingHorizontal: 24, fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, lineHeight: 32, color: '#fff' },
  heroSub: { paddingHorizontal: 24, fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },

  menu: { position: 'absolute', right: 16, zIndex: 10, minWidth: 190, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 14 },
  menuText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  card: { borderRadius: 22, borderWidth: 1, padding: 16 },
  cardTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18 },
  cardSub: { fontFamily: 'Nunito_700Bold', fontSize: 12.5 },

  // Statistiques
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', flexGrow: 1, borderRadius: 20, borderWidth: 1, padding: 14 },
  statIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statValue: { marginTop: 8, fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 28 },
  statLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  statMine: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden', fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5 },

  // Semaine
  duelLabel: { fontFamily: 'Nunito_900Black', fontSize: 12 },
  duelValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, lineHeight: 26 },
  split: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 10 },
  note: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, overflow: 'hidden', fontFamily: 'Nunito_800ExtraBold', fontSize: 12.5 },

  // Réussites
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19 },
  sectionMeta: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12.5 },
  empty: { alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center' },
  latest: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  latestTag: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 0.6 },
  latestTitle: { marginTop: 2, fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, lineHeight: 23 },
  alsoYou: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#2FA81F' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 16, paddingHorizontal: 6 },
  badgeCell: { width: '33.33%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  badgeCheck: {
    position: 'absolute', right: -2, bottom: 2, width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    backgroundColor: '#45C935', alignItems: 'center', justifyContent: 'center',
  },
  badgeName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, textAlign: 'center' },

  reportInput: { borderRadius: 12, padding: 12, minHeight: 76, fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlignVertical: 'top' },
  reportSend: { backgroundColor: '#E5484D', borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center' },
  reportSendText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },

  // Actions
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  footBtn: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 },
  footPrimary: { backgroundColor: PURPLE, borderBottomWidth: 4, borderBottomColor: '#4A2FC4' },
  footPrimaryText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#fff', flexShrink: 1 },
  footSecondaryText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, flexShrink: 1 },
});
