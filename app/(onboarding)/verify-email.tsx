import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { verifyEmailCode, resendVerificationCode, ApiError } from '../../lib/api';
import { useT } from '../../lib/i18n';

const CODE_LENGTH = 4;

/**
 * Vérification d'email après l'inscription — tant que user.emailVerified est
 * false, l'utilisateur reste ici (register, splash, ou filet EMAIL_NOT_VERIFIED).
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const tr = useT();
  const { email, forceSetup } = useLocalSearchParams<{ email: string; forceSetup?: string }>();
  const storeEmail = useUserStore((s) => s.email);
  const activeEmail = (email || storeEmail || '').trim();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');

  const routeAfterVerify = () => {
    if (forceSetup === '1' || !useUserStore.getState().onboardingDone) {
      router.replace('/(setup)/niveau');
    } else {
      router.replace('/(app)/(tabs)/parcours');
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/signup');
    }
  };

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < CODE_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const submit = async () => {
    Keyboard.dismiss();
    if (loading || code.length !== CODE_LENGTH || !activeEmail) return;
    setLoading(true);
    setError(null);
    try {
      await verifyEmailCode(activeEmail, code.trim());
      routeAfterVerify();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'TOKEN_EXPIRED') {
        setError(tr('verifyEmail.codeExpired'));
      } else {
        setError(e instanceof ApiError ? e.message : tr('verifyEmail.errGeneric'));
      }
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    Keyboard.dismiss();
    if (resending || !activeEmail) return;
    setResending(true);
    setError(null);
    try {
      await resendVerificationCode(activeEmail);
      setResent(true);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tr('verifyEmail.errGeneric'));
    } finally {
      setResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient colors={['#1A0F3A', '#2D1A6E', '#6B4DFF']} style={styles.screen}>
          
          <Pressable style={styles.backBtn} onPress={goBack} hitSlop={20}>
            <Feather name="arrow-left" size={28} color="#fff" />
          </Pressable>

          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Feather name="mail" size={44} color="#fff" />
            </View>
          </View>

      <Text style={styles.title}>{tr('verifyEmail.title')}</Text>
      <Text style={styles.sub}>
        {tr('verifyEmail.subBefore')}{'\n'}
        <Text style={styles.emailHighlight}>{activeEmail || tr('verifyEmail.yourEmail')}</Text>
      </Text>

      <View style={styles.codeRow}>
        {digits.map((d, i) => (
          <TextInput
            key={i}
            ref={(r) => { inputs.current[i] = r; }}
            style={[styles.codeBox, d !== '' && styles.codeBoxFilled]}
            value={d}
            onChangeText={(v) => setDigit(i, v)}
            onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {resent && !error && <Text style={styles.resentText}>{tr('verifyEmail.resentConfirm')}</Text>}

      <Pressable
        style={[styles.cta, (loading || code.length !== CODE_LENGTH) && styles.ctaDisabled]}
        onPress={submit}
        disabled={loading || code.length !== CODE_LENGTH}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaLabel}>{tr('verifyEmail.confirm')}</Text>}
      </Pressable>

      <View style={{ flex: 1 }} />

      <Pressable style={styles.resend} onPress={resend} disabled={resending}>
        {resending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.resendText}>{tr('verifyEmail.resend')}</Text>
        )}
      </Pressable>
        </LinearGradient>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 110, paddingBottom: 38 },

  backBtn: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconWrap: { marginBottom: 28 },
  iconCircle: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff',
    textAlign: 'center', marginBottom: 12,
  },
  sub: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', lineHeight: 24, marginBottom: 32,
  },
  emailHighlight: { fontFamily: 'Nunito_800ExtraBold', color: '#fff' },

  codeRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  codeBox: {
    width: 58, height: 66, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#fff',
  },
  codeBoxFilled: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.22)' },

  errorText: {
    fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#FFB4B4',
    textAlign: 'center', marginBottom: 16,
  },
  resentText: {
    fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#B4FFC2',
    textAlign: 'center', marginBottom: 16,
  },

  cta: {
    width: '100%', height: 58, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },

  resend: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  resendText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },
});
