import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toggle from '../../components/Toggle';

const TOGGLES = [
  { id: 'usage',   iconBg: '#6B4DFF', icon: 'bar-chart-2' as const, title: "Partage des données d'usage", sub: 'Aide à améliorer Tarteel',          default: true  },
  { id: 'profil',  iconBg: '#2A9E1C', icon: 'eye' as const,         title: 'Profil public',                sub: 'Visible par les autres apprenants', default: true  },
  { id: 'ligues',  iconBg: '#E0A02C', icon: 'award' as const,       title: 'Visibilité dans les ligues',   sub: 'Afficher mon nom au classement',   default: true  },
  { id: 'voix',    iconBg: '#E0387E', icon: 'mic' as const,         title: 'Enregistrements vocaux',       sub: 'Conserver mes récitations',        default: false },
];

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
  const [states, setStates] = useState<Record<string, boolean>>(
    Object.fromEntries(TOGGLES.map((t) => [t.id, t.default]))
  );

  const supprimerCompte = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes tes données et ta progression seront définitivement effacées.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Toggles de données */}
        <Text style={styles.sectionLabel}>MES DONNÉES</Text>
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
        <Text style={styles.sectionLabel}>MON COMPTE</Text>
        <View style={styles.card}>
          <Row iconBg="#FF4B4B" icon="trash-2" title="Supprimer mon compte" subtitle="Effacer définitivement mes données" onPress={supprimerCompte} danger />
        </View>

        {/* Liens légaux */}
        <Text style={styles.sectionLabel}>DOCUMENTS LÉGAUX</Text>
        <View style={styles.card}>
          <Row iconBg="#8A8F99" icon="file-text" title="Politique de confidentialité" onPress={() => Linking.openURL('https://tarteel.app/privacy')} />
          <View style={styles.divider} />
          <Row iconBg="#8A8F99" icon="file" title="Conditions d'utilisation" onPress={() => Linking.openURL('https://tarteel.app/terms')} />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
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
