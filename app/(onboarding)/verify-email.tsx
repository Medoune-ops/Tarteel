import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { verifyEmailCode, resendVerificationCode, ApiError } from '../../lib/api';
import { useT } from '../../lib/i18n';

const CODE_LENGTH = 4;

/**
 * Vérification d'email après l'inscription — feature DÉSACTIVÉE par défaut
 * (voir useAppConfigStore.emailVerificationEnabled). Cet écran n'est atteint
 * que si signup.tsx y navigue explicitement, ce qui n'arrive que si le
 * serveur a confirmé le flag actif via GET /config.
 */
export default function VerifyEmailScreen() {
  const router = useRouter();
  const tr = useT();
  const { email, forceSetup } = useLocalSearchParams<{ email: string; forceSetup?: string }>();

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
    if (loading || code.length !== CODE_LENGTH || !email) return;
    setLoading(true);
    setError(null);
    try {
      await verifyEmailCode(email, code);
      routeAfterVerify();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tr('verifyEmail.errGeneric'));
      setDigits(Array(CODE_LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resending || !email) return;
    setResending(true);
    setError(null);
    try {
      await resendVerificationCode(email);
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
    <LinearGradient colors={['#1A0F3A', '#2D1A6E', '#6B4DFF']} style={styles.screen}>
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Feather name="mail" size={44} color="#fff" />
        </View>
      </View>

      <Text style={styles.title}>{tr('verifyEmail.title')}</Text>
      <Text style={styles.sub}>
        {tr('verifyEmail.subBefore')}{'\n'}
        <Text style={styles.emailHighlight}>{email ?? tr('verifyEmail.yourEmail')}</Text>
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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 110, paddingBottom: 38 },

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
