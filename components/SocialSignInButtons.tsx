import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useT } from '../lib/i18n';
import { appleModule, isAppleSignInAvailable, isGoogleSignInAvailable, type SocialProvider } from '../lib/socialAuth';

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l8 6.2C12.5 13.7 17.8 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.9c-.6 3-2.2 5.5-4.7 7.2l7.7 6C44.4 37.9 46.9 31.8 46.9 24.5z" />
      <Path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l8-6.2z" />
      <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.2-13.4-9.9l-8 6.2C6.5 42.6 14.6 48 24 48z" />
    </Svg>
  );
}

/** Boutons Google / Apple ; n'affiche rien si aucun fournisseur n'est disponible. */
export default function SocialSignInButtons({
  disabled, isSignup, onPress,
}: {
  disabled: boolean;
  isSignup: boolean;
  onPress: (provider: SocialProvider) => void;
}) {
  const tr = useT();
  const [apple, setApple] = useState(false);
  const google = isGoogleSignInAvailable();

  useEffect(() => {
    let cancelled = false;
    void isAppleSignInAvailable().then((available) => { if (!cancelled) setApple(available); });
    return () => { cancelled = true; };
  }, []);

  if (!google && !apple) return <View style={styles.empty} />;

  const AppleAuthentication = apple ? appleModule() : null;

  return (
    <View style={styles.wrap}>
      {AppleAuthentication && (
        <View style={disabled && styles.disabled} pointerEvents={disabled ? 'none' : 'auto'}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={16}
            style={styles.button}
            onPress={() => onPress('apple')}
          />
        </View>
      )}
      {google && (
        <Pressable
          style={[styles.button, styles.google, disabled && styles.disabled]}
          disabled={disabled}
          accessibilityRole="button"
          onPress={() => onPress('google')}
        >
          <GoogleLogo />
          <Text style={styles.googleLabel}>{tr('signup.continueGoogle')}</Text>
        </Pressable>
      )}
      {/* Ces boutons créent un compte sans passer par la case à cocher du formulaire. */}
      <Text style={styles.legal}>{tr('signup.socialLegal')}</Text>
      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>{tr(isSignup ? 'signup.orSignupEmail' : 'signup.orLoginEmail')}</Text>
        <View style={styles.line} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { height: 28 },
  wrap: { width: '100%', gap: 12, marginTop: 24, marginBottom: 18 },
  button: { width: '100%', height: 54 },
  disabled: { opacity: 0.45 },
  google: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1.5, borderColor: '#D7DBE0', backgroundColor: '#fff',
  },
  googleLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1F2430' },
  legal: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 17, color: '#7A828F', textAlign: 'center' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: '#E3E6EB' },
  separatorText: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
});
