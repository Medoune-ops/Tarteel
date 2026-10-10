import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator,
  Modal, TextInput, Animated, Easing,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendAvatar from '../../components/FriendAvatar';
import FriendButton from '../../components/FriendButton';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import {
  fetchChallenges, createChallenge, leaveChallenge, fetchFriends,
  type ChallengeView, type FriendView, type ChallengeMetric,
} from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import { useT, type I18nKey } from '../../lib/i18n';

const DURATIONS_DAYS = [7, 14, 30, 60];
const METRIC_ICON: Record<ChallengeMetric, string> = { xp: '✨', streak: '🔥', sourates: '📖' };

const targetLabel = (tr: (key: I18nKey) => string) => ({
  xp: tr('friends.challengeTargetXp'), streak: tr('friends.challengeTargetStreak'), sourates: tr('friends.challengeTargetSourates'),
});

/** Barre de progression au remplissage dégradé, animée de 0 à `ratio`. */
function ChallengeBar({ ratio, track }: { ratio: number; track: string }) {
  const v = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, ratio));
  useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: clamped, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [clamped, v]);
  const width = v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={[styles.bar, { backgroundColor: track }]}>
      <Animated.View style={{ width }}>
        <LinearGradient colors={['#8A6BFF', '#6B4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.barFill} />
      </Animated.View>
    </View>
  );
}

