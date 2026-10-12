import { useCallback, useEffect, useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet, Alert, TextInput, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FriendAvatar from './FriendAvatar';
import FriendButton from './FriendButton';
import { useTheme } from '../utils/useTheme';
import { friendPalette } from '../utils/friendTheme';
import {
  sendToFriend, fetchSendQuota, fetchChallenges,
  type FriendUser, type ChallengeView, type SendQuotaStatus,
} from '../lib/api';
import { ApiError } from '../lib/api/client';
import { useT } from '../lib/i18n';

type SendType = 'encouragement' | 'success' | 'reminder' | 'hadith';

interface Props {
  visible: boolean;
  friend: FriendUser | null;
  /** Référence à pré-remplir pour un envoi de hadith (Phase 4). */
  hadithRef?: { collectionId: string; n: number } | null;
  /** Type pré-sélectionné à l'ouverture (ex. « reminder » depuis un défi). */
  initialType?: SendType;
  /** Défi pré-sélectionné pour une relance (« remainder »). */
  reminderChallengeId?: string;
  onClose: () => void;
  onSent?: () => void;
}

/**
 * Envoi « à un ami » (Phases 2/3/4) : encouragement, réussite, relance de défi
 * ou hadith. Passé par le quota serveur (3/jour, débité atomiquement).
 */
export default function FriendSendModal({ visible, friend, hadithRef, initialType, reminderChallengeId, onClose, onSent }: Props) {
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const [type, setType] = useState<SendType>('encouragement');
  const [text, setText] = useState('');
  const [challenges, setChallenges] = useState<ChallengeView[]>([]);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [quota, setQuota] = useState<SendQuotaStatus | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setType(initialType ?? (hadithRef ? 'hadith' : 'encouragement'));
    setText('');
    setSending(false);
    fetchSendQuota().then(setQuota).catch(() => setQuota(null));
    fetchChallenges()
      .then((r) => {
        const active = r.challenges.filter((c) => c.status === 'active');
        setChallenges(active);
        const wanted = reminderChallengeId ?? (initialType === 'reminder' ? active[0]?.id : undefined);
        setChallengeId(active.find((c) => c.id === wanted)?.id ?? active[0]?.id ?? null);
      })
      .catch(() => {});
  }, [visible, hadithRef, initialType, reminderChallengeId]);

  const types: { id: SendType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
    { id: 'encouragement', label: tr('friends.sendEncouragement'), icon: 'smile' },
    { id: 'success', label: tr('friends.sendSuccess'), icon: 'star' },
    { id: 'reminder', label: tr('friends.sendReminder'), icon: 'target' },
    { id: 'hadith', label: tr('friends.sendHadith'), icon: 'book-open' },
  ];

  const canSend =
    (type === 'encouragement' && text.trim().length > 0) ||
    (type === 'success') ||
    (type === 'reminder' && challengeId != null) ||
    (type === 'hadith' && hadithRef != null);

  const onSend = useCallback(async () => {
    if (!friend || !canSend || sending) return;
    setSending(true);
    try {
      const payload =
        type === 'encouragement' ? { type, text: text.trim() } as const :
        type === 'success' ? { type, text: text.trim() || undefined } as const :
        type === 'reminder' ? { type, challengeId: challengeId! } as const :
        { type, collectionId: hadithRef!.collectionId, n: hadithRef!.n, text: text.trim() || undefined } as const;
      const res = await sendToFriend(friend.id, payload);
      setQuota(res.quota);
      Alert.alert(tr('friends.sendDone'));
      onSent?.();
      onClose();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : tr('friends.errorCode');
      Alert.alert(tr('friends.addErrorTitle'), msg);
      setQuota(null);
      fetchSendQuota().then(setQuota).catch(() => {});
    } finally {
      setSending(false);
    }
  }, [friend, canSend, sending, type, text, challengeId, hadithRef, tr, onSent, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: T.pageBg }]}>
          <LinearGradient colors={['#8B5CF6', '#6B4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accent} />
          <View style={styles.handle} />
          <View style={[styles.sheetHeader, { borderBottomColor: T.divider }]}>
            <FriendAvatar name={friend?.displayName ?? '?'} id={friend?.id} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetTitle, { color: T.text }]}>
                {tr('friends.sendTo', { name: friend?.displayName ?? '' })}
              </Text>
              {quota && (
                <Text style={[styles.quotaText, { color: T.textSecondary }]}>
                  {quota.remaining > 0
                    ? tr('friends.quotaLeft', { n: quota.remaining })
                    : tr('friends.quotaGone')}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={24} color={T.textSecondary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} keyboardShouldPersistTaps="handled">
            <View style={styles.typeRow}>
              {types.map((t) => {
                const on = type === t.id;
                return (
                  <Pressable
                    key={t.id}
                    style={[styles.typeChip, { backgroundColor: on ? P.tint : T.cardBg, borderColor: on ? '#6B4DFF' : T.border }]}
                    onPress={() => setType(t.id)}
                  >
                    <Feather name={t.icon} size={16} color={on ? '#6B4DFF' : T.textSecondary} />
                    <Text style={[styles.typeChipText, { color: on ? '#6B4DFF' : T.textSecondary }]}>{t.label}</Text>
                    {on && <Feather name="check" size={14} color="#6B4DFF" />}
                  </Pressable>
                );
              })}
            </View>

            {type === 'hadith' && (
              <View style={[styles.hintBox, { backgroundColor: T.cardBg }]}>
                <Feather name="book-open" size={20} color="#6B4DFF" />
                <Text style={[styles.hintText, { color: T.textSecondary }]}>
                  {hadithRef ? tr('friends.sendHadithHint') : tr('friends.sendHadithHint')}
                </Text>
              </View>
            )}

            {type === 'reminder' && (
              <View style={[styles.challengeList, { backgroundColor: T.cardBg }]}>
                {challenges.length === 0 ? (
                  <Text style={[styles.hintText, { color: T.textSecondary, padding: 14 }]}>
                    {tr('friends.noChallenges')}
                  </Text>
                ) : (
                  challenges.map((c) => {
                    const on = challengeId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        style={[styles.challengeRow, { borderColor: T.divider }, on && { backgroundColor: P.tint }]}
                        onPress={() => setChallengeId(c.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.challengeName, { color: T.text }]}>{c.title}</Text>
                          <Text style={[styles.challengeMeta, { color: T.textSecondary }]}>
                            {c.metric === 'xp' && tr('friends.challengeTargetXp')}
                            {c.metric === 'streak' && tr('friends.challengeTargetStreak')}
                            {c.metric === 'sourates' && tr('friends.challengeTargetSourates')}
                            {' → '}{c.targetValue}
                          </Text>
                        </View>
                        {on && <Feather name="check-circle" size={20} color="#6B4DFF" />}
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {(type === 'encouragement' || type === 'success' || (type === 'hadith' && hadithRef)) && (
              <View style={[styles.inputBox, { backgroundColor: T.cardBg }]}>
                <TextInput
                  style={[styles.input, { color: T.text }]}
                  placeholder={tr('friends.sendPlaceholder')}
                  placeholderTextColor="#A0A5AE"
                  multiline
                  value={text}
                  onChangeText={setText}
                  maxLength={280}
                />
              </View>
            )}

            <FriendButton label={tr('friends.send')} icon="send" onPress={onSend} loading={sending} disabled={!canSend} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 26, maxHeight: '85%', overflow: 'hidden' },
  accent: { height: 5, width: '100%' },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#C9CCD4', alignSelf: 'center', marginTop: 10 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  sheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  quotaText: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  sheetBody: { padding: 18, gap: 14 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9 },
  typeChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14 },
  hintText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
  challengeList: { borderRadius: 16, overflow: 'hidden' },
  challengeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1 },
  challengeName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  challengeMeta: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  inputBox: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, maxHeight: 140 },
  input: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, minHeight: 60, padding: 0 },
});
