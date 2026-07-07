import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toggle from '../../components/Toggle';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { fetchNotificationPrefs, updateNotificationPrefs } from '../../lib/api';

const ITEMS = [
  { id: 'reminder', iconBg: '#FF4B4B', icon: 'bell' as const, title: 'Rappel quotidien', default: true },
  { id: 'streak', iconBg: '#F0820C', icon: null as unknown as 'zap', title: 'Alerte de série', sub: 'Avant de perdre ton streak', default: true },
  { id: 'ligues', iconBg: '#E07A0C', icon: 'award' as const, title: 'Mises à jour des ligues', sub: 'Changements de classement', default: false },
  { id: 'verset', iconBg: '#6B4DFF', icon: 'book-open' as const, title: 'Verset du jour', sub: 'Chaque matin à 07:00', default: true },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Formate une heure (0–23) en "HH : 00", cohérent avec la granularité horaire du backend. */
function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')} : 00`;
}

import { useT, t } from '../../lib/i18n';
import {
  fetchNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '../../lib/api/notifications';

/**
 * Préférences RÉELLES, persistées côté serveur (elles pilotent les push Expo
 * envoyés par le backend). Chaque changement est optimiste puis PATCHé ;
 * en cas d'échec on revient à la valeur précédente.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    fetchNotificationPrefs().then(setPrefs).catch(() => setLoadError(true));
  };
  useEffect(load, []);

  /** Patch optimiste d'une préférence ; rollback si le serveur refuse. */
  const patch = (change: Partial<NotificationPrefs>) => {
    if (!prefs) return;
    const before = prefs;
    setPrefs({ ...prefs, ...change });
    updateNotificationPrefs(change)
      .then(setPrefs)
      .catch(() => {
        setPrefs(before);
        Alert.alert(t('notif.saveError'));
      });
  };

  const reminderHour = useUserStore((s) => s.reminderHour);
  const setReminderHour = useUserStore((s) => s.setReminderHour);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Au chargement : resynchronise avec le serveur (source de vérité), au cas où
  // l'heure aurait été changée depuis un autre appareil. Best-effort — hors
  // ligne, on garde la valeur locale persistée par le store.
  useEffect(() => {
    fetchNotificationPrefs()
      .then((prefs) => setReminderHour(prefs.reminderHour))
      .catch(() => {});
  }, [setReminderHour]);

  // Choix d'une heure : optimistic local (persisté par le store, restauré au
  // redémarrage) + persistance serveur. Le job de rappel (backend, horaire)
  // relit `reminderHour` à chaque passage, donc la nouvelle heure est prise en
  // compte automatiquement, sans reprogrammation manuelle.
  const chooseHour = (hour: number) => {
    const previous = reminderHour;
    setReminderHour(hour);
    setPickerOpen(false);
    updateNotificationPrefs({ reminderHour: hour }).catch(() => setReminderHour(previous));
  };

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: T.cardBg }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: T.text }]}>{tr('notif.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {prefs == null && !loadError && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#6B4DFF" />
          </View>
        )}

        {loadError && (
          <View style={styles.centerState}>
            <Feather name="wifi-off" size={32} color={T.textSecondary} />
            <Pressable style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryLabel}>{tr('common.retry')}</Text>
            </Pressable>
          </View>
        )}

        {prefs != null && (
          <>
            <View style={[styles.card, { backgroundColor: T.cardBg }]}>
              {/* Rappel quotidien */}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: '#FF4B4B' }]}>
                  <Feather name="bell" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: T.text }]}>{tr('settings.dailyReminder')}</Text>
                  <Text style={styles.rowSub}>{tr('settings.dailyReminderSub', { h: prefs.reminderHour })}</Text>
                </View>
                <Toggle
                  value={prefs.notifDailyReminder}
                  onChange={(v) => patch({ notifDailyReminder: v })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: T.text }]}>{item.title}</Text>
                <Text style={styles.rowSub}>
                  {item.id === 'reminder' ? `Tous les jours à ${formatHour(reminderHour)}` : item.sub}
                </Text>

              {/* Alerte de série */}
              <View style={[styles.row, styles.divider, { borderTopColor: T.divider }]}>
                <View style={[styles.rowIcon, { backgroundColor: '#F0820C' }]}>
                  <Text style={{ fontSize: 22 }}>🔥</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: T.text }]}>{tr('notif.streakAlert')}</Text>
                  <Text style={styles.rowSub}>{tr('notif.streakAlertSub')}</Text>
                </View>
                <Toggle
                  value={prefs.notifStreakAlert}
                  onChange={(v) => patch({ notifStreakAlert: v })}
                />
              </View>
            </View>

        <Text style={styles.sectionLabel}>HEURE DU RAPPEL</Text>
        <Pressable
          style={[styles.timeCard, { backgroundColor: T.cardBg }]}
          onPress={() => setPickerOpen((v) => !v)}
        >
          <Text style={styles.time}>{formatHour(reminderHour)}</Text>
          <Text style={styles.timeSub}>
            {pickerOpen ? 'Choisis une heure ci-dessous' : "Touche pour modifier l'heure"}
          </Text>
        </Pressable>

        {pickerOpen && (
          <View style={[styles.hoursCard, { backgroundColor: T.cardBg }]}>
            <View style={styles.hoursGrid}>
              {HOURS.map((h) => {
                const active = h === reminderHour;
                return (
                  <Pressable
                    key={h}
                    style={[styles.hourChip, { backgroundColor: T.selectorBg }, active && styles.hourChipActive]}
                    onPress={() => chooseHour(h)}
                  >
                    <Text style={[styles.hourChipText, { color: T.textSecondary }, active && styles.hourChipTextActive]}>
                      {String(h).padStart(2, '0')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
            {/* Heure du rappel — grille des 24 heures, l'heure active en violet. */}
            <Text style={styles.sectionLabel}>{tr('notif.hourLabel')}</Text>
            <View style={[styles.timeCard, { backgroundColor: T.cardBg }]}>
              <Text style={styles.time}>{String(prefs.reminderHour).padStart(2, '0')} : 00</Text>
              <Text style={styles.timeSub}>{tr('notif.hourHint')}</Text>
              <View style={styles.hourGrid}>
                {Array.from({ length: 24 }, (_, h) => {
                  const active = prefs.reminderHour === h;
                  return (
                    <Pressable
                      key={h}
                      style={[
                        styles.hourChip,
                        { backgroundColor: active ? '#6B4DFF' : T.pageBg },
                      ]}
                      onPress={() => patch({ reminderHour: h })}
                    >
                      <Text style={[styles.hourChipText, active && { color: '#fff' }]}>
                        {String(h).padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 50, paddingBottom: 18, paddingHorizontal: 24,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  back: { fontSize: 30, color: '#6B4DFF', lineHeight: 32 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26 },
  content: { paddingHorizontal: 22, paddingVertical: 18 },
  centerState: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  retryBtn: { backgroundColor: '#6B4DFF', borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10 },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  card: {
    borderRadius: 18, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  divider: { borderTopWidth: 1 },
  rowIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  rowSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
  sectionLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.6, color: '#9AA0AA', marginTop: 22, marginBottom: 10 },
  timeCard: {
    borderRadius: 18, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  time: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 46, color: '#6B4DFF' },
  timeSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', marginTop: 6 },
  hoursCard: {
    borderRadius: 18, padding: 16, marginTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 14, elevation: 2,
  },
  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  hourChip: { width: 52, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hourChipActive: { backgroundColor: '#6B4DFF' },
  hourChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  hourChipTextActive: { color: '#fff' },
  hourGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    justifyContent: 'center', marginTop: 18,
  },
  hourChip: {
    width: 44, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  hourChipText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#5A6270' },
});
