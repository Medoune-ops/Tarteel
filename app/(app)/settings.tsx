import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Otter from '../../components/Otter';
import Toggle from '../../components/Toggle';

function Row({
  iconBg, icon, title, subtitle, right, onPress,
}: {
  iconBg: string; icon: keyof typeof Feather.glyphMap; title: string;
  subtitle?: string; right?: React.ReactNode; onPress?: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [reminder, setReminder] = useState(true);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.logoPill}>
          <Otter size={42} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>MS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Medoune Seck</Text>
            <Text style={styles.profileEmail}>smedoune16@gmail.com</Text>
            <View style={styles.chips}>
              <View style={styles.chipOrange}>
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={styles.chipOrangeText}>12 j</Text>
              </View>
              <View style={styles.chipPurple}>
                <Text style={styles.chipPurpleText}>+ 1250 XP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* COMPTE */}
        <Text style={styles.sectionLabel}>COMPTE</Text>
        <View style={styles.card}>
          <Row iconBg="#6B4DFF" icon="user" title="Modifier le profil" subtitle="Nom, photo, bio" />
          <View style={styles.divider} />
          <Row iconBg="#8A8F99" icon="lock" title="Mot de passe & sécurité" />
          <View style={styles.divider} />
          <Row iconBg="#E0387E" icon="mic" title="Voix & enregistrements" right={<Text style={styles.rightText}>Activé ›</Text>} />
        </View>

        {/* Rappel quotidien */}
        <Pressable style={[styles.card, styles.singleRow]} onPress={() => router.push('/(app)/notifications')}>
          <View style={[styles.rowIcon, { backgroundColor: '#FF4B4B' }]}>
            <Feather name="bell" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Rappel quotidien</Text>
            <Text style={styles.rowSub}>Tous les jours à 20:30</Text>
          </View>
          <Toggle value={reminder} onChange={setReminder} />
        </Pressable>

        {/* APPARENCE */}
        <Text style={styles.sectionLabel}>APPARENCE</Text>
        <View style={[styles.card, styles.singleRow]}>
          <View style={[styles.rowIcon, { backgroundColor: '#6B4DFF' }]}>
            <Feather name="droplet" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Thème</Text>
            <Text style={styles.rowSub}>Adapté à votre système</Text>
          </View>
          <View style={styles.themeSwatches}>
            <View style={[styles.swatch, { backgroundColor: '#FBF8EE', borderWidth: 2, borderColor: '#6B4DFF' }]} />
            <View style={[styles.swatch, { backgroundColor: '#A8AEB8' }]} />
          </View>
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDF2' },
  header: {
    backgroundColor: '#fff', paddingTop: 50, paddingBottom: 18, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#1B2333' },
  logoPill: {
    width: 56, height: 46, borderRadius: 21, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  content: { paddingHorizontal: 22, paddingVertical: 18 },
  profileCard: {
    backgroundColor: '#E8E2FB', borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  profileAvatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center',
  },
  profileInitials: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff' },
  profileName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 20, color: '#1B2333' },
  profileEmail: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chipOrange: {
    backgroundColor: '#FBEAC9', flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20,
  },
  chipOrangeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#C57A0C' },
  chipPurple: { backgroundColor: '#D9CFFB', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  chipPurpleText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#6B4DFF' },
  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 22, marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  singleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#1B2333' },
  rowSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
  divider: { height: 1, backgroundColor: '#F0F1F4' },
  chevron: { fontSize: 20, color: '#C2C6CE' },
  rightText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#8A8F99' },
  themeSwatches: { flexDirection: 'row', gap: 6 },
  swatch: { width: 26, height: 26, borderRadius: 7 },
});
