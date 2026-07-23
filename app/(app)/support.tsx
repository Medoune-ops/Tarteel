import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { sendSupportMessage } from '../../lib/api';
import { t as tr } from '../../lib/i18n';

export default function SupportScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const envoyer = async () => {
    if (sending) return;
    if (!message.trim()) {
      Alert.alert(tr('support.errorTitle'), tr('support.errorEmpty'));
      return;
    }
    setSending(true);
    try {
      await sendSupportMessage(message.trim());
      setMessage('');
      Alert.alert(tr('support.sentTitle'), tr('support.sentMessage'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(tr('support.errorTitle'), tr('support.errorGeneric'));
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('support.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>{tr('support.intro')}</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.textarea}
            value={message}
            onChangeText={setMessage}
            placeholder={tr('support.placeholder')}
            placeholderTextColor="#9AA0AA"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        <Pressable
          style={[styles.sendBtn, (sending || !message.trim()) && { opacity: 0.5 }]}
          onPress={envoyer}
          disabled={sending || !message.trim()}
        >
          {sending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.sendBtnText}>{tr('support.send')}</Text>}
        </Pressable>
      </ScrollView>
    </View>
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
  content: { paddingHorizontal: 22, paddingVertical: 18 },
  intro: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#5A6270', marginBottom: 16, lineHeight: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
    padding: 16, marginBottom: 18,
  },
  textarea: {
    minHeight: 160,
    fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#1B2333',
  },
  sendBtn: {
    height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0820C',
  },
  sendBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
});
