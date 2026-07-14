import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../utils/useTheme';
import { updateProfile, ApiError } from '../../lib/api';
import { useT } from '../../lib/i18n';

/** Initiales calculées à partir du nom (fallback avatar). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EditProfileScreen() {
  const router = useRouter();
  const tr = useT();
  const T = useTheme();
  const storedName = useUserStore((s) => s.name);
  const storedUsername = useUserStore((s) => s.username);
  const email = useUserStore((s) => s.email);
  const setProfile = useUserStore((s) => s.setProfile);

  const [name, setName] = useState(storedName);
  const [username, setUsername] = useState(storedUsername ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pseudo public : mêmes règles que le backend (3–20, lettres/chiffres/._).
  const pseudo = username.trim().toLowerCase();
  const usernameDirty = pseudo !== (storedUsername ?? '');
  const usernameValid = pseudo === '' || /^[a-z0-9._]{3,20}$/.test(pseudo);

  const nameDirty = name.trim() !== storedName.trim();
  const dirty = nameDirty || usernameDirty;
  const canSave = dirty && name.trim().length > 0 && usernameValid && !loading;

  const save = async () => {
    if (!canSave) return;
    setLoading(true);
    setError(null);
    try {
      await updateProfile({
        ...(nameDirty ? { name: name.trim() } : {}),
        // Le pseudo ne peut pas être vidé (colonne unique) — on ne l'envoie
        // que s'il est renseigné et modifié.
        ...(usernameDirty && pseudo ? { username: pseudo } : {}),
      });
      router.back();
    } catch (e) {
      // Hors-ligne / pas encore de backend : on garde la modif en local.
      if (e instanceof ApiError && e.status === 0) {
        setProfile({ name: name.trim() });
        router.back();
        return;
      }
      setError(e instanceof ApiError ? e.message : tr('editProfile.genericError'));
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomColor: T.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.back, { color: T.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: T.text }]}>{tr('editProfile.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar (initiales) */}
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{initials(name || storedName)}</Text>
          </View>

          <Text style={[styles.label, { color: T.sectionLabel }]}>{tr('editProfile.fullNameLabel')}</Text>
          <View style={[styles.input, { backgroundColor: T.cardBg }]}>
            <Feather name="user" size={19} color="#9AA0AA" />
            <TextInput
              style={[styles.inputText, { color: T.text }]}
              value={name}
              onChangeText={setName}
              placeholder={tr('editProfile.namePlaceholder')}
              placeholderTextColor="#9AA0AA"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>

          <Text style={[styles.label, { color: T.sectionLabel, marginTop: 18 }]}>{tr('editProfile.usernameLabel')}</Text>
          <View style={[styles.input, { backgroundColor: T.cardBg }]}>
            <Feather name="at-sign" size={19} color="#9AA0AA" />
            <TextInput
              style={[styles.inputText, { color: T.text }]}
              value={username}
              onChangeText={setUsername}
              placeholder={tr('editProfile.usernamePlaceholder')}
              placeholderTextColor="#9AA0AA"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={save}
            />
          </View>
          <Text style={[styles.note, { color: usernameValid ? T.textSecondary : '#E5484D' }]}>
            {usernameValid
              ? tr('editProfile.usernameHint')
              : tr('editProfile.usernameRules')}
          </Text>

          <Text style={[styles.label, { color: T.sectionLabel, marginTop: 18 }]}>{tr('editProfile.emailLabel')}</Text>
          <View style={[styles.input, styles.inputDisabled]}>
            <Feather name="mail" size={19} color="#9AA0AA" />
            <Text style={[styles.inputText, { color: '#9AA0AA' }]}>{email || '—'}</Text>
          </View>
          <Text style={[styles.note, { color: T.textSecondary }]}>
            {tr('editProfile.emailImmutable')}
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={{ flex: 1 }} />

          <Pressable style={[styles.cta, !canSave && styles.ctaDisabled]} onPress={save} disabled={!canSave}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaLabel}>{tr('editProfile.save')}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 28,
  },
  avatarInitials: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: '#fff' },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#525965', letterSpacing: 0.8, marginBottom: 8 },
  input: {
    width: '100%', height: 56, borderRadius: 14, backgroundColor: '#fff',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inputDisabled: { opacity: 0.7 },
  inputText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },
  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', marginTop: 8 },
  errorText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#E5484D', textAlign: 'center', marginTop: 16 },
  cta: {
    width: '100%', height: 58, borderRadius: 16, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
});
