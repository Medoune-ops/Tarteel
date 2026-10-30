import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator, Share, TextInput,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeviceStatusBar from '../../components/StatusBar';
import FriendAvatar from '../../components/FriendAvatar';
import { BadgeChip } from '../../components/FriendBadge';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import {
  fetchFriendCode, fetchFriends, fetchFriendsLeaderboard, fetchFriendRequests, fetchChallenges,
  fetchFriendsActivity, acceptFriendRequest, declineFriendRequest, addFriend, sendToFriend,
  cheerActivity, ApiError,
  type FriendView, type LeaderboardEntry, type FriendRequestView, type ChallengeView,
  type FriendActivityView,
} from '../../lib/api';
import { useT } from '../../lib/i18n';
import { activityLine, timeAgo } from '../../utils/friendActivity';

// Module natif absent des builds antérieurs (mise à jour OTA) → repli sur le partage.
let Clipboard: typeof import('expo-clipboard') | null = null;
try { Clipboard = require('expo-clipboard'); } catch { Clipboard = null; }

const PURPLE = '#6B4DFF';
const PINK = '#E0407A';
const SHARE_HOST = 'tarteel.sn/f/';

function daysLeft(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function FriendsScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequestView[]>([]);
  const [challenge, setChallenge] = useState<ChallengeView | null>(null);
  const [feed, setFeed] = useState<FriendActivityView[]>([]);
  const [answering, setAnswering] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [encouraged, setEncouraged] = useState<Record<string, boolean>>({});
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const load = useCallback(async () => {
    setError(false);
    try {
      const [c, f, b, r] = await Promise.all([
        fetchFriendCode(), fetchFriends(), fetchFriendsLeaderboard(), fetchFriendRequests(),
      ]);
      setCode(c.code);
      setFriends(f);
      setBoard(b.entries);
      setRequests(r.received);
      // Défis et fil sont secondaires : leur échec ne bloque pas l'écran.
      const [ch, a] = await Promise.allSettled([fetchChallenges(), fetchFriendsActivity()]);
      setChallenge(ch.status === 'fulfilled'
        ? ch.value.challenges.find((x) => x.status === 'active' && x.myStatus === 'accepted') ?? null
        : null);
      setFeed(a.status === 'fulfilled' ? a.value.activity.slice(0, 3) : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const answerRequest = async (req: FriendRequestView, accept: boolean) => {
    if (answering) return;
    setAnswering(req.id);
    try {
      await (accept ? acceptFriendRequest(req.id) : declineFriendRequest(req.id));
      await load();
    } catch {
      Alert.alert(tr('friends.addErrorTitle'));
    } finally {
      setAnswering(null);
    }
  };

  const copy = async () => {
    if (!code) return;
    if (!Clipboard) { share(); return; }
    try { await Clipboard.setStringAsync(code); } catch { share(); return; }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({ message: tr('friends.shareMessage', { code }) });
    } catch {
      /* partage annulé — sans conséquence */
    }
  };

  const submitCode = async () => {
    const c = input.trim().toUpperCase();
    if (c.length < 4 || adding) return;
    setAdding(true);
    try {
      const res = await addFriend(c);
      setInput('');
      if (res.accepted) {
        Alert.alert(tr('friends.addedTitle'), tr('friends.addedMessage'));
        await load();
      } else {
        setRequestSent(true);
      }
    } catch (e) {
      const isLimit = e instanceof ApiError && e.code === 'FRIEND_LIMIT_REACHED';
      Alert.alert(
        isLimit ? tr('friends.limitTitle') : tr('friends.addErrorTitle'),
        e instanceof ApiError ? e.message : tr('friends.errorCode'),
      );
      if (isLimit) router.push('/(app)/subscription');
    } finally {
      setAdding(false);
    }
  };

  const encourage = async (userId: string) => {
    if (encouraged[userId]) return;
    setEncouraged((s) => ({ ...s, [userId]: true }));
    try {
      await sendToFriend(userId, { type: 'encouragement' });
    } catch (e) {
      setEncouraged((s) => ({ ...s, [userId]: false }));
      Alert.alert(tr('friends.addErrorTitle'), e instanceof ApiError ? e.message : tr('friends.quotaGone'));
    }
  };

  const cheer = async (item: FriendActivityView) => {
    try {
      const r = await cheerActivity(item);
      setFeed((list) => list.map((a) => (a.id === item.id ? { ...a, cheeredByMe: r.cheered, cheers: r.cheers } : a)));
    } catch {
      /* réessai au prochain tap */
    }
  };

  const openFriend = (f: FriendView['user'], since?: string) => router.push({
    pathname: '/(app)/friend-progress',
    params: { userId: f.id, name: f.displayName, ...(since ? { since } : {}) },
  });

  const stats = new Map(board.map((e) => [e.user.id, e]));
  const sinceOf = new Map(friends.map((f) => [f.user.id, f.since]));
  const sortedFriends = [...friends].sort(
    (a, b) => (stats.get(b.user.id)?.weeklyXp ?? 0) - (stats.get(a.user.id)?.weeklyXp ?? 0),
  );

  const duel = challenge
    ? challenge.participants
        .filter((p) => p.status === 'accepted')
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 4)
    : [];
  const leader = duel[0];
  const duelNote = !leader ? null
    : duel.length > 1 && duel[1].progress === leader.progress ? tr('friends.challengeTie')
    : leader.isMe ? tr('friends.challengeLeadMe')
    : tr('friends.challengeLeadOther', { name: leader.user.displayName });

  const heroColors = T.isDark
    ? (['#6A4FE8', '#4E35C9', '#3A24A0'] as const)
    : (['#8A6BFF', '#6B4DFF', '#5B3FD6'] as const);
  const cardShadow = T.isDark ? styles.shadowDark : styles.shadowLight;
  const canAdd = input.trim().length >= 4;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête */}
        <View style={styles.topRow}>
          <Pressable style={[styles.backBtn, { backgroundColor: T.selectorBg }]} onPress={() => router.back()} hitSlop={8}>
            <Feather name="chevron-left" size={20} color={T.text} />
          </Pressable>
          <Text style={[styles.title, { color: T.text }]}>{tr('friends.title')}</Text>
          <View style={[styles.countChip, { backgroundColor: T.selectorBg }]}>
            <Feather name="user" size={13} color={T.textSecondary} />
            <Text style={[styles.countText, { color: T.textSecondary }]}>{tr('friends.countChip', { n: friends.length })}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.center}>
            <Feather name="wifi-off" size={32} color="#9AA0AA" />
            <Text style={[styles.stateText, { color: T.text }]}>{tr('friends.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
              <Text style={styles.retryLabel}>{tr('friends.retry')}</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={PURPLE} />
          </View>
        ) : (
          <>
            {/* Carte d'invitation */}
            <View style={styles.heroWrap}>
              <LinearGradient colors={heroColors} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.hero}>
                <View style={styles.heroGlow} />
                <Text style={styles.heroLetter}>أ</Text>
                <View style={styles.heroTop}>
                  <View style={styles.heroLeft}>
                    <Text style={styles.heroLabel} numberOfLines={1}>{tr('friends.inviteCode').toUpperCase()}</Text>
                    <View style={styles.codeRow}>
                      {(code ?? '').split('').map((ch, i) => (
                        ch === '-'
                          ? <Text key={i} style={styles.codeDash}>·</Text>
                          : <View key={i} style={styles.codeBox}><Text style={styles.codeChar}>{ch}</Text></View>
                      ))}
                    </View>
                    <Pressable style={styles.copyBtn} onPress={copy}>
                      <Feather name={copied ? 'check' : 'copy'} size={15} color="#4A2FC4" />
                      <Text style={styles.copyText}>{copied ? tr('friends.copied') : tr('friends.copy')}</Text>
                    </Pressable>
                  </View>
                  <Pressable style={styles.qrBox} onPress={() => router.push('/(app)/friends-qr')} accessibilityLabel={tr('friends.qrTitle')}>
                    {code && <QRCode value={`https://${SHARE_HOST}${code}`} size={88} color="#1C1A26" backgroundColor="#fff" />}
                  </Pressable>
                </View>
                <View style={styles.linkRow}>
                  <View style={styles.linkIcon}><Feather name="link" size={14} color="#fff" /></View>
                  <Text style={styles.linkText} numberOfLines={1}>{SHARE_HOST}{code}</Text>
                  <Pressable style={styles.shareBtn} onPress={share}>
                    <Feather name="share-2" size={13} color="#4A2FC4" />
                    <Text style={styles.shareText}>{tr('friends.share')}</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>

            {/* Ajout par code */}
            <View style={[styles.addRow, { backgroundColor: T.cardBg, borderColor: T.border }, cardShadow]}>
              <Pressable style={[styles.addIcon, { backgroundColor: P.tint }]} onPress={() => router.push('/(app)/friends-add')} accessibilityLabel={tr('friends.scanTitle')}>
                <Feather name="user-plus" size={17} color={PURPLE} />
              </Pressable>
              <TextInput
                value={input}
                onChangeText={(v) => { setInput(v.toUpperCase()); setRequestSent(false); }}
                placeholder={tr('friends.codeInput')}
                placeholderTextColor={T.textTertiary}
                autoCapitalize="characters"
                autoCorrect={false}
                onSubmitEditing={submitCode}
                returnKeyType="send"
                style={[styles.addInput, { color: T.text }]}
              />
              <Pressable
                onPress={submitCode}
                disabled={!canAdd || adding}
                style={[
                  styles.addBtn,
                  requestSent ? styles.addBtnDone : canAdd ? styles.addBtnOn : styles.addBtnOff,
                ]}
              >
                {adding
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.addBtnText}>{requestSent ? tr('friends.added') : tr('friends.add')}</Text>}
              </Pressable>
            </View>

            {/* Demandes reçues */}
            {requests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('friends.requests')}</Text>
                <View style={[styles.listCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                  {requests.map((r, i) => (
                    <View key={r.id} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}>
                      <FriendAvatar name={r.user.displayName} id={r.user.id} avatarStyle={r.user.avatarStyle} size={42} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowName, { color: T.text }]}>{r.user.displayName}</Text>
                        {r.user.username ? <Text style={[styles.rowSub, { color: T.textSecondary }]}>@{r.user.username}</Text> : null}
                      </View>
                      {answering === r.id ? (
                        <ActivityIndicator color={PURPLE} />
                      ) : (
                        <>
                          <Pressable
                            style={[styles.roundBtn, { backgroundColor: P.neutralBg }]}
                            onPress={() => answerRequest(r, false)}
                            accessibilityLabel={tr('friends.decline')}
                          >
                            <Feather name="x" size={18} color={P.neutralText} />
                          </Pressable>
                          <Pressable
                            style={[styles.roundBtn, { backgroundColor: PURPLE }]}
                            onPress={() => answerRequest(r, true)}
                            accessibilityLabel={tr('friends.accept')}
                          >
                            <Feather name="check" size={18} color="#fff" />
                          </Pressable>
                        </>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Défi en cours */}
            {challenge && duel.length > 0 && (
              <Pressable
                onPress={() => router.push('/(app)/friends-challenges')}
                style={[styles.card, { backgroundColor: T.cardBg, borderColor: T.border, marginTop: 14 }, cardShadow]}
              >
                <View style={styles.spread}>
                  <View style={[styles.pill, { backgroundColor: T.isDark ? 'rgba(240,130,12,.18)' : '#FFF1E0' }]}>
                    <Feather name="award" size={12} color="#E0700A" />
                    <Text style={styles.pillOrange}>{tr('friends.challengeNow').toUpperCase()}</Text>
                  </View>
                  <View style={styles.inline}>
                    <Feather name="clock" size={12} color={T.textSecondary} />
                    <Text style={[styles.smallMuted, { color: T.textSecondary }]}>
                      {daysLeft(challenge.endsAt) <= 1 ? tr('friends.lastDay') : tr('friends.daysLeft', { n: daysLeft(challenge.endsAt) })}
                    </Text>
                  </View>
                </View>
                <View style={styles.challengeHead}>
                  <LinearGradient colors={['#FFB44A', '#F27A12']} style={styles.trophy}>
                    <Feather name="award" size={22} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.challengeTitle, { color: T.text }]} numberOfLines={2}>{challenge.title}</Text>
                </View>
                <View style={{ gap: 12, marginTop: 14 }}>
                  {duel.map((p) => {
                    const c = p.isMe ? PURPLE : PINK;
                    const pct = p.target > 0 ? Math.min(100, (p.progress / p.target) * 100) : 0;
                    return (
                      <View key={p.user.id} style={styles.duelRow}>
                        <View style={[styles.ring, { borderColor: c }]}>
                          <FriendAvatar name={p.user.displayName} id={p.user.id} avatarStyle={p.user.avatarStyle} size={34} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.spread}>
                            <Text style={[styles.duelName, { color: T.text }]}>{p.isMe ? tr('friends.you') : p.user.displayName}</Text>
                            <Text style={[styles.duelName, { color: c }]}>{p.progress} / {p.target}</Text>
                          </View>
                          <View style={[styles.track, { backgroundColor: P.barTrack }]}>
                            <View style={[styles.fill, { width: `${pct}%`, backgroundColor: c }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
                {duelNote && (
                  <Text style={[styles.note, { backgroundColor: T.inputBg, color: T.textSecondary }]}>{duelNote}</Text>
                )}
              </Pressable>
            )}

            {/* Tes amis */}
            <View style={styles.sectionHead}>
              <Text style={[styles.sectionTitle, { color: T.text, marginTop: 0, marginBottom: 0 }]}>{tr('friends.yourFriends')}</Text>
              {challenge === null && friends.length > 0 && (
                <Pressable onPress={() => router.push('/(app)/friends-challenges')} hitSlop={8}>
                  <Text style={styles.link}>{tr('friends.allChallenges')}</Text>
                </Pressable>
              )}
            </View>
            {friends.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                <Feather name="users" size={26} color={PURPLE} />
                <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.empty')}</Text>
              </View>
            ) : (
              <View style={[styles.listCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                {sortedFriends.map((f, i) => {
                  const s = stats.get(f.user.id);
                  const on = !!encouraged[f.user.id];
                  return (
                    <Pressable
                      key={f.user.id}
                      onPress={() => openFriend(f.user, f.since)}
                      style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}
                    >
                      <View style={[styles.ring, { borderColor: T.border }]}>
                        <FriendAvatar name={f.user.displayName} id={f.user.id} avatarStyle={f.user.avatarStyle} size={40} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.inline}>
                          <Text style={[styles.rowName, { color: T.text }]} numberOfLines={1}>{f.user.displayName}</Text>
                          {(s?.streak ?? 0) > 0 && (
                            <View style={[styles.streakPill, { backgroundColor: T.isDark ? 'rgba(240,130,12,.18)' : '#FFF1E0' }]}>
                              <Feather name="zap" size={10} color="#E0700A" />
                              <Text style={styles.streakText}>{tr('friends.daysShort', { n: s!.streak })}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.rowSub, { color: T.textSecondary }]}>{tr('friends.weekXpLine', { n: s?.weeklyXp ?? 0 })}</Text>
                      </View>
                      <Pressable
                        onPress={() => encourage(f.user.id)}
                        style={[styles.actBtn, on ? [styles.actBtnDone, { backgroundColor: P.greenBg }] : styles.actBtnOn]}
                      >
                        <View style={[styles.actIcon, { backgroundColor: on ? '#45C935' : 'rgba(255,255,255,.2)' }]}>
                          <Feather name={on ? 'check' : 'heart'} size={14} color={on ? '#fff' : '#FFD25C'} />
                        </View>
                        <Text style={[styles.actText, { color: on ? P.greenText : '#fff' }]}>
                          {on ? tr('friends.encouraged') : tr('friends.encourage')}
                        </Text>
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Activité */}
            {feed.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={[styles.sectionTitle, { color: T.text, marginTop: 0, marginBottom: 0 }]}>{tr('friends.activity')}</Text>
                  <Pressable onPress={() => router.push('/(app)/friends-activity')} hitSlop={8}>
                    <Text style={styles.link}>{tr('friends.seeAll')}</Text>
                  </Pressable>
                </View>
                <View style={{ gap: 8 }}>
                  {feed.map((a) => (
                    <Pressable
                      key={a.id}
                      onPress={() => openFriend(a.user, sinceOf.get(a.user.id))}
                      style={[styles.feedRow, { backgroundColor: T.cardBg, borderColor: T.border }]}
                    >
                      <View style={styles.feedAvatar}>
                        <FriendAvatar name={a.user.displayName} id={a.user.id} avatarStyle={a.user.avatarStyle} size={40} />
                        <View style={styles.feedChip}><BadgeChip type={a.type} border={T.cardBg} /></View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.feedText, { color: T.text }]}>
                          <Text style={{ fontFamily: 'Nunito_900Black' }}>{a.user.displayName}</Text> {activityLine(tr, a)}
                        </Text>
                        <Text style={[styles.smallMuted, { color: T.textSecondary, marginTop: 2 }]}>{timeAgo(a.createdAt)}</Text>
                      </View>
                      <Pressable
                        onPress={() => cheer(a)}
                        style={[
                          styles.bravo,
                          a.cheeredByMe
                            ? { backgroundColor: '#FF5D73', borderColor: '#FF5D73' }
                            : { backgroundColor: T.cardBg, borderColor: T.border },
                        ]}
                      >
                        <Feather name="heart" size={13} color={a.cheeredByMe ? '#fff' : '#FF5D73'} />
                        <Text style={[styles.bravoText, { color: a.cheeredByMe ? '#fff' : '#FF5D73' }]}>
                          {a.cheeredByMe ? `${tr('friends.cheered')} · ${a.cheers}` : tr('friends.cheered')}
                        </Text>
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: PURPLE },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  shadowLight: { shadowColor: '#1E1446', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 3 },
  shadowDark: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 3 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallMuted: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, lineHeight: 34 },
  countChip: { height: 30, paddingHorizontal: 12, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontFamily: 'Nunito_900Black', fontSize: 12.5 },

  // Carte d'invitation
  heroWrap: { borderRadius: 24, shadowColor: '#3218B8', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6 },
  hero: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  heroGlow: { position: 'absolute', right: -50, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.1)' },
  heroLetter: { position: 'absolute', left: 120, bottom: -40, fontFamily: 'ScheherazadeNew_700Bold', fontSize: 130, color: 'rgba(255,255,255,0.06)' },
  heroTop: { flexDirection: 'row', gap: 14 },
  heroLeft: { flex: 1, minWidth: 0 },
  heroLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1, color: 'rgba(255,255,255,0.85)' },
  codeRow: { flexDirection: 'row', gap: 3, marginTop: 8 },
  codeBox: {
    flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  codeChar: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  codeDash: { width: 10, textAlign: 'center', alignSelf: 'center', fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
  copyBtn: {
    alignSelf: 'flex-start', marginTop: 14, height: 36, paddingLeft: 10, paddingRight: 14, borderRadius: 12,
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#1E0A78', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 2,
  },
  copyText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#4A2FC4' },
  qrBox: { width: 104, height: 104, padding: 8, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, height: 42, paddingLeft: 6, paddingRight: 5,
    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  linkIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  linkText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },
  shareBtn: { height: 32, paddingLeft: 10, paddingRight: 12, borderRadius: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 5 },
  shareText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13, color: '#4A2FC4' },

  // Ajout par code
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6, marginTop: 14, borderRadius: 18, borderWidth: 1 },
  addIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addInput: { flex: 1, minWidth: 0, height: 40, fontFamily: 'Nunito_800ExtraBold', fontSize: 15, letterSpacing: 0.6 },
  addBtn: { height: 40, minWidth: 86, paddingHorizontal: 16, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3 },
  addBtnOn: { backgroundColor: PURPLE, borderBottomColor: '#4A2FC4' },
  addBtnOff: { backgroundColor: '#C9C3DB', borderBottomColor: '#B3ACC9' },
  addBtnDone: { backgroundColor: '#45C935', borderBottomColor: '#2A9E1C' },
  addBtnText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#fff' },

  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, marginTop: 20, marginBottom: 10, paddingHorizontal: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 20, marginBottom: 10 },
  link: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: PURPLE },

  // Défi
  card: { borderRadius: 24, borderWidth: 1, padding: 16 },
  pill: { height: 26, paddingHorizontal: 10, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillOrange: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 0.4, color: '#E0700A' },
  challengeHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  trophy: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, lineHeight: 24 },
  duelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  duelName: { fontFamily: 'Nunito_900Black', fontSize: 13 },
  ring: { borderWidth: 2, borderRadius: 999, padding: 1.5 },
  track: { height: 10, marginTop: 5, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  note: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, overflow: 'hidden', fontFamily: 'Nunito_800ExtraBold', fontSize: 12.5 },

  // Listes
  listCard: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: 12 },
  rowName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, flexShrink: 1 },
  rowSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, marginTop: 1 },
  roundBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  streakPill: { height: 20, paddingLeft: 5, paddingRight: 7, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 3 },
  streakText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, color: '#E0700A' },
  actBtn: { height: 40, paddingLeft: 5, paddingRight: 13, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  actBtnOn: { backgroundColor: '#6244F5', borderBottomWidth: 4, borderBottomColor: '#4A2FC4' },
  actBtnDone: { borderWidth: 1.5, borderColor: 'rgba(47,168,31,0.3)' },
  actIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  actText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14 },
  emptyCard: { borderRadius: 22, borderWidth: 1, padding: 24, alignItems: 'center', gap: 10 },
  emptyText: { fontFamily: 'Nunito_700Bold', fontSize: 14, textAlign: 'center' },

  // Fil
  feedRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: 12, borderRadius: 20, borderWidth: 1 },
  feedAvatar: { width: 40, height: 40 },
  feedChip: { position: 'absolute', right: -7, bottom: -6 },
  feedText: { fontFamily: 'Nunito_700Bold', fontSize: 13.5, lineHeight: 18 },
  bravo: { height: 34, paddingHorizontal: 11, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  bravoText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 13 },
});
