import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../utils/useTheme';
import { changePassword, ApiError } from '../../lib/api';

function PwdField({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [hidden, setHidden] = useState(true);
  const T = useTheme();
  return (
    <View style={[styles.input, { backgroundColor: T.cardBg }]}>
      <Feather name="lock" size={19} color="#9AA0AA" />
      <TextInput
        style={[styles.inputText, { color: T.text }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA0AA"
        secureTextEntry={hidden}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
        <Feather name={hidden ? 'eye' : 'eye-off'} size={19} color="#9AA0AA" />
      </Pressable>
    </View>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const T = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const hasMin8    = next.length >= 8;
  const hasCase    = /[A-Z]/.test(next) && /[a-z]/.test(next);
  const hasNumber  = /[0-9]/.test(next);
  const hasSpecial = /[^A-Za-z0-9]/.test(next);
  const matches    = next.length > 0 && next === confirm;
  const strongEnough = hasMin8 && hasCase && hasNumber && hasSpecial;
  const canSubmit = !!current && strongEnough && matches && !loading;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await changePassword(current, next);
      setDone(true);
      setTimeout(() => router.back(), 900);
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? 'Mot de passe actuel incorrect.'
          : e instanceof ApiError ? e.message : 'Une erreur est survenue. Réessaie.',
      );
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.back, { color: T.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: T.text }]}>Mot de passe</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.label, { color: T.sectionLabel }]}>MOT DE PASSE ACTUEL</Text>
          <PwdField value={current} onChange={setCurrent} placeholder="Mot de passe actuel" />

          <Text style={[styles.label, { color: T.sectionLabel, marginTop: 18 }]}>NOUVEAU MOT DE PASSE</Text>
          <PwdField value={next} onChange={setNext} placeholder="Nouveau mot de passe" />

          <Text style={[styles.label, { color: T.sectionLabel, marginTop: 18 }]}>CONFIRMER</Text>
          <PwdField value={confirm} onChange={setConfirm} placeholder="Confirmer le nouveau mot de passe" />
          {confirm.length > 0 && (
            <Text style={[styles.matchLabel, { color: matches ? '#34C724' : '#FF4B4B' }]}>
              {matches ? 'Les mots de passe correspondent ✓' : 'Les mots de passe ne correspondent pas'}
            </Text>
          )}

          <View style={[styles.criteria, { backgroundColor: T.cardBg }]}>
            <Check ok={hasMin8}    label="Au moins 8 caractères" />
            <Check ok={hasCase}    label="Une majuscule et une minuscule" />
            <Check ok={hasNumber}  label="Un chiffre" />
            <Check ok={hasSpecial} label="Un caractère spécial (!@#$…)" />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {done && <Text style={styles.successText}>Mot de passe mis à jour ✓</Text>}

          <View style={{ flex: 1 }} />

          <Pressable style={[styles.cta, !canSubmit && styles.ctaDisabled]} onPress={submit} disabled={!canSubmit}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaLabel}>Mettre à jour</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.checkRow}>
      <View style={[styles.checkIcon, ok ? styles.checkIconOn : styles.checkIconOff]}>
        <Feather name="check" size={11} color={ok ? '#fff' : '#9AA0AA'} />
      </View>
      <Text style={[styles.checkLabel, ok && styles.checkLabelOn]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1,
  },
  back: { fontSize: 34, color: '#1B2333', lineHeight: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 30, flexGrow: 1 },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#525965', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    width: '100%', height: 56, borderRadius: 14, backgroundColor: '#fff',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inputText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },
  matchLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, marginTop: 6 },
  criteria: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 16, gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkIcon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkIconOff: { backgroundColor: '#E2E4E9' },
  checkIconOn: { backgroundColor: '#34C724' },
  checkLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99' },
  checkLabelOn: { color: '#2A9E1C', fontFamily: 'Nunito_700Bold' },
  errorText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#E5484D', textAlign: 'center', marginTop: 16 },
  successText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#2A9E1C', textAlign: 'center', marginTop: 16 },
  cta: {
    width: '100%', height: 58, borderRadius: 16, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
});
