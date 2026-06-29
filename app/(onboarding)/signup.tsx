import { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome } from '@expo/vector-icons';
import Otter from '../../components/Otter';
import { useUserStore } from '../../store/userStore';

type Mode = 'login' | 'signup';

/** Champ de saisie réutilisable (icône + TextInput + œil pour les mots de passe). */
function Field({
  icon, value, onChangeText, placeholder, secure, keyboardType, autoCapitalize, autoComplete,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  autoComplete?: 'email' | 'name' | 'username' | 'password' | 'password-new';
}) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.input}>
      <Feather name={icon} size={19} color="#9AA0AA" />
      <TextInput
        style={styles.inputText}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA0AA"
        secureTextEntry={hidden}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoComplete={autoComplete}
        autoCorrect={false}
      />
      {secure && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Feather name={hidden ? 'eye' : 'eye-off'} size={19} color="#9AA0AA" />
        </Pressable>
      )}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');

  // Champs communs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Champs inscription
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptCgu, setAcceptCgu] = useState(false);

  const isSignup = mode === 'signup';
  const onboardingDone = useUserStore((s) => s.onboardingDone);

  const submit = () => {
    // Auth réelle à brancher plus tard (JWT).
    // Inscription → toujours la config sur mesure (niveau → objectif → temps → plan).
    // Connexion → la config seulement si le profil n'a pas encore été configuré.
    if (isSignup || !onboardingDone) {
      router.replace('/(setup)/niveau');
    } else {
      router.replace('/(app)/(tabs)/parcours');
    }
  };

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.headerGrad} />

      {/* Avatar */}
      <View style={styles.avatar}>
        <View style={styles.avatarClip}>
          <Otter size={74} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.card} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.appName}>Tarteel</Text>
          <Text style={styles.welcome}>{isSignup ? 'Crée ton compte' : 'Bon retour'}</Text>
          <Text style={styles.sub}>
            {isSignup ? 'Rejoins-nous gratuitement' : 'Connecte-toi pour continuer'}
          </Text>

          {/* Onglets Connexion / Inscription */}
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, !isSignup && styles.tabActive]} onPress={() => setMode('login')}>
              <Text style={[styles.tabText, !isSignup && styles.tabTextActive]}>Connexion</Text>
            </Pressable>
            <Pressable style={[styles.tab, isSignup && styles.tabActive]} onPress={() => setMode('signup')}>
              <Text style={[styles.tabText, isSignup && styles.tabTextActive]}>Inscription</Text>
            </Pressable>
          </View>

          {/* Boutons sociaux */}
          <Pressable style={styles.googleBtn}>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.socialLabel}>Continuer avec Google</Text>
          </Pressable>
          <Pressable style={styles.appleBtn}>
            <FontAwesome name="apple" size={22} color="#fff" />
            <Text style={styles.appleLabel}>Continuer avec Apple</Text>
          </Pressable>

          {/* Séparateur */}
          <View style={styles.separator}>
            <View style={styles.line} />
            <Text style={styles.ou}>ou {isSignup ? "s'inscrire" : 'se connecter'} avec un email</Text>
            <View style={styles.line} />
          </View>

          {/* Champs spécifiques à l'inscription */}
          {isSignup && (
            <>
              <Field icon="user" value={fullName} onChangeText={setFullName} placeholder="Nom complet" autoCapitalize="words" autoComplete="name" />
              <View style={{ height: 12 }} />
              <Field icon="at-sign" value={username} onChangeText={setUsername} placeholder="Nom d'utilisateur" autoComplete="username" />
              <View style={{ height: 12 }} />
            </>
          )}

          {/* Email + mot de passe (communs) */}
          <Field icon="mail" value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoComplete="email" />
          <View style={{ height: 12 }} />
          <Field
            icon="lock" value={password} onChangeText={setPassword} placeholder="Mot de passe" secure
            autoComplete={isSignup ? 'password-new' : 'password'}
          />

          {/* Confirmation + CGU (inscription uniquement) */}
          {isSignup ? (
            <>
              <View style={{ height: 12 }} />
              <Field icon="lock" value={confirm} onChangeText={setConfirm} placeholder="Confirmer le mot de passe" secure autoComplete="password-new" />

              <Pressable style={styles.cguRow} onPress={() => setAcceptCgu((v) => !v)}>
                <View style={[styles.checkbox, acceptCgu && styles.checkboxOn]}>
                  {acceptCgu && <Feather name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.cguText}>
                  J'accepte les <Text style={styles.cguLink}>Conditions d'utilisation</Text> et la{' '}
                  <Text style={styles.cguLink}>Politique de confidentialité</Text>.
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.forgot} hitSlop={6} onPress={() => router.push('/(onboarding)/forgot-password')}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>
          )}

          {/* CTA */}
          <Pressable
            style={[styles.cta, isSignup && !acceptCgu && styles.ctaDisabled]}
            onPress={submit}
            disabled={isSignup && !acceptCgu}
          >
            <Text style={styles.ctaLabel}>{isSignup ? 'Créer mon compte' : 'Se connecter'}</Text>
          </Pressable>

          {/* Bascule */}
          <Pressable onPress={() => setMode(isSignup ? 'login' : 'signup')}>
            <Text style={styles.switchLink}>
              {isSignup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
              <Text style={styles.switchStrong}>{isSignup ? 'Se connecter' : "S'inscrire"}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  headerGrad: { height: 230 },
  card: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 34, borderTopRightRadius: 34, marginTop: -34 },
  cardContent: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 64, paddingBottom: 30 },
  avatar: {
    position: 'absolute', top: 148, alignSelf: 'center',
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 22, elevation: 10,
  },
  avatarClip: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  appName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333', marginTop: 14 },
  welcome: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#1B2333', marginTop: 2 },
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 15, color: '#8A8F99', marginTop: 6 },

  // Onglets
  tabs: { flexDirection: 'row', backgroundColor: '#F2F3F6', borderRadius: 14, padding: 4, marginTop: 20, width: '100%' },
  tab: { flex: 1, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  tabText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#9AA0AA' },
  tabTextActive: { fontFamily: 'Nunito_800ExtraBold', color: '#6B4DFF' },

  googleBtn: {
    width: '100%', height: 56, borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E4EA',
    backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18,
  },
  googleG: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#4285F4' },
  socialLabel: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#2B3240' },
  appleBtn: {
    width: '100%', height: 56, borderRadius: 16, backgroundColor: '#16181F',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12,
  },
  appleLabel: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },

  separator: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: '#E6E8EC' },
  ou: { fontFamily: 'Nunito_600SemiBold', fontSize: 12.5, color: '#A6ABB4', textAlign: 'center' },

  input: {
    width: '100%', height: 56, borderRadius: 14, backgroundColor: '#F2F3F6',
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  inputText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#1B2333' },

  cguRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, width: '100%' },
  checkbox: {
    width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#C9CDD4',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  checkboxOn: { backgroundColor: '#6B4DFF', borderColor: '#6B4DFF' },
  cguText: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#7A828F', lineHeight: 19 },
  cguLink: { fontFamily: 'Nunito_800ExtraBold', color: '#6B4DFF' },

  forgot: { alignSelf: 'flex-end', marginTop: 12 },
  forgotText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#6B4DFF' },

  cta: {
    width: '100%', height: 58, borderRadius: 16, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.34, shadowRadius: 18, elevation: 8,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  switchLink: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#7A828F', marginTop: 18, textAlign: 'center' },
  switchStrong: { fontFamily: 'Nunito_800ExtraBold', color: '#6B4DFF' },
});
