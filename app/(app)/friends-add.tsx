import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput, Animated, Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import DeviceStatusBar from '../../components/StatusBar';
import FriendsHeader from '../../components/FriendsHeader';
import FriendButton from '../../components/FriendButton';
import Confetti from '../../components/Confetti';
import { useTheme } from '../../utils/useTheme';
import { friendPalette } from '../../utils/friendTheme';
import { addFriend, ApiError } from '../../lib/api';
import { useT } from '../../lib/i18n';

/** Extrait un code Amis depuis un QR (tarteel://add?code=X ou https://.../f/X). */
function codeFromScanned(raw: string): string | null {
  const m = raw.match(/^tarteel:\/\/add\?code=([A-Z0-9]{6})$/i) || raw.match(/^https?:\/\/[^/]+\/f\/([A-Z0-9]{6})$/i);
  return m ? m[1].toUpperCase() : null;
}

/** Coins du viseur de scan (4 équerres) + ligne qui balaye. */
function ScanFrame({ progress }: { progress: Animated.Value }) {
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [16, 208] });
  return (
    <>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
    </>
  );
}

export default function FriendsAddScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const P = friendPalette(T.isDark);
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const busy = useRef(false);
  const autoSubmitted = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  // Balayage continu de la ligne quand le scanner est ouvert.
  useEffect(() => {
    if (!scanning) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(scanAnim, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(scanAnim, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [scanning, scanAnim]);

  const runAdd = useCallback(async (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c || busy.current) return;
    busy.current = true;
    setSubmitting(true);
    setScanning(false);
    try {
      const res = await addFriend(c);
      if (res.accepted) setCelebrate(true);
      Alert.alert(
        res.accepted ? tr('friends.addedTitle') : tr('friends.requestSentTitle'),
        res.accepted ? tr('friends.addedMessage') : tr('friends.requestSentMessage'),
        [
          { text: tr('common.ok'), onPress: () => router.back() },
        ],
      );
    } catch (e) {
      const reason = e instanceof ApiError ? e.message : tr('friends.errorCode');
      const isLimit = e instanceof ApiError && e.code === 'FRIEND_LIMIT_REACHED';
      Alert.alert(isLimit ? tr('friends.limitTitle') : tr('friends.addErrorTitle'), reason);
      if (isLimit) router.push('/(app)/subscription');
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  }, [router, tr]);

  // Deep link entrant : tarteel://add?code=X (page publique /f/:code ou QR).
  useEffect(() => {
    if (params.code && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void runAdd(params.code);
    }
  }, [params.code, runAdd]);

  const onScan = useCallback(({ data }: { data: string }) => {
    if (busy.current) return;
    const c = codeFromScanned(data);
    if (!c) {
      Alert.alert(tr('friends.scanFailed'));
      return;
    }
    void runAdd(c);
  }, [runAdd, tr]);

  const toggleScan = async () => {
    if (scanning) { setScanning(false); return; }
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Caméra', tr('friends.scanFailed'));
        return;
      }
    }
    setScanning(true);
  };

  const cells = Array.from({ length: 6 });

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      {celebrate && <Confetti count={48} />}
      <FriendsHeader emoji="🤝" title={tr('friends.addButton')} subtitle={tr('friends.scanHint')} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Scanner */}
        <View style={styles.cameraCard}>
          {scanning ? (
            <View style={styles.cameraWrap}>
              {permission?.granted ? (
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={onScan}
                />
              ) : (
                <Pressable style={styles.camFallback} onPress={toggleScan}>
                  <Feather name="camera" size={28} color="#6B4DFF" />
                  <Text style={{ color: T.text, fontFamily: 'Nunito_700Bold', marginTop: 8 }}>{tr('friends.scanHint')}</Text>
                </Pressable>
              )}
              <ScanFrame progress={scanAnim} />
              <Pressable style={styles.camClose} onPress={() => setScanning(false)} hitSlop={8}>
                <Feather name="x" size={22} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.scanBtn} onPress={toggleScan}>
              <View style={styles.scanIconRing}>
                <Feather name="camera" size={22} color="#6B4DFF" />
              </View>
              <Text style={styles.scanBtnText}>{tr('friends.scanTitle')}</Text>
            </Pressable>
          )}
        </View>

        {/* Saisie manuelle */}
        <Text style={[styles.orLabel, { color: T.textSecondary }]}>— {tr('common.or')} —</Text>
        <Pressable style={styles.codeBoxes} onPress={() => inputRef.current?.focus()}>
          {cells.map((_, i) => (
            <View
              key={i}
              style={[
                styles.codeCell,
                { backgroundColor: T.cardBg, borderColor: code[i] ? '#6B4DFF' : P.tintBorder },
              ]}
            >
              <Text style={[styles.codeCellText, { color: T.text }]}>{code[i] ?? ''}</Text>
            </View>
          ))}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            editable={!submitting}
          />
        </Pressable>
        <FriendButton
          label={tr('friends.codeAdd')}
          icon="check"
          loading={submitting}
          disabled={code.trim().length < 6}
          onPress={() => runAdd(code)}
          style={{ marginTop: 14 }}
        />

        <View style={[styles.infoRow, { backgroundColor: T.cardBg }]}>
          <Feather name="info" size={18} color="#6B4DFF" />
          <Text style={[styles.infoText, { color: T.textSecondary }]}>{tr('friends.qrHint')}</Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const C = 3;
const L = 26;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { padding: 18 },
  cameraCard: { borderRadius: 18, overflow: 'hidden' },
  cameraWrap: { height: 260, borderRadius: 18, overflow: 'hidden', backgroundColor: '#000' },
  camFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camClose: {
    position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  // Viseur
  corner: { position: 'absolute', width: L, height: L, borderColor: '#fff' },
  cornerTL: { top: 20, left: 20, borderTopWidth: C, borderLeftWidth: C, borderTopLeftRadius: 10 },
  cornerTR: { top: 20, right: 20, borderTopWidth: C, borderRightWidth: C, borderTopRightRadius: 10 },
  cornerBL: { bottom: 20, left: 20, borderBottomWidth: C, borderLeftWidth: C, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 20, right: 20, borderBottomWidth: C, borderRightWidth: C, borderBottomRightRadius: 10 },
  scanLine: {
    position: 'absolute', left: 26, right: 26, top: 0, height: 2, borderRadius: 1,
    backgroundColor: '#8A6BFF',
    shadowColor: '#8A6BFF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 8, elevation: 4,
  },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    height: 72, borderRadius: 18, borderWidth: 1.5, borderColor: '#DDD8FF', borderStyle: 'dashed',
  },
  scanIconRing: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEAFF',
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#6B4DFF' },
  orLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, textAlign: 'center', marginVertical: 16 },
  codeBoxes: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  codeCell: {
    flex: 1, aspectRatio: 0.82, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  codeCellText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24 },
  hiddenInput: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.01 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 16, marginTop: 18 },
  infoText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
});
