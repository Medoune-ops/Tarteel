import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, FlatList, StyleSheet, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { sendSupportMessage, getSupportThread, type SupportThreadMessage } from '../../lib/api';
import { t as tr } from '../../lib/i18n';

function Bubble({ item }: { item: SupportThreadMessage }) {
  return (
    <View style={[styles.bubbleRow, item.fromAdmin ? styles.bubbleRowLeft : styles.bubbleRowRight]}>
      {item.fromAdmin && <Text style={styles.senderLabel}>{tr('support.adminName')}</Text>}
      <View style={[styles.bubble, item.fromAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
        <Text style={[styles.bubbleText, item.fromAdmin ? styles.bubbleTextAdmin : styles.bubbleTextUser]}>
          {item.message}
        </Text>
      </View>
    </View>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  const [thread, setThread] = useState<SupportThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<SupportThreadMessage>>(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const messages = await getSupportThread();
      setThread(messages);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const envoyer = async () => {
    const text = message.trim();
    if (sending || !text) return;
    setSending(true);
    try {
      const result = await sendSupportMessage(text);
      setThread((prev) => [...prev, { id: result.id, message: text, fromAdmin: false, createdAt: result.createdAt }]);
      setMessage('');
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch {
      // Le message reste dans le champ de saisie pour permettre de réessayer.
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{tr('support.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#F0820C" />
          </View>
        ) : loadError ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{tr('support.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={() => { setLoading(true); load(); }}>
              <Text style={styles.retryBtnText}>{tr('support.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={thread}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <Bubble item={item} />}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <Text style={styles.intro}>{tr('support.emptyState')}</Text>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder={tr('support.placeholder')}
            placeholderTextColor="#9AA0AA"
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendBtn, (sending || !message.trim()) && { opacity: 0.5 }]}
            onPress={envoyer}
            disabled={sending || !message.trim()}
          >
            {sending
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.sendBtnText}>{tr('support.send')}</Text>}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { fontSize: 34, color: '#1B2333', lineHeight: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  errorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#5A6270', textAlign: 'center' },
  retryBtn: { backgroundColor: '#F0820C', borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },

  list: { paddingHorizontal: 18, paddingVertical: 16, flexGrow: 1 },
  intro: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99',
    textAlign: 'center', lineHeight: 20, marginTop: 30,
  },

  bubbleRow: { marginBottom: 12, maxWidth: '82%' },
  bubbleRowRight: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleRowLeft: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderLabel: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: '#8A8F99', marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { backgroundColor: '#F0820C', borderBottomRightRadius: 4 },
  bubbleAdmin: {
    backgroundColor: '#fff', borderBottomLeftRadius: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  bubbleText: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, lineHeight: 21 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAdmin: { color: '#1B2333' },

  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E6E8ED',
  },
  input: {
    flex: 1, maxHeight: 100, minHeight: 44, borderRadius: 16,
    backgroundColor: '#F4F5F9', paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#1B2333',
  },
  sendBtn: {
    height: 44, minWidth: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0820C', paddingHorizontal: 16,
  },
  sendBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
});
