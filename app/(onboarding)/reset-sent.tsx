import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function ResetSentScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  return (
    <LinearGradient colors={['#1A0F3A', '#2D1A6E', '#6B4DFF']} style={styles.screen}>
      {/* Icône enveloppe + check */}
      <View style={styles.iconWrap}>
        <View style={styles.iconCircle}>
          <Feather name="mail" size={48} color="#fff" />
        </View>
        <View style={styles.checkBadge}>
          <Feather name="check" size={14} color="#fff" />
        </View>
      </View>

      <Text style={styles.title}>Email envoyé !</Text>
      <Text style={styles.sub}>
        On a envoyé un lien à{'\n'}
        <Text style={styles.emailHighlight}>{email ?? 'ton adresse email'}</Text>
      </Text>

      {/* Card info */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Feather name="clock" size={17} color="#fff" />
          </View>
          <Text style={styles.infoText}>
            Le lien expire dans <Text style={styles.infoBold}>30 minutes</Text>
          </Text>
        </View>
        <View style={[styles.infoRow, { marginBottom: 0 }]}>
          <View style={styles.infoIcon}>
            <Feather name="alert-circle" size={17} color="#fff" />
          </View>
          <Text style={styles.infoText}>
            Vérifie aussi ton dossier <Text style={styles.infoBold}>Spams</Text>
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable style={styles.resend} onPress={() => router.back()}>
        <Text style={styles.resendText}>Renvoyer l'email</Text>
      </Pressable>

      <Pressable onPress={() => router.replace('/(onboarding)/signup')} style={styles.backLink}>
        <Text style={styles.backLinkText}>Retour à la connexion</Text>
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 110, paddingBottom: 38 },

  iconWrap: { position: 'relative', marginBottom: 28 },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#34C724', borderWidth: 3, borderColor: '#4A2DB0',
    alignItems: 'center', justifyContent: 'center',
  },

  title: {
    fontFamily: 'Baloo2_800ExtraBold', fontSize: 34, color: '#fff',
    textAlign: 'center', marginBottom: 12,
  },
  sub: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: 'rgba(255,255,255,0.8)',
    textAlign: 'center', lineHeight: 24, marginBottom: 28,
  },
  emailHighlight: { fontFamily: 'Nunito_800ExtraBold', color: '#fff' },

  infoCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18, padding: 18,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoText: {
    fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#fff', flex: 1, lineHeight: 20,
  },
  infoBold: { fontFamily: 'Nunito_900Black', color: '#fff' },

  resend: {
    width: '100%', height: 56, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  resendText: { fontFamily: 'Nunito_700Bold', fontSize: 16, color: '#fff' },
  backLink: { paddingVertical: 8 },
  backLinkText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: 'rgba(255,255,255,0.65)' },
});
