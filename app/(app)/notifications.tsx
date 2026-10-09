import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import CollapsingHeader, { useCollapsingHeader } from '../../components/CollapsingHeader';
import Toggle from '../../components/Toggle';
import { useTheme } from '../../utils/useTheme';
import { useT, t } from '../../lib/i18n';
import { useUserStore } from '../../store/userStore';
import { scheduleDaily } from '../../lib/localNotifications';
import { dailyReminderMessage, reminderLangFor } from '../../constants/reminderMessages';
import {
  fetchNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '../../lib/api/notifications';

/**
 * Réglages des notifications — deux mécanismes distincts sur le même écran.
 *
 * LE RAPPEL QUOTIDIEN est une notification LOCALE : l'appareil la programme
 * lui-même à l'heure choisie (voir `lib/localNotifications.ts`). Rien ne part
 * du serveur, donc rien ne dépend du réseau, d'un token ou même d'un compte.
 * Son réglage vit dans `userStore`, pas dans `NotificationPrefs`.
 *
 * L'ALERTE DE SÉRIE reste côté serveur : elle doit prévenir quelqu'un qui
 * n'ouvre PAS l'app, ce qu'une notification locale ne sait pas faire — elle
 * aurait besoin qu'on l'ouvre pour se reprogrammer. Même chose pour les
 * relances d'inactivité et les annonces à venir.
 *
 * ⚠️ Le backend ne doit plus envoyer `notifDailyReminder` : ce rappel est
 * servi ici et nulle part ailleurs, sinon la personne le reçoit deux fois.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();

  // L'en-tête se comprime en barre fine quand on descend, pour rendre de la
  // hauteur au contenu sans perdre le titre ni le retour.
  const header = useCollapsingHeader({ expanded: 96, collapsed: 56 });

  // Rappel quotidien : local, donc disponible tout de suite et hors ligne.
  const dailyReminder = useUserStore((s) => s.dailyReminder);
  const reminderHour = useUserStore((s) => s.reminderHour);
  const setDailyReminder = useUserStore((s) => s.setDailyReminder);
  const setReminderHour = useUserStore((s) => s.setReminderHour);
  // Le message est écrit dans la langue de l'app (l'arabe reçoit l'anglais).
  const reminderLang = reminderLangFor(useUserStore((s) => s.language));

  // Alerte de série : serveur.
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoadError(false);
    fetchNotificationPrefs().then(setPrefs).catch(() => setLoadError(true));
  };
  useEffect(load, []);

  /** Patch optimiste d'une préférence serveur ; rollback s'il refuse. */
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

  /**
   * Reprogramme le rappel local.
   *
   * Le message est tiré au hasard dans la liste à chaque programmation : une
   * notification quotidienne répète sinon le même texte tous les jours.
   */
  const reschedule = useCallback((on: boolean, hour: number) => {
    void scheduleDaily('daily-reminder', on, hour, dailyReminderMessage(reminderLang));
  }, [reminderLang]);

  const toggleReminder = useCallback((on: boolean) => {
    setDailyReminder(on);
    reschedule(on, reminderHour);
  }, [setDailyReminder, reschedule, reminderHour]);

  const pickHour = useCallback((h: number) => {
    setReminderHour(h);
    if (dailyReminder) reschedule(true, h);
  }, [setReminderHour, dailyReminder, reschedule]);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <CollapsingHeader
        {...header.props}
        title={tr('notif.title')}
        onBack={() => router.back()}
      />

      <Animated.ScrollView
        {...header.scrollProps}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Réserve la place de l'en-tête, qui est posé par-dessus. */}
        <View style={{ height: header.contentInset }} />

        {/* Rappel quotidien — local : affiché tout de suite, même hors ligne. */}
        <View style={[styles.card, { backgroundColor: T.cardBg }]}>
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: '#FF4B4B' }]}>
              <Feather name="bell" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: T.text }]}>{tr('settings.dailyReminder')}</Text>
              <Text style={styles.rowSub}>{tr('settings.dailyReminderSub', { h: reminderHour })}</Text>
            </View>
            <Toggle value={dailyReminder} onChange={toggleReminder} />
          </View>
        </View>

        {/* Heure du rappel — grille des 24 heures, l'heure active en violet. */}
        <Text style={styles.sectionLabel}>{tr('notif.hourLabel')}</Text>
        <View style={[styles.timeCard, { backgroundColor: T.cardBg }]}>
          <Text style={styles.time}>{String(reminderHour).padStart(2, '0')} : 00</Text>
          <Text style={styles.timeSub}>{tr('notif.hourHint')}</Text>
          <View style={styles.hourGrid}>
            {Array.from({ length: 24 }, (_, h) => {
              const active = reminderHour === h;
              return (
                <Pressable
                  key={h}
                  style={[
                    styles.hourChip,
                    { backgroundColor: active ? '#6B4DFF' : T.pageBg },
                  ]}
                  onPress={() => pickHour(h)}
                >
                  <Text style={[styles.hourChipText, active && { color: '#fff' }]}>
                    {String(h).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Alerte de série — serveur : elle doit atteindre quelqu'un qui
            n'ouvre pas l'app, ce qu'une notification locale ne sait pas faire. */}
        <Text style={styles.sectionLabel}>{tr('notif.serverLabel')}</Text>

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
          <View style={[styles.card, { backgroundColor: T.cardBg }]}>
            <View style={styles.row}>
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
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 28 },
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
