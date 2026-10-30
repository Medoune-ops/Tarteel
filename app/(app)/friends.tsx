import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator, Share, Animated, Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendAvatar from '../../components/FriendAvatar';
import FriendButton from '../../components/FriendButton';
import CountUp from '../../components/CountUp';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import {
  fetchFriendCode, fetchFriends, fetchFriendsLeaderboard, fetchFriendRequests,
  acceptFriendRequest, declineFriendRequest,
  type FriendView, type LeaderboardEntry, type FriendRequestView,
} from '../../lib/api';
import { useT } from '../../lib/i18n';

// Habillage des marches du podium par rang (or / argent / bronze).
const PODIUM_STYLE: Record<number, { height: number; colors: readonly [string, string]; accent: string }> = {
  1: { height: 74, colors: ['#FFD66B', '#F0A41E'], accent: '#E07A0C' },
  2: { height: 54, colors: ['#C4CCD8', '#9AA4B2'], accent: '#7A8595' },
  3: { height: 42, colors: ['#E6B07A', '#C67E3A'], accent: '#B5701F' },
};
const PODIUM_ORDER = [2, 1, 3];

export default function FriendsScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const [code, setCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequestView[]>([]);
  const [answering, setAnswering] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [c, f, b, r] = await Promise.all([
        fetchFriendCode(), fetchFriends(), fetchFriendsLeaderboard(), fetchFriendRequests(),
      ]);
      setCode(c.code);
      setFriends(f);
      setBoard(b.entries);
      setRequests(r.received);
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

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({ message: tr('friends.shareMessage', { code }) });
    } catch {
      /* partage annulé — sans conséquence */
    }
  };

  const top = board.filter((e) => e.rank <= 3);
  const me = board.find((e) => e.isMe);
  const byRank = new Map(top.map((e) => [e.rank, e]));
  const podium = PODIUM_ORDER.map((r) => byRank.get(r)).filter((e): e is LeaderboardEntry => !!e);

  // Entrée animée du podium (capacité fixe = 3).
  const podiumAnim = useRef(Array.from({ length: 3 }, () => new Animated.Value(0))).current;
  useEffect(() => {
    if (loading || podium.length === 0) return;
    podiumAnim.forEach((v) => v.setValue(0));
    Animated.stagger(90, podiumAnim.map((v) =>
      Animated.spring(v, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }),
    )).start();
  }, [loading, board.length]);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <FriendsHeader emoji="👥" title={tr('friends.title')} subtitle={tr('friends.headerSub')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.center}>
            <Feather name="wifi-off" size={32} color="#9AA0AA" />
            <Text style={[styles.stateText, { color: T.text }]}>{tr('friends.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryLabel}>{tr('friends.retry')}</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6B4DFF" />
          </View>
        ) : (
          <>
            {/* Carte code — habillage « ticket » */}
            <View style={styles.codeWrap}>
              <LinearGradient
                colors={['#8B5CF6', '#6B4DFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.codeCard}
              >
                <View style={styles.codeGlow} />
                <Text style={styles.codeLabel}>{tr('friends.myCodeTitle')}</Text>
                {code && <Text style={styles.codeValue}>{code}</Text>}
                <View style={styles.codeActions}>
                  <Pressable style={styles.codeActionBtn} onPress={() => router.push('/(app)/friends-qr')}>
                    <Feather name="maximize" size={16} color="#fff" />
                    <Text style={styles.codeActionText}>{tr('friends.qrTitle')}</Text>
                  </Pressable>
                  <Pressable style={styles.codeActionBtn} onPress={share}>
                    <Feather name="share-2" size={16} color="#fff" />
                    <Text style={styles.codeActionText}>{tr('friends.shareLink')}</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
            <FriendButton
              label={tr('friends.addButton')}
              icon="user-plus"
              onPress={() => router.push('/(app)/friends-add')}
              style={{ marginTop: 14 }}
            />

            {/* Demandes reçues */}
            {requests.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('friends.requests')}</Text>
                <View style={[styles.listCard, { backgroundColor: T.cardBg }]}>
                  {requests.map((r, i) => (
                    <View key={r.id}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: T.divider }]} />}
                      <View style={styles.friendRow}>
                        <FriendAvatar name={r.user.displayName} id={r.user.id} size={46} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.friendName, { color: T.text }]}>{r.user.displayName}</Text>
                          {r.user.username ? <Text style={[styles.friendUser, { color: T.textSecondary }]}>@{r.user.username}</Text> : null}
                        </View>
                        {answering === r.id ? (
                          <ActivityIndicator color="#6B4DFF" />
                        ) : (
                          <>
                            <Pressable
                              style={[styles.requestBtn, { backgroundColor: P.neutralBg }]}
                              onPress={() => answerRequest(r, false)}
                              accessibilityLabel={tr('friends.decline')}
                            >
                              <Feather name="x" size={18} color={P.neutralText} />
                            </Pressable>
                            <Pressable
                              style={[styles.requestBtn, { backgroundColor: '#6B4DFF' }]}
                              onPress={() => answerRequest(r, true)}
                              accessibilityLabel={tr('friends.accept')}
                            >
                              <Feather name="check" size={18} color="#fff" />
                            </Pressable>
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Classement de la semaine */}
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('friends.leaderboard')}</Text>
            <View style={[styles.boardCard, { backgroundColor: T.cardBg }]}>
              {board.length === 0 ? (
                <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.noFriends')}</Text>
              ) : (
                <>
                  <View style={styles.podium}>
                    {podium.map((e, i) => {
                      const st = PODIUM_STYLE[e.rank] ?? PODIUM_STYLE[3];
                      const first = e.rank === 1;
                      return (
                        <Animated.View
                          key={e.user.id}
                          style={[
                            styles.podCol,
                            {
                              opacity: podiumAnim[i],
                              transform: [{ translateY: podiumAnim[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                            },
                          ]}
                        >
                          {first && (
                            <View style={styles.crownRow}>
                              <Feather name="award" size={20} color={st.accent} />
                            </View>
                          )}
                          <View style={styles.podAvatarHolder}>
                            <LinearGradient
                              colors={st.colors}
                              style={[styles.podAvatar, first && styles.podAvatarGlow]}
                            >
                              <FriendAvatar name={e.user.displayName} id={e.user.id} size={50} />
                            </LinearGradient>
                            <View style={[styles.medal, { backgroundColor: st.accent }]}>
                              <Text style={styles.medalText}>{e.rank}</Text>
                            </View>
                          </View>
                          <Text style={[styles.podName, { color: T.text }]} numberOfLines={1}>
                            {e.user.displayName}
                          </Text>
                          <View style={[styles.podXpPill, { backgroundColor: P.tint }]}>
                            <Feather name="zap" size={11} color={st.accent} />
                            <CountUp value={e.weeklyXp} style={[styles.podXp, { color: st.accent }]} />
                          </View>
                          <View style={[styles.step, { height: st.height, backgroundColor: P.tint }]}>
                            <Text style={[styles.stepRank, { color: st.accent }]}>{e.rank}</Text>
                          </View>
                        </Animated.View>
                      );
                    })}
                  </View>

                  {me && !top.some((e) => e.isMe) && (
                    <View style={[styles.meRow, { backgroundColor: P.tint }]}>
                      <Text style={[styles.meRank, { color: '#6B4DFF' }]}>{me.rank}</Text>
                      <FriendAvatar name={me.user.displayName} id={me.user.id} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.boardName, { color: T.text }]}>
                          {me.user.displayName} ({tr('friends.player')})
                        </Text>
                      </View>
                      <View style={[styles.xpPill, { backgroundColor: T.cardBg }]}>
                        <Feather name="zap" size={13} color="#6B4DFF" />
                        <Text style={[styles.boardXp, { color: '#6B4DFF' }]}>{me.weeklyXp}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Liste d'amis */}
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('friends.title')}</Text>
            {friends.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: T.cardBg }]}>
                <Text style={{ fontSize: 30 }}>🥰</Text>
                <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.empty')}</Text>
              </View>
            ) : (
              <View style={[styles.listCard, { backgroundColor: T.cardBg }]}>
                {friends.map((f, i) => (
                  <View key={f.user.id}>
                    {i > 0 && <View style={[styles.divider, { backgroundColor: T.divider }]} />}
                    <Pressable
                      style={styles.friendRow}
                      onPress={() => router.push({ pathname: '/(app)/friend-progress', params: { userId: f.user.id, name: f.user.displayName } })}
                    >
                      <FriendAvatar name={f.user.displayName} id={f.user.id} size={46} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.friendName, { color: T.text }]}>{f.user.displayName}</Text>
                        {f.user.username ? <Text style={[styles.friendUser, { color: T.textSecondary }]}>@{f.user.username}</Text> : null}
                      </View>
                      <View style={[styles.chevron, { backgroundColor: P.tint }]}>
                        <Feather name="chevron-right" size={18} color="#6B4DFF" />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 18 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  // Carte code
  codeWrap: {
    borderRadius: 22,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 7,
  },
  codeCard: { borderRadius: 22, padding: 22, alignItems: 'center', overflow: 'hidden' },
  codeGlow: { position: 'absolute', top: -50, right: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.16)' },
  codeLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textTransform: 'uppercase' },
  codeValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 36, color: '#fff', letterSpacing: 8, marginVertical: 6 },
  codeActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  codeActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  codeActionText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },

  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginTop: 26, marginBottom: 12 },

  // Classement / podium
  boardCard: {
    borderRadius: 20, padding: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3,
  },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', paddingVertical: 18, paddingHorizontal: 16 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingTop: 14, paddingBottom: 6 },
  podCol: { flex: 1, alignItems: 'center', maxWidth: 110 },
  crownRow: { marginBottom: 2 },
  podAvatarHolder: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  podAvatar: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  podAvatarGlow: { shadowColor: '#F0A41E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  medal: {
    position: 'absolute', bottom: -6, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  medalText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 12, color: '#fff' },
  podName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, maxWidth: '100%', textAlign: 'center' },
  podXpPill: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5, marginBottom: 8, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  podXp: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  step: { width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', paddingTop: 4 },
  stepRank: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, opacity: 0.6 },

  meRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginTop: 8 },
  meRank: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, width: 22, textAlign: 'center' },
  boardName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  xpPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  boardXp: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  // Liste d'amis
  emptyCard: { borderRadius: 18, padding: 24, alignItems: 'center', gap: 10 },
  listCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3,
  },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  friendName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  friendUser: { fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  chevron: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  requestBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginLeft: 74 },
});
