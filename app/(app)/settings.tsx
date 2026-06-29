import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Otter from '../../components/Otter';
import Toggle from '../../components/Toggle';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../utils/useTheme';

const LANGUES = {
  fr: { drapeau: '🇫🇷', nom: 'Français' },
  en: { drapeau: '🇬🇧', nom: 'Anglais' },
  ar: { drapeau: '🇸🇦', nom: 'Arabe' },
} as const;

function Row({
  iconBg, icon, title, subtitle, right, onPress, titleColor, subColor,
}: {
  iconBg: string; icon: keyof typeof Feather.glyphMap; title: string;
  subtitle?: string; right?: React.ReactNode; onPress?: () => void;
  titleColor?: string; subColor?: string;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, titleColor ? { color: titleColor } : undefined]}>{title}</Text>
        {subtitle && <Text style={[styles.rowSub, subColor ? { color: subColor } : undefined]}>{subtitle}</Text>}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [reminder, setReminder] = useState(true);
  const language = useUserStore((s) => s.language);
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const theme = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const langue = LANGUES[language];
  const T = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomColor: T.border }]}>
        <Text style={[styles.headerTitle, { color: T.text }]}>Paramètres</Text>
        <View style={styles.logoPill}>
          <Otter size={42} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: T.profileCardBg }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>MS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: T.text }]}>Medoune Seck</Text>
            <Text style={[styles.profileEmail, { color: T.textSecondary }]}>smedoune16@gmail.com</Text>
            <View style={styles.chips}>
              <View style={styles.chipOrange}>
                <Text style={{ fontSize: 14 }}>🔥</Text>
                <Text style={styles.chipOrangeText}>{streak} j</Text>
              </View>
              <View style={styles.chipPurple}>
                <Text style={styles.chipPurpleText}>+ {xp.toLocaleString('fr-FR')} XP</Text>
              </View>
            </View>
          </View>
        </View>

        {/* COMPTE */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>COMPTE</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row iconBg="#6B4DFF" icon="user" title="Modifier le profil" subtitle="Nom, photo, bio" titleColor={T.text} subColor={T.textSecondary} />
          <View style={[styles.divider, { backgroundColor: T.divider }]} />
          <Row iconBg="#8A8F99" icon="lock" title="Mot de passe & sécurité" titleColor={T.text} subColor={T.textSecondary} />
          <View style={[styles.divider, { backgroundColor: T.divider }]} />
          <Row iconBg="#E0387E" icon="mic" title="Voix & enregistrements" right={<Text style={styles.rightText}>Activé ›</Text>} titleColor={T.text} subColor={T.textSecondary} />
        </View>

        {/* NOTIFICATIONS */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#FF4B4B' }]}>
              <Feather name="bell" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: T.text }]}>Rappel quotidien</Text>
              <Text style={[styles.rowSub, { color: T.textSecondary }]}>Tous les jours à 20:30</Text>
            </View>
            <Toggle value={reminder} onChange={setReminder} />
          </View>
          <View style={[styles.divider, { backgroundColor: T.divider }]} />
          <Row
            iconBg="#6B4DFF" icon="sliders"
            title="Gérer les notifications" subtitle="Série, ligues, verset du jour…"
            titleColor={T.text} subColor={T.textSecondary}
            onPress={() => router.push('/(app)/notifications')}
          />
        </View>

        {/* ABONNEMENT */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>ABONNEMENT</Text>
        <Pressable style={styles.premiumCard} onPress={() => router.push('/(app)/subscription')}>
          <View style={styles.premiumIcon}>
            <Feather name="star" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>Passe à Tarteel Premium</Text>
            <Text style={styles.premiumSub}>Sans pub · Vies illimitées · Stats avancées</Text>
          </View>
          <Feather name="chevron-right" size={22} color="#fff" />
        </Pressable>

        {/* CONFIDENTIALITÉ */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>CONFIDENTIALITÉ</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row
            iconBg="#2A9E1C" icon="shield"
            title="Confidentialité & données" subtitle="Partage, profil, compte"
            titleColor={T.text} subColor={T.textSecondary}
            onPress={() => router.push('/(app)/privacy')}
          />
        </View>

        {/* LANGUE */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>LANGUE</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row
            iconBg="#2C9CE0" icon="globe"
            title="Langue de l'application" subtitle="Interface et menus"
            titleColor={T.text} subColor={T.textSecondary}
            right={<Text style={styles.langueValue}>{langue.drapeau}  {langue.nom} ›</Text>}
            onPress={() => router.push('/(app)/langue')}
          />
        </View>

        {/* APPARENCE */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>APPARENCE</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          {(
            [
              { value: 'light',  label: 'Clair',   icon: 'sun'     },
              { value: 'dark',   label: 'Sombre',  icon: 'moon'    },
              { value: 'system', label: 'Système', icon: 'smartphone' },
            ] as const
          ).map((opt, i, arr) => {
            const active = theme === opt.value;
            return (
              <View key={opt.value}>
                <Pressable style={styles.row} onPress={() => setTheme(opt.value)}>
                  <View style={[styles.rowIcon, { backgroundColor: active ? '#6B4DFF' : T.selectorBg }]}>
                    <Feather name={opt.icon} size={20} color={active ? '#fff' : T.textTertiary} />
                  </View>
                  <Text style={[styles.rowTitle, { color: T.text }]}>{opt.label}</Text>
                  {active && <Feather name="check" size={20} color="#6B4DFF" />}
                </Pressable>
                {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: T.divider }]} />}
              </View>
            );
          })}
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
  langueValue: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#6B4DFF' },
  themeSwatches: { flexDirection: 'row', gap: 6 },
  swatch: { width: 26, height: 26, borderRadius: 7 },
  premiumCard: {
    backgroundColor: '#F0820C', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderBottomWidth: 4, borderBottomColor: '#C56400',
    shadowColor: '#F0820C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4,
  },
  premiumIcon: {
    width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  premiumTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#fff' },
  premiumSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
});
