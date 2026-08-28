/**
 * Carte « prochaine prière » du profil — porte d'entrée vers l'écran complet.
 *
 * Remplace l'ancienne barre de progression de niveau : une information utile
 * plusieurs fois par jour, plutôt qu'un compteur d'XP déjà visible juste
 * au-dessus dans le bandeau de statistiques.
 *
 * Le calcul est local (`constants/prayerTimes.ts`) : la carte s'affiche donc
 * hors-ligne dès que la position est connue.
 */
import { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePrayerStore } from '../store/prayerStore';
import {
  computePrayerTimes,
  nextPrayer,
  formatPrayerTime,
  timeUntil,
} from '../constants/prayerTimes';
import { useT } from '../lib/i18n';

interface Props {
  onPress: () => void;
  localeTag?: string;
}

export default function PrayerCard({ onPress, localeTag = 'fr-FR' }: Props) {
  const tr = useT();
  const latitude = usePrayerStore((s) => s.latitude);
  const longitude = usePrayerStore((s) => s.longitude);
  const cityName = usePrayerStore((s) => s.cityName);
  const method = usePrayerStore((s) => s.method);

  // Re-rendu chaque minute : le compte à rebours doit descendre tout seul.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    const slots = computePrayerTimes(latitude, longitude, method, now);
    const next = nextPrayer(slots, now);
    // Après l'Isha, la prochaine est le Fajr de demain — sinon la carte
    // afficherait une heure déjà passée toute la soirée.
    if (next) return next;
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return computePrayerTimes(latitude, longitude, method, tomorrow)[0] ?? null;
  }, [latitude, longitude, method, now]);

  // Position inconnue : la carte invite à la définir plutôt que de rester vide.
  if (latitude == null || longitude == null) {
    return (
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={['#1F8A70', '#26A17B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>🕌</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{tr('prayer.cardTitle')}</Text>
              <Text style={styles.setupHint}>{tr('prayer.setupHint')}</Text>
            </View>
            <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  const remaining = upcoming ? timeUntil(upcoming.time, now) : null;

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={['#1F8A70', '#26A17B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🕌</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{tr('prayer.nextPrayer')}</Text>
            {upcoming && (
              <Text style={styles.prayerName}>{tr(`prayer.name.${upcoming.name}`)}</Text>
            )}
            {cityName && <Text style={styles.city}>{cityName}</Text>}
          </View>

          <View style={styles.timeCol}>
            {upcoming && (
              <Text style={styles.time}>{formatPrayerTime(upcoming.time, localeTag)}</Text>
            )}
            {remaining && (
              <Text style={styles.remaining}>
                {remaining.hours > 0
                  ? tr('prayer.inHoursMinutes', { h: remaining.hours, m: remaining.minutes })
                  : tr('prayer.inMinutes', { m: remaining.minutes })}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 24 },
  label: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  prayerName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff', marginTop: 1 },
  city: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  setupHint: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: '#fff', marginTop: 2 },
  timeCol: { alignItems: 'flex-end' },
  time: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff' },
  remaining: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
});
