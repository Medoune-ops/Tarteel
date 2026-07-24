import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Otter from '../../components/Otter';
import Toggle from '../../components/Toggle';
import { useUserStore } from '../../store/userStore';
import { useTheme } from '../../utils/useTheme';
import { logout, updateSettings } from '../../lib/api';
import { fetchNotificationPrefs, updateNotificationPrefs } from '../../lib/api/notifications';
import { useT } from '../../lib/i18n';

const LANGUES = {
  fr: { drapeau: '🇫🇷', nomKey: 'langue.fr' },
  en: { drapeau: '🇬🇧', nomKey: 'langue.en' },
} as const;

/** Initiales à partir du nom (fallback avatar). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  // Rappel quotidien : préférence RÉELLE (serveur), chargée à l'ouverture.
  const [reminder, setReminder] = useState(true);
  const [reminderHour, setReminderHour] = useState(19);
  useEffect(() => {
    fetchNotificationPrefs()
      .then((p) => {
        setReminder(p.notifDailyReminder);
        setReminderHour(p.reminderHour);
      })
      .catch(() => { /* hors-ligne : valeurs par défaut, resync au prochain passage */ });
  }, []);
  const toggleReminder = (v: boolean) => {
    setReminder(v);
    updateNotificationPrefs({ notifDailyReminder: v }).catch(() => setReminder(!v));
  };

  // Voix : état hydraté depuis /me (store), optimistic + persistance serveur.
  const voiceEnabled = useUserStore((s) => s.voiceEnabled);
  const toggleVoice = (v: boolean) => {
    useUserStore.setState({ voiceEnabled: v });
    updateSettings({ voiceEnabled: v }).catch(() =>
      useUserStore.setState({ voiceEnabled: !v }),
    );
  };
  const language = useUserStore((s) => s.language);
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const name = useUserStore((s) => s.name);
  const email = useUserStore((s) => s.email);
  const theme = useUserStore((s) => s.theme);
  const setTheme = useUserStore((s) => s.setTheme);
  const isPremium = useUserStore((s) => s.isPremium);
  const langue = LANGUES[language as 'fr' | 'en'] ?? LANGUES.fr;
  const T = useTheme();
  const tr = useT();

  const confirmLogout = () => {
    Alert.alert(tr('settings.logout'), tr('settings.logoutConfirm'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('settings.logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(onboarding)/signup');
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: T.headerBg, borderBottomColor: T.border }]}>
        <Text style={[styles.headerTitle, { color: T.text }]}>{tr('settings.title')}</Text>
        <View style={styles.logoPill}>
          <Otter size={42} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: T.profileCardBg }]}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: T.text }]}>{name || tr('settings.profileFallback')}</Text>
            <Text style={[styles.profileEmail, { color: T.textSecondary }]}>{email || '—'}</Text>
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
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionAccount')}</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row iconBg="#6B4DFF" icon="user" title={tr('settings.editProfile')} subtitle={tr('settings.editProfileSub')} titleColor={T.text} subColor={T.textSecondary} onPress={() => router.push('/(app)/edit-profile')} />
          <View style={[styles.divider, { backgroundColor: T.divider }]} />
          <Row iconBg="#8A8F99" icon="lock" title={tr('settings.password')} titleColor={T.text} subColor={T.textSecondary} onPress={() => router.push('/(app)/change-password')} />
          <View style={[styles.divider, { backgroundColor: T.divider }]} />
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#E0387E' }]}>
              <Feather name="mic" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: T.text }]}>{tr('settings.voice')}</Text>
              <Text style={[styles.rowSub, { color: T.textSecondary }]}>
                {voiceEnabled ? tr('settings.on') : tr('settings.off')}
              </Text>
            </View>
            <Toggle value={voiceEnabled} onChange={toggleVoice} />
          </View>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionNotifs')}</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#FF4B4B' }]}>
              <Feather name="bell" size={22} color="#fff" />
            </View>
            {/* La zone texte ouvre l'écran Notifications (choix de l'heure). */}
            <Pressable style={{ flex: 1 }} onPress={() => router.push('/(app)/notifications')}>
              <Text style={[styles.rowTitle, { color: T.text }]}>{tr('settings.dailyReminder')}</Text>
              <Text style={[styles.rowSub, { color: T.textSecondary }]}>
                {tr('settings.dailyReminderSub', { h: reminderHour })}
              </Text>
            </Pressable>
            <Toggle value={reminder} onChange={toggleReminder} />
          </View>
          <View style={[styles.divider, { backgroundColor: T.divider }]} />
          <Row
            iconBg="#6B4DFF" icon="sliders"
            title={tr('settings.manageNotifs')} subtitle={tr('settings.manageNotifsSub')}
            titleColor={T.text} subColor={T.textSecondary}
            onPress={() => router.push('/(app)/notifications')}
          />
        </View>

        {/* ABONNEMENT */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionSubscription')}</Text>
        <Pressable style={styles.premiumCard} onPress={() => router.push('/(app)/subscription')}>
          <View style={styles.premiumIcon}>
            <Feather name={isPremium ? 'check-circle' : 'star'} size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>
              {isPremium ? tr('settings.premiumActiveTitle') : tr('settings.premiumTitle')}
            </Text>
            <Text style={styles.premiumSub}>
              {isPremium ? tr('settings.premiumActiveSub') : tr('settings.premiumSub')}
            </Text>
          </View>
          <Feather name="chevron-right" size={22} color="#fff" />
        </Pressable>

        {/* CONFIDENTIALITÉ */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionPrivacy')}</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row
            iconBg="#2A9E1C" icon="shield"
            title={tr('settings.privacy')} subtitle={tr('settings.privacySub')}
            titleColor={T.text} subColor={T.textSecondary}
            onPress={() => router.push('/(app)/privacy')}
          />
        </View>

        {/* AIDE / SUPPORT */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionSupport')}</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row
            iconBg="#F0820C" icon="help-circle"
            title={tr('settings.support')} subtitle={tr('settings.supportSub')}
            titleColor={T.text} subColor={T.textSecondary}
            onPress={() => router.push('/(app)/support')}
          />
        </View>

        {/* LANGUE */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionLanguage')}</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <Row
            iconBg="#2C9CE0" icon="globe"
            title={tr('settings.language')} subtitle={tr('settings.languageSub')}
            titleColor={T.text} subColor={T.textSecondary}
            right={<Text style={styles.langueValue}>{langue.drapeau}  {tr(langue.nomKey)} ›</Text>}
            onPress={() => router.push('/(app)/langue')}
          />
        </View>

        {/* APPARENCE */}
        <Text style={[styles.sectionLabel, { color: T.sectionLabel }]}>{tr('settings.sectionAppearance')}</Text>
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          {(
            [
              { value: 'light',  label: tr('settings.themeLight'),  icon: 'sun'     },
              { value: 'dark',   label: tr('settings.themeDark'),   icon: 'moon'    },
              { value: 'system', label: tr('settings.themeSystem'), icon: 'smartphone' },
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

        {/* DÉCONNEXION */}
        <Pressable style={[styles.logoutBtn, { backgroundColor: T.cardBg }]} onPress={confirmLogout}>
          <Feather name="log-out" size={20} color="#E5484D" />
          <Text style={styles.logoutText}>{tr('settings.logout')}</Text>
        </Pressable>

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
  logoutBtn: {
    marginTop: 20, height: 56, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  logoutText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, color: '#E5484D' },
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
