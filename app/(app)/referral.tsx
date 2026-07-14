import { useCallback, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, Alert, ActivityIndicator, Share, ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeviceStatusBar from '../../components/StatusBar';
import { useTheme } from '../../utils/useTheme';
import { fetchReferral, redeemReferral, type ReferralInfo } from '../../lib/api';
import { ApiError } from '../../lib/api/client';
import { useT } from '../../lib/i18n';

export default function ReferralScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState(false);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setInfo(await fetchReferral());
    } catch {
      setError(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const shareCode = async () => {
    if (!info) return;
    try {
      await Share.share({
        message: tr('referral.shareMessage', { code: info.code, reward: info.rewardPerReferral }),
      });
    } catch { /* partage annulé — sans conséquence */ }
  };

  const onRedeem = async () => {
    const c = code.trim();
    if (!c || redeeming) return;
    setRedeeming(true);
    try {
      await redeemReferral(c);
      Alert.alert(tr('referral.successTitle'), tr('referral.successMessage', { reward: info?.rewardPerReferral ?? 2 }));
      setCode('');
      router.back();
    } catch (e) {
      const msg =
        e instanceof ApiError && e.status !== 0
          ? e.message
          : tr('referral.invalidCodeMessage');
      Alert.alert(tr('referral.invalidCodeTitle'), msg);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={10}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={{ fontSize: 40 }}>👥</Text>
        <Text style={styles.headerTitle}>{tr('referral.title')}</Text>
        <Text style={styles.headerSub}>{tr('referral.headerSub')}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.center}>
            <Feather name="wifi-off" size={32} color="#9AA0AA" />
            <Text style={[styles.stateText, { color: T.text }]}>{tr('referral.loadError')}</Text>
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryLabel}>{tr('referral.retry')}</Text>
            </Pressable>
          </View>
        ) : !info ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#6B4DFF" />
          </View>
        ) : (
          <>
            {/* Mon code */}
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('referral.myCodeTitle')}</Text>
            <View style={[styles.codeCard, { backgroundColor: T.cardBg }]}>
              <Text style={styles.codeValue}>{info.code}</Text>
              <Pressable style={[styles.codeActionBtn, styles.shareBtn]} onPress={shareCode} hitSlop={6}>
                <Feather name="share-2" size={18} color="#fff" />
                <Text style={[styles.codeActionText, { color: '#fff' }]}>{tr('referral.shareButton')}</Text>
              </Pressable>
            </View>

            <View style={[styles.infoRow, { backgroundColor: T.cardBg }]}>
              <Text style={{ fontSize: 22 }}>🎁</Text>
              <Text style={[styles.infoText, { color: T.text }]}>
                {info.referredCount > 0
                  ? tr(info.referredCount > 1 ? 'referral.referredCountPlural' : 'referral.referredCountSingular', { count: info.referredCount })
                  : tr('referral.rewardInfo', { reward: info.rewardPerReferral })}
              </Text>
            </View>

            {/* Saisir un code (une seule fois par compte) */}
            <Text style={[styles.sectionTitle, { color: T.text, marginTop: 26 }]}>{tr('referral.haveCodeTitle')}</Text>
            <Text style={styles.redeemHint}>{tr('referral.haveCodeHint')}</Text>
            <View style={[styles.inputRow, { backgroundColor: T.cardBg }]}>
              <TextInput
                style={[styles.input, { color: T.text }]}
                placeholder={tr('referral.codePlaceholder')}
                placeholderTextColor="#A0A5AE"
                autoCapitalize="characters"
                autoCorrect={false}
                value={code}
                onChangeText={setCode}
                maxLength={16}
              />
            </View>
            <Pressable
              style={[styles.redeemBtn, (!code.trim() || redeeming) && { opacity: 0.5 }]}
              onPress={onRedeem}
              disabled={!code.trim() || redeeming}
            >
              {redeeming
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.redeemText}>{tr('referral.validateButton')}</Text>}
            </Pressable>
            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 26, paddingHorizontal: 22, alignItems: 'center' },
  back: { position: 'absolute', top: 16, left: 18, padding: 4, zIndex: 2 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', marginTop: 8 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2, textAlign: 'center' },
  body: { padding: 18 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 60 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginBottom: 12 },
  redeemHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: -6, marginBottom: 12 },
  codeCard: {
    borderRadius: 18, padding: 20, alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  codeValue: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: '#6B4DFF', letterSpacing: 4 },
  codeActions: { flexDirection: 'row', gap: 10 },
  codeActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#DDD8FF',
  },
  shareBtn: { backgroundColor: '#6B4DFF', borderColor: '#6B4DFF' },
  codeActionText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16, marginTop: 12,
  },
  infoText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  inputRow: { borderRadius: 16, paddingHorizontal: 16, height: 54, justifyContent: 'center' },
  input: { fontFamily: 'Baloo2_700Bold', fontSize: 18, letterSpacing: 2, padding: 0 },
  redeemBtn: {
    marginTop: 12, backgroundColor: '#6B4DFF', borderRadius: 16, height: 54,
    alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 4, borderBottomColor: '#4A30CC',
  },
  redeemText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
});
