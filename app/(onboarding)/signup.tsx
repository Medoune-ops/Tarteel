import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome } from '@expo/vector-icons';
import Otter from '../../components/Otter';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <LinearGradient colors={['#8467FF', '#6B4DFF']} style={styles.headerGrad} />

      {/* Avatar — hors du ScrollView pour ne pas être rogné par la carte */}
      <View style={styles.avatar}>
        <View style={styles.avatarClip}>
          <Otter size={74} />
        </View>
      </View>

      <ScrollView
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appName}>Tarteel</Text>
        <Text style={styles.welcome}>Bienvenue</Text>
        <Text style={styles.sub}>Crée ton compte gratuitement</Text>

        {/* Google */}
        <Pressable style={styles.googleBtn}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.socialLabel}>Continuer avec Google</Text>
        </Pressable>

        {/* Apple */}
        <Pressable style={styles.appleBtn}>
          <FontAwesome name="apple" size={22} color="#fff" />
          <Text style={styles.appleLabel}>Continuer avec Apple</Text>
        </Pressable>

        {/* Separator */}
        <View style={styles.separator}>
          <View style={styles.line} />
          <Text style={styles.ou}>ou</Text>
          <View style={styles.line} />
        </View>

        {/* Inputs */}
        <View style={styles.input}>
          <Text style={styles.inputPlaceholder}>Email</Text>
        </View>
        <View style={[styles.input, { marginTop: 12 }]}>
          <Text style={styles.inputPlaceholder}>Mot de passe</Text>
        </View>

        {/* CTA */}
        <Pressable
          style={styles.cta}
          onPress={() => router.replace('/(setup)/niveau')}
        >
          <Text style={styles.ctaLabel}>Créer mon compte</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(setup)/niveau')}>
          <Text style={styles.loginLink}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  headerGrad: { height: 230 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -34,
  },
  cardContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
    paddingBottom: 30,
  },
  avatar: {
    position: 'absolute',
    top: 148,
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#6B4DFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#6B4DFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 10,
  },
  avatarClip: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333', marginTop: 14 },
  welcome: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 28, color: '#1B2333' },
  sub: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: '#8A8F99', marginTop: 6 },
  googleBtn: {
    width: '100%', height: 58, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#E2E4EA',
    backgroundColor: '#fff', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 22,
  },
  googleG: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#4285F4' },
  socialLabel: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#2B3240' },
  appleBtn: {
    width: '100%', height: 58, borderRadius: 16,
    backgroundColor: '#16181F', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12,
  },
  appleLabel: { fontFamily: 'Nunito_700Bold', fontSize: 17, color: '#fff' },
  separator: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: '#E6E8EC' },
  ou: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#A6ABB4' },
  input: {
    width: '100%', height: 56, borderRadius: 14,
    backgroundColor: '#F2F3F6',
    paddingHorizontal: 18, justifyContent: 'center',
  },
  inputPlaceholder: { fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: '#9AA0AA' },
  cta: {
    width: '100%', height: 58, borderRadius: 16,
    backgroundColor: '#6B4DFF', alignItems: 'center',
    justifyContent: 'center', marginTop: 16,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34, shadowRadius: 18, elevation: 8,
  },
  ctaLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  loginLink: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: '#6B4DFF', marginTop: 18 },
});
