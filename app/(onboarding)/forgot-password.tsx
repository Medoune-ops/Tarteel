import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    // TODO: appel backend reset password
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push({ pathname: '/(onboarding)/reset-sent', params: { email: email.trim() } });
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.headerGrad}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* Badge icône */}
      <View style={styles.badge}>
        <Feather name="lock" size={36} color="#fff" />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>Mot de passe oublié ?</Text>
          <Text style={styles.sub}>
            Saisis ton adresse email.{'\n'}On t'envoie un lien pour réinitialiser.
          </Text>

          <Text style={styles.label}>ADRESSE EMAIL</Text>
          <View style={styles.input}>
            <Feather name="mail" size={19} color="#9AA0AA" />
            <TextInput
              style={styles.inputText}
              value={email}
              onChangeText={setEmail}
              placeholder="ton@email.com"
              placeholderTextColor="#9AA0AA"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={submit}
            />
          </View>

          <View style={styles.hint}>
            <Feather name="info" size={13} color="#9AA0AA" />
            <Text style={styles.hintText}>Vérifie tes spams si tu ne reçois rien sous 2 min.</Text>
          </View>

          <View style={{ flex: 1 }} />

          <Pressable
            style={[styles.cta, (!email.trim() || loading) && styles.ctaDisabled]}
            onPress={submit}
            disabled={!email.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Text style={styles.ctaLabel}>Envoyer le lien</Text>
                  <Feather name="send" size={18} color="#fff" />
                </>
              )
            }
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Je me souviens — Se connecter</Text>
          </Pressable>
        </View>
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

  card: {
    flex: 1, backgroundColor: '#fff',
    borderTopLeftRadius: 34, borderTopRightRadius: 34,
    marginTop: -34, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 30,
  },
  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333',
    textAlign: 'center', marginBottom: 10,
  },
  sub: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99',
    textAlign: 'center', lineHeight: 22, marginBottom: 28,
  },
  label: {
    fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: '#525965',
    letterSpacing: 0.8, marginBottom: 8,
  },
  input: {
    width: '100%', height: 56, borderRadius: 14, backgroundColor: '#F2F3F6',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inputText: {
    flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333',
  },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 10,
  },
  hintText: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#9AA0AA', flex: 1,
  },
  cta: {
    width: '100%', height: 58, borderRadius: 16, backgroundColor: '#6B4DFF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34, shadowRadius: 18, elevation: 8,
    marginBottom: 8,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  backLink: { alignItems: 'center', marginTop: 14 },
  backLinkText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#6B4DFF' },
});
