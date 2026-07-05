import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toggle from '../../components/Toggle';
import { useTheme } from '../../utils/useTheme';
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
