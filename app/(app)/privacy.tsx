import { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, Linking, Alert,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toggle from '../../components/Toggle';
import { deleteAccount } from '../../lib/api/me';
import { ApiError } from '../../lib/api/client';
import { t as tr } from '../../lib/i18n';

function useToggles() {
  return [
    { id: 'usage',   iconBg: '#6B4DFF', icon: 'bar-chart-2' as const, title: tr('privacy.toggleUsageTitle'), sub: tr('privacy.toggleUsageSub'),      default: true  },
    { id: 'profil',  iconBg: '#2A9E1C', icon: 'eye' as const,         title: tr('privacy.toggleProfileTitle'), sub: tr('privacy.toggleProfileSub'), default: true  },
    { id: 'ligues',  iconBg: '#E0A02C', icon: 'award' as const,       title: tr('privacy.toggleLeaguesTitle'), sub: tr('privacy.toggleLeaguesSub'), default: true  },
    { id: 'voix',    iconBg: '#E0387E', icon: 'mic' as const,         title: tr('privacy.toggleVoiceTitle'), sub: tr('privacy.toggleVoiceSub'),      default: false },
  ];
}

function Row({ iconBg, icon, title, subtitle, onPress, danger }: {
  iconBg: string; icon: keyof typeof Feather.glyphMap; title: string;
  subtitle?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, danger && { color: '#FF4B4B' }]}>{title}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      <Feather name="chevron-right" size={20} color="#C2C6CE" />
    </Pressable>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();
  const TOGGLES = useToggles();
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.id, t.default]))
  );

  // Suppression RÉELLE : DELETE /me (cascade serveur), puis purge locale et
  // retour à l'inscription. Le serveur exige le mot de passe (un token volé
  // ne suffit pas) → confirmation, puis saisie du mot de passe dans un modal
  // (Alert.prompt n'existe que sur iOS).
  const [askPassword, setAskPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const supprimerCompte = () => {
    Alert.alert(tr('account.deleteTitle'), tr('account.deleteConfirm'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('account.deleteAction'),
        style: 'destructive',
        onPress: () => { setPassword(''); setAskPassword(true); },
      },
    ]);
  };

  const confirmerSuppression = async () => {
    if (deleting || !password) return;
    setDeleting(true);
    try {
      await deleteAccount(password);
      setAskPassword(false);
      router.replace('/(onboarding)/signup');
    } catch (e) {
      const wrongPass = e instanceof ApiError && e.status === 401;
      Alert.alert(wrongPass ? tr('account.wrongPassword') : tr('account.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('privacy.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Toggles de données */}
        <Text style={styles.sectionLabel}>{tr('privacy.sectionData')}</Text>
        <View style={styles.card}>
          {TOGGLES.map((t, i) => (
            <View key={t.id} style={[styles.row, i > 0 && styles.divider]}>
              <View style={[styles.rowIcon, { backgroundColor: t.iconBg }]}>
                <Feather name={t.icon} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{t.title}</Text>
                <Text style={styles.rowSub}>{t.sub}</Text>
              </View>
              <Toggle
                value={states[t.id]}
                onChange={(v) => setStates((s) => ({ ...s, [t.id]: v }))}
              />
            </View>
          ))}
        </View>

        {/* Actions sur le compte */}
        <Text style={styles.sectionLabel}>{tr('privacy.sectionAccount')}</Text>
        <View style={styles.card}>
          <Row iconBg="#FF4B4B" icon="trash-2" title={tr('privacy.deleteAccountTitle')} subtitle={tr('privacy.deleteAccountSub')} onPress={supprimerCompte} danger />
        </View>

        {/* Liens légaux */}
        <Text style={styles.sectionLabel}>{tr('privacy.sectionLegal')}</Text>
        <View style={styles.card}>
          <Row iconBg="#8A8F99" icon="file-text" title={tr('privacy.privacyPolicy')} onPress={() => Linking.openURL('https://tarteel.app/privacy')} />
          <View style={styles.divider} />
          <Row iconBg="#8A8F99" icon="file" title={tr('privacy.termsOfUse')} onPress={() => Linking.openURL('https://tarteel.app/terms')} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Confirmation par mot de passe avant la suppression définitive. */}
      <Modal visible={askPassword} transparent animationType="fade" onRequestClose={() => setAskPassword(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{tr('account.passwordPrompt')}</Text>
            <TextInput
              style={styles.modalInput}
              value={password}
              onChangeText={setPassword}
              placeholder={tr('account.passwordPlaceholder')}
              placeholderTextColor="#9AA0AA"
              secureTextEntry
              autoFocus
              autoCapitalize="none"
            />
            <View style={styles.modalBtns}>
              <Pressable style={styles.modalCancel} onPress={() => setAskPassword(false)} disabled={deleting}>
                <Text style={styles.modalCancelText}>{tr('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.modalDelete, (!password || deleting) && { opacity: 0.5 }]}
                onPress={confirmerSuppression}
                disabled={!password || deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalDeleteText}>{tr('account.deleteAction')}</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%', maxWidth: 420, backgroundColor: '#fff',
    borderRadius: 20, padding: 22,
  },
  modalTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#1B2333', marginBottom: 14 },
  modalInput: {
    borderWidth: 1.5, borderColor: '#E3E5EA', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: 'Nunito_600SemiBold', fontSize: 16, color: '#1B2333',
  },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },
  modalCancel: {
    flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F0F1F4',
  },
  modalCancelText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#5A6270' },
  modalDelete: {
    flex: 1.4, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF4B4B',
  },
  modalDeleteText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  back: { fontSize: 34, color: '#1B2333', lineHeight: 34 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#1B2333' },
  content: { paddingHorizontal: 22, paddingVertical: 18 },
  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 20, marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#1B2333' },
  rowSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', marginTop: 2 },
  divider: { borderTopWidth: 1, borderTopColor: '#F0F1F4' },
});
