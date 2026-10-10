import { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendButton from '../../components/FriendButton';
import FriendSendModal from '../../components/FriendSendModal';
import CountUp from '../../components/CountUp';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import {
  fetchFriendProgress, removeFriend, blockFriend, reportFriend,
  type FriendProgressView, type FriendUser,
} from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import { useT } from '../../lib/i18n';

// Habillage des 3 statistiques (couleur lisible sur fond clair/sombre).
const STAT_META: { emoji: string; color: string; bg: string; bgDark: string; key: 'detailStreak' | 'detailWeeklyXp' | 'detailSourates' }[] = [
  { emoji: '🔥', color: '#F0820C', bg: '#FFE7D2', bgDark: '#3A2712', key: 'detailStreak' },
  { emoji: '✨', color: '#E8A800', bg: '#FFF3CD', bgDark: '#332A14', key: 'detailWeeklyXp' },
  { emoji: '📖', color: '#2A9E1C', bg: '#E2F5E1', bgDark: '#1B3220', key: 'detailSourates' },
];

export default function FriendProgressScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const { userId, name, friendshipId } = useLocalSearchParams<{ userId: string; name: string; friendshipId?: string }>();
  const [progress, setProgress] = useState<FriendProgressView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');

  const friend: FriendUser = { id: userId, displayName: name, username: null, avatarInitials: '' };

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setProgress(await fetchFriendProgress(userId));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const confirmRemove = () => {
    Alert.alert(tr('friends.remove'), tr('friends.removeConfirm', { name }), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('friends.remove'), style: 'destructive',
        onPress: async () => {
          if (friendshipId) {
            try { await removeFriend(friendshipId); } catch { /* best-effort */ }
          }
          router.back();
        },
      },
    ]);
  };

  const confirmBlock = () => {
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

  const statValues = progress
    ? [progress.streak, progress.weeklyXp, progress.masteredSourates]
    : [0, 0, 0];

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <FriendsHeader avatar={{ name, id: userId }} title={name} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.center}>
            <Feather name="wifi-off" size={32} color="#9AA0AA" />
            <Text style={[styles.stateText, { color: T.text }]}>{tr('friends.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryLabel}>{tr('friends.retry')}</Text>
            </Pressable>
          </View>
        ) : loading || !progress ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6B4DFF" />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              {STAT_META.map((s, i) => (
                <View key={s.key} style={[styles.statCard, { backgroundColor: T.isDark ? s.bgDark : s.bg }]}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <CountUp value={statValues[i]} style={[styles.statValue, { color: s.color }]} />
                  <Text style={[styles.statLabel, { color: s.color }]}>{tr(`friends.${s.key}`)}</Text>
                </View>
              ))}
            </View>

            <FriendButton
              label={tr('friends.send')}
              icon="send"
              onPress={() => setSendOpen(true)}
              style={{ marginTop: 16 }}
            />

            {/* Signalement */}
            <View style={[styles.actionsCard, { backgroundColor: T.cardBg }]}>
              <Pressable style={styles.actionRow} onPress={() => { setReporting((v) => !v); setReason(''); }}>
                <View style={[styles.actionIcon, { backgroundColor: P.dangerBg }]}>
                  <Feather name="flag" size={17} color={P.danger} />
                </View>
                <Text style={[styles.actionText, { color: P.danger }]}>{tr('friends.report')}</Text>
                <Feather name={reporting ? 'chevron-up' : 'chevron-down'} size={18} color={P.danger} />
              </Pressable>
              {reporting && (
                <View style={styles.reportBox}>
                  <TextInput
                    style={[styles.reportInput, { backgroundColor: T.pageBg, color: T.text }]}
                    placeholder={tr('friends.reportHint')}
                    placeholderTextColor="#A0A5AE"
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
              <View style={[styles.actionDivider, { backgroundColor: T.divider }]} />
              <Pressable style={styles.actionRow} onPress={confirmBlock}>
                <View style={[styles.actionIcon, { backgroundColor: P.dangerBg }]}>
                  <Feather name="slash" size={17} color={P.danger} />
                </View>
                <Text style={[styles.actionText, { color: P.danger }]}>{tr('friends.block')}</Text>
              </Pressable>
              <View style={[styles.actionDivider, { backgroundColor: T.divider }]} />
              <Pressable style={styles.actionRow} onPress={confirmRemove}>
                <View style={[styles.actionIcon, { backgroundColor: P.dangerBg }]}>
                  <Feather name="user-x" size={17} color={P.danger} />
                </View>
                <Text style={[styles.actionText, { color: P.danger }]}>{tr('friends.remove')}</Text>
              </Pressable>
            </View>
            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>

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
  body: { padding: 18 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 18, paddingVertical: 16, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 20 },
  statValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24 },
  statLabel: { fontFamily: 'Nunito_700Bold', fontSize: 11, textAlign: 'center', opacity: 0.9 },
  actionsCard: {
    borderRadius: 18, marginTop: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  actionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, flex: 1 },
  actionDivider: { height: 1, marginLeft: 62 },
  reportBox: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  reportInput: { borderRadius: 12, padding: 12, minHeight: 76, fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  reportSend: { backgroundColor: '#E5484D', borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center' },
  reportSendText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
});
