import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendAvatar from '../../components/FriendAvatar';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import {
  fetchFriendsInbox, markFriendMessageRead, fetchSendQuota,
  type FriendInboxMessage, type SendQuotaStatus,
} from '../../lib/api';
import { loadCollection, hadithLangFor, COLLECTIONS } from '../../lib/hadiths';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';

const COLLECTION_LABEL: Record<string, string> = {};
for (const c of COLLECTIONS) COLLECTION_LABEL[c.id] = c.id.charAt(0).toUpperCase() + c.id.slice(1);

const TYPE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  encouragement: 'smile',
  success: 'star',
  hadith: 'book-open',
  reminder: 'target',
};

export default function FriendsInboxScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const language = useUserStore((s) => s.language);
  const [messages, setMessages] = useState<FriendInboxMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [quota, setQuota] = useState<SendQuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hadithText, setHadithText] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [inbox, q] = await Promise.all([fetchFriendsInbox(), fetchSendQuota()]);
      setMessages(inbox.messages);
      setUnread(inbox.unread);
      setQuota(q);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (m: FriendInboxMessage) => {
    setOpenId((cur) => (cur === m.id ? null : m.id));
    if (!m.read) {
      markFriendMessageRead(m.id).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    }
    if (m.type === 'hadith' && !hadithText[m.id]) {
      const p = m.payload as { collectionId?: string; n?: number };
      if (p?.collectionId && p.n) {
        loadCollection(p.collectionId as never, hadithLangFor(language))
          .then((col) => {
            const h = col.hadiths.find((x) => x.n === p.n);
            if (h) setHadithText((prev) => ({ ...prev, [m.id]: h.t }));
          })
          .catch(() => {});
      }
    }
  };

  const renderBody = (m: FriendInboxMessage) => {
    const p = m.payload as { text?: string; collectionId?: string; n?: number; numero?: number };
    switch (m.type) {
      case 'encouragement': return p.text ?? null;
      case 'success': return p.text ?? null;
      case 'hadith': {
        const ref = p?.collectionId ? `${COLLECTION_LABEL[p.collectionId] ?? p.collectionId} #${p.n ?? ''}` : null;
        return ref && <Text style={[styles.hadithRef, { color: '#6B4DFF' }]}>📖 {ref}</Text>;
      }
      case 'reminder': return null;
      default: return null;
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <FriendsHeader
        emoji="✉️"
        title={tr('friends.inbox')}
        subtitle={quota && quota.remaining > 0 ? tr('friends.quotaLeft', { n: quota.remaining }) : tr('friends.quotaGone')}
        right={unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread}</Text>
          </View>
        ) : undefined}
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
        ) : messages.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: T.cardBg }]}>
            <Text style={{ fontSize: 34 }}>💌</Text>
            <Text style={[styles.emptyText, { color: T.textSecondary }]}>{tr('friends.inboxEmpty')}</Text>
          </View>
        ) : (
          <View style={[styles.listCard, { backgroundColor: T.cardBg }]}>
            {messages.map((m, i) => {
              const isOpen = openId === m.id;
              return (
                <Pressable key={m.id} onPress={() => open(m)}>
                  {i > 0 && <View style={[styles.divider, { backgroundColor: T.divider }]} />}
                  <View style={[
                    styles.msg,
                    !m.read && { backgroundColor: P.unreadBg, borderLeftWidth: 3, borderLeftColor: '#6B4DFF' },
                  ]}>
                    <View>
                      <FriendAvatar name={m.sender.displayName} id={m.sender.id} size={44} />
                      <View style={[styles.typeBadge, { backgroundColor: T.cardBg, borderColor: T.cardBg }]}>
                        <Feather name={TYPE_ICON[m.type] ?? 'message-circle'} size={12} color="#6B4DFF" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.msgHead}>
                        <Text style={[styles.msgName, { color: T.text }]}>{m.sender.displayName}</Text>
                        {!m.read && <View style={styles.dot} />}
                      </View>
                      <Text style={[styles.msgType, { color: T.textSecondary }]}>
                        {m.type === 'encouragement' && tr('friends.sendEncouragement')}
                        {m.type === 'success' && tr('friends.sendSuccess')}
                        {m.type === 'hadith' && tr('friends.sendHadith')}
                        {m.type === 'reminder' && tr('friends.sendReminder')}
                      </Text>
                      {renderBody(m)}
                      {isOpen && m.type === 'hadith' && (
                        <Text style={[styles.hadithBody, { color: T.text }]}>
                          {hadithText[m.id] ?? '…'}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ height: 24 }} />
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
  unreadBadge: {
    minWidth: 26, height: 26, borderRadius: 13, paddingHorizontal: 7,
    backgroundColor: '#FFC531', alignItems: 'center', justifyContent: 'center',
  },
  unreadText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#1B2333' },
  emptyCard: { borderRadius: 18, padding: 28, alignItems: 'center', gap: 10 },
  emptyText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center' },
  listCard: {
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 3,
  },
  divider: { height: 1, marginLeft: 68 },
  msg: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  typeBadge: {
    position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  msgHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#6B4DFF' },
  msgType: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2 },
  hadithRef: { fontFamily: 'Nunito_700Bold', fontSize: 13, marginTop: 6 },
  hadithBody: { fontFamily: 'ScheherazadeNew_400Regular', fontSize: 19, lineHeight: 30, marginTop: 8 },
});
