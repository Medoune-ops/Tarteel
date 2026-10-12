import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Share, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendButton from '../../components/FriendButton';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import { fetchFriendCode } from '../../lib/api';
import { useT } from '../../lib/i18n';

export default function FriendsQrScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { code: c } = await fetchFriendCode();
      setCode(c);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const share = async () => {
    if (!code) return;
    try {
      await Share.share({ message: tr('friends.shareMessage', { code }) });
    } catch {
      /* partage annulé */
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <FriendsHeader emoji="🔳" title={tr('friends.qrTitle')} subtitle={tr('friends.qrHint')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.center}>
            <Feather name="wifi-off" size={32} color="#9AA0AA" />
            <Text style={[styles.stateText, { color: T.text }]}>{tr('friends.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryLabel}>{tr('friends.retry')}</Text>
            </Pressable>
          </View>
        ) : loading || !code ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6B4DFF" />
          </View>
        ) : (
          <View style={styles.center}>
            <View style={styles.qrOuter}>
              <LinearGradient
                colors={T.isDark ? ['#2A2740', '#221F38'] : ['#F3F0FF', '#EAE4FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.qrCard}
              >
                <View style={[styles.qrGlow, { backgroundColor: T.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(107,77,255,0.08)' }]} />
                <View style={styles.qrWhite}>
                  <QRCode value={`tarteel://add?code=${code}`} size={228} color="#1B2333" backgroundColor="#fff" />
                </View>
                <View style={[styles.codePill, { backgroundColor: P.tint }]}>
                  <Feather name="user-plus" size={15} color="#6B4DFF" />
                  <Text style={styles.codeValue}>{code}</Text>
                </View>
              </LinearGradient>
            </View>
            <FriendButton
              label={tr('friends.shareLink')}
              icon="share-2"
              onPress={share}
              style={{ marginTop: 24 }}
            />
            <View style={{ height: 24 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 18 },
  center: { alignItems: 'center', paddingVertical: 30, gap: 6, width: '100%' },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  qrOuter: {
    borderRadius: 28, shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28, shadowRadius: 24, elevation: 7,
  },
  qrCard: { borderRadius: 28, padding: 24, alignItems: 'center', gap: 18, overflow: 'hidden' },
  qrGlow: { position: 'absolute', top: -40, right: -30, width: 140, height: 140, borderRadius: 70 },
  qrWhite: { borderRadius: 20, padding: 14, backgroundColor: '#fff' },
  codePill: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 10 },
  codeValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#6B4DFF', letterSpacing: 5 },
});
