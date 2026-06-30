import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { confirmPasswordReset, ApiError } from '../../lib/api';

type Strength = 'vide' | 'faible' | 'moyen' | 'fort';

function getStrength(pwd: string): Strength {
  if (!pwd) return 'vide';
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return 'faible';
  if (score <= 2) return 'moyen';
  return 'fort';
}

const STRENGTH_COLOR: Record<Strength, string> = {
  vide: '#E2E4E9',
  faible: '#FF4B4B',
  moyen: '#F0A41E',
  fort: '#34C724',
};
const STRENGTH_LABEL: Record<Strength, string> = {
  vide: '',
  faible: 'Faible',
  moyen: 'Moyen',
  fort: 'Fort ✓',
};

function StrengthBar({ strength }: { strength: Strength }) {
  const levels: Strength[] = ['faible', 'moyen', 'fort'];
  const idx = levels.indexOf(strength);
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop: 8 }}>
      {levels.map((_, i) => (
        <View
          key={i}
          style={[styles.strengthSeg, {
            backgroundColor: i <= idx && strength !== 'vide'
              ? STRENGTH_COLOR[strength]
              : '#E2E4E9',
          }]}
        />
      ))}
    </View>
  );
}

function CheckItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkIcon, ok ? styles.checkIconOn : styles.checkIconOff]}>
        <Feather name="check" size={11} color={ok ? '#fff' : '#9AA0AA'} />
      </View>
      <Text style={[styles.checkLabel, ok && styles.checkLabelOn]}>{label}</Text>
    </View>
  );
}

function PwdField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.input}>
      <Feather name="lock" size={19} color="#9AA0AA" />
      <TextInput
        style={styles.inputText}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA0AA"
        secureTextEntry={hidden}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password-new"
      />
      <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
        <Feather name={hidden ? 'eye' : 'eye-off'} size={19} color="#9AA0AA" />
      </Pressable>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = getStrength(pwd);
  const hasMin8    = pwd.length >= 8;
  const hasCase    = /[A-Z]/.test(pwd) && /[a-z]/.test(pwd);
  const hasNumber  = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  const matches    = pwd.length > 0 && pwd === confirm;
  const canSubmit  = hasMin8 && hasCase && hasNumber && hasSpecial && matches;

  const submit = async () => {
    if (!canSubmit || loading) return;
    if (!token) {
      setError('Lien invalide ou expiré. Refais une demande de réinitialisation.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(token, pwd);
      router.replace('/(onboarding)/signup');
    } catch (e) {
      setError(
        e instanceof ApiError
          ? 'Lien invalide ou expiré. Refais une demande de réinitialisation.'
          : 'Une erreur est survenue. Réessaie.',
      );
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.headerGrad}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
      </LinearGradient>

      <View style={styles.badge}>
        <Feather name="shield" size={36} color="#fff" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Nouveau mot de passe</Text>
          <Text style={styles.sub}>Choisis un mot de passe solide.</Text>

          {/* Nouveau MDP */}
          <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
          <PwdField value={pwd} onChange={setPwd} placeholder="Mot de passe" />
          {pwd.length > 0 && (
            <>
              <StrengthBar strength={strength} />
              <Text style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
                {STRENGTH_LABEL[strength]}
              </Text>
            </>
          )}

          {/* Confirmation */}
          <Text style={[styles.label, { marginTop: 18 }]}>CONFIRMER LE MOT DE PASSE</Text>
          <PwdField value={confirm} onChange={setConfirm} placeholder="Confirmer le mot de passe" />
          {confirm.length > 0 && (
            <Text style={[styles.matchLabel, { color: matches ? '#34C724' : '#FF4B4B' }]}>
              {matches ? 'Les mots de passe correspondent ✓' : 'Les mots de passe ne correspondent pas'}
            </Text>
          )}

          {/* Critères */}
          <View style={styles.criteria}>
            <CheckItem ok={hasMin8}    label="Au moins 8 caractères" />
            <CheckItem ok={hasCase}    label="Une majuscule et une minuscule" />
            <CheckItem ok={hasNumber}  label="Un chiffre" />
            <CheckItem ok={hasSpecial} label="Un caractère spécial (!@#$…)" />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* CTA */}
          <Pressable
            style={[styles.cta, (!canSubmit || loading) && styles.ctaDisabled]}
            onPress={submit}
            disabled={!canSubmit || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Text style={styles.ctaLabel}>Enregistrer le mot de passe</Text>
                  <Feather name="check" size={18} color="#fff" />
                </>
              )
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  headerGrad: { height: 190 },
  back: { position: 'absolute', top: 54, left: 22 },

  badge: {
    position: 'absolute', top: 140, alignSelf: 'center',
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 22, elevation: 10,
  },

  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 34, borderTopRightRadius: 34, marginTop: -34 },
  cardContent: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 30 },

  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333', textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', textAlign: 'center', marginBottom: 24 },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#525965', letterSpacing: 0.8, marginBottom: 8 },

  input: {
    width: '100%', height: 56, borderRadius: 14, backgroundColor: '#F2F3F6',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inputText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },

  strengthSeg: { flex: 1, height: 4, borderRadius: 3 },
  strengthLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, marginTop: 5 },
  matchLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, marginTop: 6 },

  criteria: {
    backgroundColor: '#F8F9FB', borderRadius: 14, padding: 14, marginTop: 14, gap: 8,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkIconOff: { backgroundColor: '#E2E4E9' },
  checkIconOn: { backgroundColor: '#34C724' },
  checkLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99' },
  checkLabelOn: { color: '#2A9E1C', fontFamily: 'Nunito_700Bold' },

  cta: {
    width: '100%', height: 58, borderRadius: 16, backgroundColor: '#6B4DFF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34, shadowRadius: 18, elevation: 8, marginTop: 20,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  errorText: {
    fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#E5484D',
    textAlign: 'center', marginTop: 16,
  },
});
