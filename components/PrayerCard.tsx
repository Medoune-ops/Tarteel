/**
 * Carte « prochaine prière » du profil — porte d'entrée vers l'écran complet.
 *
 * Une ligne compacte (icône, nom de la prière, heure et compte à rebours),
 * dans le style des autres cartes du profil.
 *
 * Le calcul est local (`constants/prayerTimes.ts`) : la carte s'affiche donc
 * hors-ligne dès que la position est connue.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePrayerStore } from '../store/prayerStore';
import {
  computePrayerTimes,
  nextPrayer,
  formatPrayerTime,
  timeUntil,
} from '../constants/prayerTimes';
import { useT } from '../lib/i18n';
import { useTheme } from '../utils/useTheme';

interface Props {
  onPress: () => void;
  localeTag?: string;
}

const GREEN = '#1F9A6E';

export default function PrayerCard({ onPress, localeTag = 'fr-FR' }: Props) {
  const tr = useT();
  const T = useTheme();
  const latitude = usePrayerStore((s) => s.latitude);
  const longitude = usePrayerStore((s) => s.longitude);

  // Re-rendu chaque minute : le compte à rebours doit descendre tout seul.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    const slots = computePrayerTimes(latitude, longitude, now);
    const next = nextPrayer(slots, now);
    // Après l'Isha, la prochaine est le Fajr de demain — sinon la carte
    // afficherait une heure déjà passée toute la soirée.
    if (next) return next;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return computePrayerTimes(latitude, longitude, tomorrow)[0] ?? null;
  }, [latitude, longitude, now]);

  const located = latitude != null && longitude != null;
  const remaining = upcoming ? timeUntil(upcoming.time, now) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: T.cardBg, borderColor: T.border },
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
    >
      <View style={[styles.iconWrap, { backgroundColor: T.isDark ? 'rgba(31,154,110,0.18)' : '#E3F4EC' }]}>
        <Feather name="moon" size={18} color={GREEN} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: T.textSecondary }]}>
          {tr(located ? 'prayer.nextPrayer' : 'prayer.cardTitle')}
        </Text>
        {located ? (
          upcoming && <Text style={[styles.prayerName, { color: T.text }]}>{tr(`prayer.name.${upcoming.name}`)}</Text>
        ) : (
          <Text style={[styles.prayerName, { color: T.text }]} numberOfLines={1}>{tr('prayer.setupHint')}</Text>
        )}
      </View>

      {located ? (
        <View style={styles.timeCol}>
          {upcoming && <Text style={styles.time}>{formatPrayerTime(upcoming.time, localeTag)}</Text>}
          {remaining && (
            <Text style={[styles.remaining, { color: T.textSecondary }]}>
              {remaining.hours > 0
                ? tr('prayer.inHoursMinutes', { h: remaining.hours, m: remaining.minutes })
                : tr('prayer.inMinutes', { m: remaining.minutes })}
            </Text>
          )}
        </View>
      ) : (
        <Feather name="chevron-right" size={18} color={T.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5 },
  prayerName: { fontFamily: 'Nunito_900Black', fontSize: 15, lineHeight: 19 },
  timeCol: { alignItems: 'flex-end' },
  time: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24, color: GREEN },
  remaining: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5 },
});
