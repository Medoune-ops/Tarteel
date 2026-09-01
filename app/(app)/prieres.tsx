/**
 * Écran « Heures de prière » — les 5 prières du jour, la prochaine mise en
 * avant, plus le choix de la position et de la méthode de calcul.
 *
 * Tout est calculé localement (`constants/prayerTimes.ts`) : aucun appel
 * réseau, l'écran fonctionne hors-ligne dès que la position est connue.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import HeaderPattern from '../../components/HeaderPattern';
import DeviceStatusBar from '../../components/StatusBar';
import QiblaCompass from '../../components/QiblaCompass';
import { useTheme } from '../../utils/useTheme';
import { usePrayerStore } from '../../store/prayerStore';
import { useUserStore } from '../../store/userStore';
import {
  computePrayerTimes,
  nextPrayer,
  formatPrayerTime,
  timeUntil,
  FALLBACK_CITIES,
  METHOD_IDS,
  type PrayerSlot,
} from '../../constants/prayerTimes';
import { useT } from '../../lib/i18n';

const LOCALE_BY_LANG: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar' };

export default function PrieresScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();
  const language = useUserStore((s) => s.language);
  const localeTag = LOCALE_BY_LANG[language] ?? 'fr-FR';

  const latitude = usePrayerStore((s) => s.latitude);
  const longitude = usePrayerStore((s) => s.longitude);
  const cityName = usePrayerStore((s) => s.cityName);
  const source = usePrayerStore((s) => s.source);
  const method = usePrayerStore((s) => s.method);
  const setFromGps = usePrayerStore((s) => s.setFromGps);
  const setFromCity = usePrayerStore((s) => s.setFromCity);
  const setMethod = usePrayerStore((s) => s.setMethod);

  const [locating, setLocating] = useState(false);
  const [showCities, setShowCities] = useState(false);

  // Re-rendu chaque minute pour le compte à rebours.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const useGps = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Refus : on ne bloque pas, on propose la liste de villes.
        setShowCities(true);
        Alert.alert(tr('prayer.permissionTitle'), tr('prayer.permissionDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setFromGps(pos.coords.latitude, pos.coords.longitude);
      setShowCities(false);
    } catch {
      // GPS indisponible (intérieur, appareil sans capteur…) : repli manuel.
      setShowCities(true);
      Alert.alert(tr('prayer.permissionTitle'), tr('prayer.locationFailed'));
    } finally {
      setLocating(false);
    }
  }, [setFromGps, tr]);

  const slots: PrayerSlot[] = useMemo(() => {
    if (latitude == null || longitude == null) return [];
    return computePrayerTimes(latitude, longitude, method, now);
  }, [latitude, longitude, method, now]);

  const upcoming = useMemo(() => {
    if (slots.length === 0) return null;
    const next = nextPrayer(slots, now);
    if (next) return next;
    // Après l'Isha : le Fajr de demain.
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return latitude != null && longitude != null
      ? computePrayerTimes(latitude, longitude, method, tomorrow)[0] ?? null
      : null;
  }, [slots, now, latitude, longitude, method]);

  const remaining = upcoming ? timeUntil(upcoming.time, now) : null;
  const hasLocation = latitude != null && longitude != null;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <LinearGradient colors={['#1F8A70', '#26A17B']} style={styles.header}>
        <HeaderPattern width={width} height={180} variant="arcs" />
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <View style={styles.headerMedallion}>
          <Text style={styles.headerEmoji}>🕌</Text>
        </View>
        <Text style={styles.headerTitle}>{tr('prayer.headerTitle')}</Text>
        <View style={styles.headerRule} />
        <Text style={styles.headerSub}>{tr('prayer.headerSub')}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!hasLocation ? (
          <View style={styles.setupBox}>
            <Feather name="map-pin" size={32} color={T.textTertiary} />
            <Text style={[styles.setupText, { color: T.textSecondary }]}>
              {tr('prayer.setupExplain')}
            </Text>
            <Pressable style={styles.primaryBtn} onPress={useGps} disabled={locating}>
              {locating
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryLabel}>{tr('prayer.useGps')}</Text>}
            </Pressable>
            <Pressable onPress={() => setShowCities((v) => !v)}>
              <Text style={[styles.linkBtn, { color: T.textSecondary }]}>{tr('prayer.chooseCity')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Prochaine prière, mise en avant. */}
            {upcoming && (
              <LinearGradient
                colors={['#1F8A70', '#26A17B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextCard}
              >
                <Text style={styles.nextLabel}>{tr('prayer.nextPrayer')}</Text>
                <Text style={styles.nextName}>{tr(`prayer.name.${upcoming.name}`)}</Text>
                <Text style={styles.nextTime}>{formatPrayerTime(upcoming.time, localeTag)}</Text>
                {remaining && (
                  <Text style={styles.nextRemaining}>
                    {remaining.hours > 0
                      ? tr('prayer.inHoursMinutes', { h: remaining.hours, m: remaining.minutes })
                      : tr('prayer.inMinutes', { m: remaining.minutes })}
                  </Text>
                )}
              </LinearGradient>
            )}

            {/* Les 5 prières du jour. */}
            <View style={[styles.list, { backgroundColor: T.cardBg }]}>
              {slots.map((s, i) => {
                const isNext = upcoming?.name === s.name && s.time.getTime() === upcoming.time.getTime();
                const passed = s.time.getTime() <= now.getTime();
                return (
                  <View
                    key={s.name}
                    style={[
                      styles.row,
                      i > 0 && [styles.divider, { borderTopColor: T.divider }],
                      isNext && styles.rowActive,
                    ]}
                  >
                    <Text style={[styles.rowName, { color: passed && !isNext ? T.textTertiary : T.text }]}>
                      {tr(`prayer.name.${s.name}`)}
                    </Text>
                    <Text style={[styles.rowTime, { color: passed && !isNext ? T.textTertiary : T.text }]}>
                      {formatPrayerTime(s.time, localeTag)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Position courante + moyen d'en changer. */}
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('prayer.locationTitle')}</Text>
            <View style={[styles.locationBox, { backgroundColor: T.cardBg }]}>
              <Feather name="map-pin" size={16} color={T.textSecondary} />
              <Text style={[styles.locationText, { color: T.textSecondary }]}>
                {cityName ?? (source === 'gps' ? tr('prayer.gpsPosition') : '—')}
              </Text>
            </View>
            <View style={styles.locationActions}>
              <Pressable style={styles.secondaryBtn} onPress={useGps} disabled={locating}>
                {locating
                  ? <ActivityIndicator color="#1F8A70" size="small" />
                  : <Text style={styles.secondaryLabel}>{tr('prayer.useGps')}</Text>}
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => setShowCities((v) => !v)}>
                <Text style={styles.secondaryLabel}>{tr('prayer.chooseCity')}</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Liste des villes de repli. */}
        {showCities && (
          <View style={[styles.list, { backgroundColor: T.cardBg, marginTop: 12 }]}>
            {FALLBACK_CITIES.map((c, i) => (
              <Pressable
                key={c.id}
                style={[styles.row, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}
                onPress={() => { setFromCity(c); setShowCities(false); }}
              >
                <Text style={[styles.rowName, { color: T.text }]}>{c.nom}</Text>
                {cityName === c.nom && <Feather name="check" size={18} color="#1F8A70" />}
              </Pressable>
            ))}
          </View>
        )}

        {/* Méthode de calcul — change surtout Fajr et Isha. */}
        {hasLocation && (
          <>
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('prayer.methodTitle')}</Text>
            <Text style={[styles.methodHint, { color: T.textTertiary }]}>{tr('prayer.methodHint')}</Text>
            <View style={[styles.list, { backgroundColor: T.cardBg }]}>
              {METHOD_IDS.map((m, i) => (
                <Pressable
                  key={m}
                  style={[styles.row, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.rowName, { color: T.text }]}>{tr(`prayer.method.${m}`)}</Text>
                  {method === m && <Feather name="check" size={18} color="#1F8A70" />}
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Qibla — même position, même besoin : on évite un écran séparé. */}
        {hasLocation && (
          <>
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('qibla.sectionTitle')}</Text>
            <QiblaCompass
              latitude={latitude}
              longitude={longitude}
              colors={{
                text: T.text,
                textSecondary: T.textSecondary,
                textTertiary: T.textTertiary,
                cardBg: T.cardBg,
              }}
            />
          </>
        )}

        <Text style={[styles.note, { color: T.textTertiary }]}>{tr('prayer.footerNote')}</Text>
        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 22, paddingHorizontal: 20, alignItems: 'center' },
  back: { position: 'absolute', left: 14, top: 54, zIndex: 2 },
  headerMedallion: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerEmoji: { fontSize: 30 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 10 },
  headerRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 8 },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 8 },

  content: { paddingHorizontal: 20, paddingTop: 18 },

  setupBox: { alignItems: 'center', gap: 14, paddingVertical: 40, paddingHorizontal: 20 },
  setupText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    backgroundColor: '#1F8A70', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, minWidth: 200, alignItems: 'center',
  },
  primaryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  linkBtn: { fontFamily: 'Nunito_700Bold', fontSize: 14, textDecorationLine: 'underline' },

  nextCard: { borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 18 },
  nextLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  nextName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', marginTop: 2 },
  nextTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 40, color: '#fff', marginTop: 4 },
  nextRemaining: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  list: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowActive: { backgroundColor: 'rgba(31,138,112,0.10)' },
  divider: { borderTopWidth: 1 },
  rowName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  rowTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },

  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, marginTop: 22, marginBottom: 10 },
  methodHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginBottom: 10, lineHeight: 17 },

  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  locationText: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  locationActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#1F8A70', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  secondaryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#1F8A70' },

  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, textAlign: 'center', marginTop: 20, paddingHorizontal: 12, lineHeight: 17 },
});