export default function FriendsChallengesScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const [challenges, setChallenges] = useState<ChallengeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState<ChallengeMetric>('xp');
  const [target, setTarget] = useState('');
  const [days, setDays] = useState(7);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendView[]>([]);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const label = targetLabel(tr);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetchChallenges();
      setChallenges(r.challenges);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = async () => {
    setCreateOpen(true);
    setTitle('');
    setTarget('');
    setDays(7);
    setFriendIds([]);
    setMetric('xp');
    try {
      setFriends(await fetchFriends());
    } catch {
      setFriends([]);
    }
  };

  const toggleFriend = (id: string) =>
    setFriendIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const onCreate = async () => {
    const targetValue = Number(target);
    const endsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    if (!title.trim()) { Alert.alert(tr('friends.challengeEmptyTitle')); return; }
    if (!Number.isFinite(targetValue) || targetValue < 1) { Alert.alert(tr('friends.addErrorTitle')); return; }
    if (friendIds.length === 0) { Alert.alert(tr('friends.challengeEmptyFriends')); return; }
    setCreating(true);
    try {
      await createChallenge({
        title: title.trim(), metric, targetValue, endsAt: endsAt.toISOString(), friendIds,
      });
      setCreateOpen(false);
      load();
    } catch (e) {
      Alert.alert(tr('friends.addErrorTitle'), e instanceof ApiError ? e.message : tr('friends.challengeEmptyTitle'));
    } finally {
      setCreating(false);
    }
  };

  const onLeave = (c: ChallengeView) => {
    if (c.isCreator) { Alert.alert(tr('friends.challengeCreator'), tr('friends.challengeEndPast')); return; }
    Alert.alert(tr('friends.leaveChallenge'), tr('friends.leaveConfirm'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('friends.leaveChallenge'), style: 'destructive',
        onPress: async () => {
          try { await leaveChallenge(c.id); } catch { /* best-effort */ }
          setExpandedId(null);
          load();
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <FriendsHeader
        emoji="🏆"
        title={tr('friends.settingsDefis')}
        subtitle={`${tr('friends.challengeActive')} · ${tr('friends.challengeEnded')}`}
      />

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
        ) : challenges.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: T.cardBg }]}>
            <Text style={{ fontSize: 34 }}>🥇</Text>
            <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.noChallenges')}</Text>
            <FriendButton label={tr('friends.newChallenge')} icon="plus" onPress={openCreate} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <>
            <FriendButton label={tr('friends.newChallenge')} icon="plus" onPress={openCreate} style={{ marginBottom: 14 }} />
            <View style={styles.listGap}>
              {challenges.map((c) => {
                const me = c.participants.find((p) => p.isMe);
                const expanded = expandedId === c.id;
                const active = c.status === 'active';
                return (
                  <Pressable
                    key={c.id}
                    style={[styles.card, { backgroundColor: T.cardBg }]}
                    onPress={() => setExpandedId(expanded ? null : c.id)}
                  >
                    <View style={styles.challengeHead}>
                      <View style={[styles.metricBadge, { backgroundColor: P.tint }]}>
                        <Text style={{ fontSize: 18 }}>{METRIC_ICON[c.metric]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.challengeTitle, { color: T.text }]}>{c.title}</Text>
                        <Text style={[styles.challengeMeta, { color: T.textSecondary }]}>
                          {label[c.metric]} : {c.targetValue} · {daysLeft(c.endsAt)} {tr('friends.challengeDays')}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: active ? P.greenBg : P.neutralBg }]}>
                        <Feather name={active ? 'play-circle' : 'check' } size={11} color={active ? P.greenText : P.neutralText} />
                        <Text style={[styles.badgeText, { color: active ? P.greenText : P.neutralText }]}>
                          {active ? tr('friends.challengeActive') : tr('friends.challengeEnded')}
                        </Text>
                      </View>
                    </View>

                    {me && (
                      <View style={styles.myProgress}>
                        <Text style={[styles.myProgressText, { color: T.textSecondary }]}>
                          {tr('friends.player')}: {me.progress}/{c.targetValue}
                        </Text>
                        <ChallengeBar ratio={me.progress / c.targetValue} track={P.barTrack} />
                      </View>
                    )}

                    {expanded && (
                      <>
                        <View style={[styles.partList, { backgroundColor: T.pageBg }]}>
                          {c.participants.map((p) => (
                            <View key={p.user.id} style={styles.partRow}>
                              <FriendAvatar name={p.user.displayName} id={p.user.id} size={34} />
                              <Text style={[styles.partName, { color: T.text }]}>{p.user.displayName}{p.isMe ? ` (${tr('friends.player')})` : ''}</Text>
                              {c.winnerIds.includes(p.user.id) && <Text style={styles.trophy}>🏆</Text>}
                              {p.achieved && <Feather name="check-circle" size={15} color="#2A9E1C" />}
                              <Text style={[styles.partProgress, { color: T.textSecondary }]}>{p.progress}/{c.targetValue}</Text>
                            </View>
                          ))}
                        </View>
                        {c.status === 'ended' && c.winnerIds.length > 0 && (
                          <Text style={[styles.winners, { color: '#6B4DFF' }]}>
                            {c.winnerIds.length > 1 ? tr('friends.challengeWinners') : tr('friends.challengeWinner')}: 🏆
                          </Text>
                        )}
                        {!c.isCreator && (
                          <Pressable style={styles.leaveBtn} onPress={() => onLeave(c)}>
                            <Feather name="log-out" size={15} color={P.danger} />
                            <Text style={[styles.leaveText, { color: P.danger }]}>{tr('friends.leaveChallenge')}</Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modale de création */}
      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: T.pageBg }]}>
            <LinearGradient colors={['#8B5CF6', '#6B4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sheetAccent} />
            <View style={styles.handle} />
            <View style={[styles.sheetHeader, { borderBottomColor: T.divider }]}>
              <Text style={[styles.sheetTitle, { color: T.text }]}>{tr('friends.newChallenge')}</Text>
              <Pressable onPress={() => setCreateOpen(false)} hitSlop={10}>
                <Feather name="x" size={22} color={T.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
              <TextInput
                style={[styles.fieldInput, { backgroundColor: T.cardBg, color: T.text }]}
                placeholder={tr('friends.challengeTitle')}
                placeholderTextColor="#A0A5AE"
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <View style={styles.metricRow}>
                {(Object.keys(label) as ChallengeMetric[]).map((m) => {
                  const on = metric === m;
                  return (
                    <Pressable
                      key={m}
                      style={[styles.metricChip, { backgroundColor: on ? P.tint : T.cardBg, borderColor: on ? '#6B4DFF' : T.border }]}
                      onPress={() => setMetric(m)}
                    >
                      <Text style={{ fontSize: 18 }}>{METRIC_ICON[m]}</Text>
                      <Text style={[styles.metricText, { color: on ? '#6B4DFF' : T.textSecondary }]}>{label[m]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={[styles.fieldInput, { backgroundColor: T.cardBg }]}>
                <TextInput
                  style={[styles.targetInput, { color: T.text }]}
                  placeholder="1000"
                  placeholderTextColor="#A0A5AE"
                  keyboardType="number-pad"
                  value={target}
                  onChangeText={setTarget}
                />
              </View>
              <Text style={[styles.fieldLabel, { color: T.textSecondary }]}>{tr('friends.challengeEnds')}</Text>
              <View style={styles.daysRow}>
                {DURATIONS_DAYS.map((d) => {
                  const on = days === d;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.dayChip, { backgroundColor: on ? P.tint : T.cardBg, borderColor: on ? '#6B4DFF' : T.border }]}
                      onPress={() => setDays(d)}
                    >
                      <Text style={[styles.dayText, { color: on ? '#6B4DFF' : T.textSecondary }]}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.fieldLabel, { color: T.textSecondary }]}>{tr('friends.challengeFriends')}</Text>
              <View style={[styles.friendList, { backgroundColor: T.cardBg }]}>
                {friends.length === 0 ? (
                  <Text style={[styles.emptyText, { color: T.textSecondary, padding: 14 }]}>{tr('friends.noFriends')}</Text>
                ) : (
                  friends.map((f) => {
                    const on = friendIds.includes(f.user.id);
                    return (
                      <Pressable
                        key={f.user.id}
                        style={[styles.friendRow, { borderColor: T.divider }, on && { backgroundColor: P.tint }]}
                        onPress={() => toggleFriend(f.user.id)}
                      >
                        <FriendAvatar name={f.user.displayName} id={f.user.id} size={36} />
                        <Text style={[styles.friendName, { color: T.text, flex: 1 }]}>{f.user.displayName}</Text>
                        {on && <Feather name="check-circle" size={20} color="#6B4DFF" />}
                      </Pressable>
                    );
                  })
                )}
              </View>
              <FriendButton label={tr('friends.challengeCreate')} onPress={onCreate} loading={creating} style={{ marginTop: 6 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function daysLeft(endsAtIso: string): number {
  return Math.max(0, Math.ceil((new Date(endsAtIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 18 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  emptyCard: { borderRadius: 20, padding: 28, alignItems: 'center', gap: 12 },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center' },
  listGap: { gap: 12 },
  card: {
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3,
  },
  challengeHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricBadge: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  challengeTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  challengeMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 3 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },
  myProgress: { marginTop: 14, gap: 6 },
  myProgressText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  bar: { height: 10, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  partList: { borderRadius: 14, marginTop: 12, padding: 4 },
  partRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8 },
  partName: { fontFamily: 'Nunito_700Bold', fontSize: 14, flex: 1 },
  partProgress: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  trophy: { fontSize: 15 },
  winners: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, marginTop: 10 },
  leaveBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', padding: 6 },
  leaveText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, maxHeight: '90%', overflow: 'hidden' },
  sheetAccent: { height: 5, width: '100%' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#C9CCD4', alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  sheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18 },
  sheetBody: { padding: 18, gap: 12 },
  fieldInput: { borderRadius: 14, paddingHorizontal: 14, height: 52, justifyContent: 'center' },
  fieldLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, marginTop: 4 },
  targetInput: { fontFamily: 'Baloo2_700Bold', fontSize: 18, padding: 0 },
  metricRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  metricText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 9, alignItems: 'center' },
  dayText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  friendList: { borderRadius: 14, overflow: 'hidden' },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  friendName: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
});
