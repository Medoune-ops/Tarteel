import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendAvatar from '../../components/FriendAvatar';
import CountUp from '../../components/CountUp';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import { fetchFriendsActivity, cheerActivity, type FriendActivityView } from '../../lib/api';
import { useT } from '../../lib/i18n';
import type { I18nKey } from '../../lib/i18n';

type Tr = (key: I18nKey, vars?: Record<string, string | number>) => string;

// Accent + icône par type d'événement (pastille devant l'avatar).
const TYPE_META: Record<string, { icon: keyof typeof Feather.glyphMap; color: string; bg: string; bgDark: string }> = {
  sourate_mastered: { icon: 'book-open', color: '#2A9E1C', bg: '#E2F5E1', bgDark: '#1B3220' },
  streak_milestone: { icon: 'zap', color: '#F0820C', bg: '#FFE7D2', bgDark: '#3A2712' },
  section_completed: { icon: 'flag', color: '#6B4DFF', bg: '#EDE8FF', bgDark: '#241F3D' },
  challenge_won: { icon: 'award', color: '#E0A10C', bg: '#FFF3D2', bgDark: '#3A3012' },
  league_promoted: { icon: 'trending-up', color: '#6B4DFF', bg: '#EDE8FF', bgDark: '#241F3D' },
};

function activityLine(tr: Tr, item: FriendActivityView): string {
  const d = (item.data ?? {}) as { nom?: string; days?: number; titre?: string; title?: string; league?: string };
  switch (item.type) {
    case 'sourate_mastered': return tr('friends.activitySourate', { nom: d.nom ?? '' });
    case 'streak_milestone': return tr('friends.activityStreakMilestone', { streak: d.days ?? 0 });
    case 'section_completed': return tr('friends.activitySection', { titre: d.titre ?? '' });
    case 'challenge_won': return tr('friends.activityChallengeWon', { title: d.title ?? '' });
    case 'league_promoted': return tr('friends.activityLeague', { league: d.league ?? '' });
    default: return tr('friends.activityLevel');
  }
}

/** Bouton « bravo » avec pop animé au tap. */
function CheerButton({ count, active, onPress }: { count: number; active: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pop = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
  };
  return (
    <Pressable onPress={() => { pop(); onPress(); }}>
      <Animated.View style={[styles.cheerBtn, active && styles.cheerBtnActive, { transform: [{ scale }] }]}>
        <Feather name="thumbs-up" size={15} color={active ? '#fff' : '#6B4DFF'} />
        <CountUp value={count} style={[styles.cheerText, { color: active ? '#fff' : '#6B4DFF' }]} />
      </Animated.View>
    </Pressable>
  );
}

export default function FriendsActivityScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const [activity, setActivity] = useState<FriendActivityView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetchFriendsActivity();
      setActivity(r.activity);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onCheer = async (item: FriendActivityView) => {
    try {
      const r = await cheerActivity(item);
      setActivity((prev) => prev.map((a) => (a.id === item.id ? { ...a, cheeredByMe: r.cheered, cheers: r.cheers } : a)));
    } catch {
      /* hors-ligne : on laisse l'état inchangé */
    }
  };

  const timeAgo = (iso: string) => {
    const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
    if (s < 60) return `${s}s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m}min`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.round(h / 24)}j`;
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <FriendsHeader emoji="🎉" title={tr('friends.activity')} subtitle={tr('friends.leaderboardSub')} />

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
        ) : activity.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: T.cardBg }]}>
            <Text style={{ fontSize: 34 }}>🌱</Text>
            <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.activityEmpty')}</Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: T.cardBg }]}>
            {activity.map((a, i) => {
              const meta = TYPE_META[a.type] ?? TYPE_META.league_promoted;
              return (
                <View key={a.id}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: T.divider }]} />}
                  <View style={styles.post}>
                    <View>
                      <FriendAvatar name={a.user.displayName} id={a.user.id} size={44} />
                      <View style={[styles.typeBadge, { backgroundColor: T.isDark ? meta.bgDark : meta.bg, borderColor: T.cardBg }]}>
                        <Feather name={meta.icon} size={12} color={meta.color} />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.postLine, { color: T.text }]}>
                        <Text style={styles.postName}>{a.user.displayName}</Text> {activityLine(tr, a)}
                      </Text>
                      <Text style={[styles.postTime, { color: T.textSecondary }]}>{timeAgo(a.createdAt)}</Text>
                    </View>
                    <CheerButton count={a.cheers} active={a.cheeredByMe} onPress={() => onCheer(a)} />
                  </View>
                </View>
              );
            })}
          </View>
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
  emptyCard: { borderRadius: 18, padding: 28, alignItems: 'center', gap: 10 },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center' },
  listCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3,
  },
  divider: { height: 1, marginLeft: 68 },
  post: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  typeBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  postName: { fontFamily: 'Nunito_800ExtraBold' },
  postLine: { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  postTime: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 3 },
  cheerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: '#EFEAFF',
  },
  cheerBtnActive: { backgroundColor: '#6B4DFF' },
  cheerText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
});
