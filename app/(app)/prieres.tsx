/**
 * Écran « Heures de prière » — arc du soleil et prochaine prière dans
 * l'en-tête, les 5 prières du jour (le Chourouq rattaché au Fajr), les rappels
 * (adhan, voix, notification « avant »), la position et la Qibla.
 *
 * Tout est calculé localement (`constants/prayerTimes.ts`) : aucun appel
 * réseau, l'écran fonctionne hors-ligne dès que la position est connue.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import DeviceStatusBar from '../../components/StatusBar';
import QiblaCompass from '../../components/QiblaCompass';
import { useTheme } from '../../utils/useTheme';
import {
  usePrayerStore, ADHAN_SOUNDS, REMINDER_BEFORE_OPTIONS, type AdhanSound,
} from '../../store/prayerStore';
import { useUserStore } from '../../store/userStore';
import {
  computePrayerTimes,
  computeSunrise,
  nextPrayer,
  formatPrayerTime,
  timeUntil,
  FALLBACK_CITIES,
  type PrayerName,
  type PrayerSlot,
} from '../../constants/prayerTimes';
import { toHijri } from '../../constants/hijri';
import { requestReminderPermission } from '../../lib/prayerReminders';
import { useT, type I18nKey } from '../../lib/i18n';

const LOCALE_BY_LANG: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar' };

const AR_NAME: Record<PrayerName | 'sunrise', string> = {
  fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};
/** Ciel associé à chaque moment de la journée (pastille de la ligne). */
const SKY: Record<PrayerName | 'sunrise', [string, string]> = {
  fajr: ['#3B3F8C', '#C77A9A'],
  sunrise: ['#F6B26B', '#F7D88A'],
  dhuhr: ['#5BB8F0', '#FFE08A'],
  asr: ['#E9A94B', '#F7D27A'],
  maghrib: ['#D9564A', '#F29A5B'],
  isha: ['#141C3E', '#3A4A8A'],
};

const LIGHT = {
  bg: '#F3F4F1', card: '#FFFFFF', ink: '#16201C', muted: '#6E7873', line: '#ECEEEA',
  accent: '#1A8F69', accentSoft: '#E2F2EA', rowNext: '#E6F4EC',
  hero: ['#166F55', '#1E8E6A', '#2BA47D'] as const,
  sunHalo: 'rgba(255,214,107,0.28)', swOff: '#D7DBD7', seg: '#EFF1EE', segOn: '#FFFFFF', radioOff: '#C9CFCB',
};
const DARK = {
  bg: '#0B0F0E', card: '#141A18', ink: '#EDF3F0', muted: '#8C9893', line: '#222A27',
  accent: '#3DCB98', accentSoft: 'rgba(61,203,152,0.13)', rowNext: 'rgba(61,203,152,0.11)',
  hero: ['#08201A', '#0D3328', '#13503E'] as const,
  sunHalo: 'rgba(255,214,107,0.18)', swOff: '#2E3734', seg: '#1D2421', segOn: '#2B3430', radioOff: '#2C3532',
};

const minutesOf = (d: Date) => d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PrieresScreen() {
  const router = useRouter();
  const T = useTheme();
  const C = T.isDark ? DARK : LIGHT;
  const tr = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const language = useUserStore((s) => s.language);
  const localeTag = LOCALE_BY_LANG[language] ?? 'fr-FR';

  const latitude = usePrayerStore((s) => s.latitude);
  const longitude = usePrayerStore((s) => s.longitude);
  const cityName = usePrayerStore((s) => s.cityName);
  const source = usePrayerStore((s) => s.source);
  const setFromGps = usePrayerStore((s) => s.setFromGps);
  const setFromCity = usePrayerStore((s) => s.setFromCity);
  const remindersEnabled = usePrayerStore((s) => s.remindersEnabled);
  const reminderPrayers = usePrayerStore((s) => s.reminderPrayers);
  const setRemindersEnabled = usePrayerStore((s) => s.setRemindersEnabled);
  const toggleReminderPrayer = usePrayerStore((s) => s.toggleReminderPrayer);
  const adhanSound = usePrayerStore((s) => s.adhanSound);
  const setAdhanSound = usePrayerStore((s) => s.setAdhanSound);
  const reminderBefore = usePrayerStore((s) => s.reminderBefore);
  const setReminderBefore = usePrayerStore((s) => s.setReminderBefore);

  // Aperçu de la voix choisie.
  // TODO(backend) : un seul fichier embarqué pour l'instant
  // (prayer_reminder.wav) ; chaque voix aura son propre fichier une fois les
  // adhans fournis par le backend / CDN.
  const preview = useAudioPlayer(require('../../assets/sounds/prayer_reminder.wav'));
  const previewStatus = useAudioPlayerStatus(preview);
  const [previewing, setPreviewing] = useState<AdhanSound | null>(null);
  const playingId = previewStatus.playing ? previewing : null;
  const togglePreview = useCallback((id: AdhanSound) => {
    setAdhanSound(id);
    if (playingId === id) {
      preview.pause();
      setPreviewing(null);
      return;
    }
    preview.seekTo(0);
    preview.play();
    setPreviewing(id);
  }, [preview, playingId, setAdhanSound]);

  // La programmation elle-même est faite par usePrayerRemindersSync (layout
  // racine) dès que le réglage change ; ici on ne gère que la permission.
  const onToggleReminders = useCallback(async () => {
    if (remindersEnabled) {
      setRemindersEnabled(false);
      return;
    }
    const granted = await requestReminderPermission().catch(() => false);
    if (!granted) {
      Alert.alert(tr('prayer.reminder.permissionTitle'), tr('prayer.reminder.permissionDenied'));
      return;
    }
    setRemindersEnabled(true);
  }, [remindersEnabled, setRemindersEnabled, tr]);

  const [locating, setLocating] = useState(false);
  const [showCities, setShowCities] = useState(false);

  // Re-rendu chaque minute pour le compte à rebours et le soleil.
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
    return computePrayerTimes(latitude, longitude, now);
  }, [latitude, longitude, now]);

  // Chourouq : fin du temps du Fajr, affiché sous sa ligne (pas une prière).
  const sunrise = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    return computeSunrise(latitude, longitude, now);
  }, [latitude, longitude, now]);

  const upcoming = useMemo(() => {
    if (slots.length === 0) return null;
    const next = nextPrayer(slots, now);
    if (next) return next;
    // Après l'Isha : le Fajr de demain.
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return latitude != null && longitude != null
      ? computePrayerTimes(latitude, longitude, tomorrow)[0] ?? null
      : null;
  }, [slots, now, latitude, longitude]);

  const remaining = upcoming ? timeUntil(upcoming.time, now) : null;
  const hasLocation = latitude != null && longitude != null;
  const remainingLong = remaining
    ? (remaining.hours > 0
      ? tr('prayer.inHoursMinutesLong', { h: remaining.hours, m: remaining.minutes })
      : tr('prayer.inMinutes', { m: remaining.minutes }))
    : '';
  const remainingShort = remaining
    ? (remaining.hours > 0
      ? tr('prayer.inHoursMinutes', { h: remaining.hours, m: remaining.minutes })
      : tr('prayer.inMinutes', { m: remaining.minutes }))
    : '';

  // ── Arc du soleil (géométrie de la maquette : 350 × 214, rayons 160 / 190). ──
  const arcW = Math.min(350, width - 24);
  const k = arcW / 350;
  const arc = useMemo(() => {
    if (slots.length === 0) return null;
    const cx = 175 * k, base = 204 * k, rx = 160 * k, ry = 190 * k;
    const s0 = minutesOf(slots[0]!.time) - 21;
    const s1 = minutesOf(slots[4]!.time) + 22;
    const pt = (m: number) => {
      const f = Math.min(1, Math.max(0, (m - s0) / (s1 - s0)));
      const a = Math.PI * (1 - f);
      return { x: cx + rx * Math.cos(a), y: base - ry * Math.sin(a) };
    };
    const nowM = minutesOf(now);
    const sun = pt(nowM);
    return {
      base,
      full: `M${cx - rx} ${base} A${rx} ${ry} 0 0 1 ${cx + rx} ${base}`,
      done: `M${cx - rx} ${base} A${rx} ${ry} 0 0 1 ${sun.x} ${sun.y}`,
      sun,
      dots: slots.map((s) => {
        const p = pt(minutesOf(s.time));
        return {
          ...p,
          name: s.name,
          isNext: upcoming?.name === s.name,
          past: s.time.getTime() <= now.getTime(),
        };
      }),
    };
  }, [slots, now, k, upcoming]);

  const hijri = toHijri(now);
  const dateLabel = capitalize(now.toLocaleDateString(localeTag, { weekday: 'long', day: 'numeric', month: 'long' }));
  const hijriLabel = `${hijri.day} ${tr(`prayer.hijri.month.${hijri.month}` as I18nKey)} ${hijri.year}`;

  // Lignes du tableau : les 5 prières, le Chourouq glissé après le Fajr.
  const rows: { key: PrayerName | 'sunrise'; time: Date; minor?: boolean }[] = [];
  for (const s of slots) {
    rows.push({ key: s.name, time: s.time });
    if (s.name === 'fajr' && sunrise) rows.push({ key: 'sunrise', time: sunrise, minor: true });
  }

  const cityLabel = cityName ?? tr('prayer.myPosition');

  return (
    <View style={[styles.screen, { backgroundColor: C.bg }]}>
      <DeviceStatusBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
        {/* ── En-tête ── */}
        <LinearGradient
          colors={C.hero}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityLabel={tr('prayer.back')}>
              <Feather name="chevron-left" size={22} color="#0F5B44" />
            </Pressable>
            <Text style={styles.heroTitle} numberOfLines={1}>{tr('prayer.headerTitle')}</Text>
            <Pressable onPress={() => setShowCities((v) => !v)} style={styles.cityPill} accessibilityLabel={tr('prayer.chooseCity')}>
              <Feather name="map-pin" size={15} color="#0F5B44" />
              <Text style={styles.cityPillText} numberOfLines={1}>{cityLabel}</Text>
              <Feather name="chevron-down" size={14} color="#0F5B44" />
            </Pressable>
          </View>

          {hasLocation && arc && upcoming ? (
            <>
              <View style={{ width: arcW, height: 214 * k, alignSelf: 'center', marginTop: 12 }}>
                <Svg width={arcW} height={214 * k} style={StyleSheet.absoluteFill}>
                  <Path d={arc.full} stroke="rgba(255,255,255,0.28)" strokeWidth={2} strokeDasharray="2 6" strokeLinecap="round" fill="none" />
                  <Path d={arc.done} stroke="rgba(255,255,255,0.85)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
                  <Line x1={0} y1={arc.base} x2={arcW} y2={arc.base} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
                </Svg>
                {arc.dots.map((d) => {
                  const size = d.isNext ? 14 : 9;
                  return (
                    <View
                      key={d.name}
                      style={{
                        position: 'absolute', left: d.x - size / 2, top: d.y - size / 2,
                        width: size, height: size, borderRadius: size / 2,
                        backgroundColor: d.isNext ? '#fff' : d.past ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                        borderWidth: d.isNext ? 3 : 0, borderColor: 'rgba(255,255,255,0.35)',
                      }}
                    />
                  );
                })}
                <View style={[styles.sunHalo, { left: arc.sun.x - 17, top: arc.sun.y - 17, backgroundColor: C.sunHalo }]} />
                <View style={[styles.sun, { left: arc.sun.x - 11, top: arc.sun.y - 11 }]} />
                <View style={styles.arcCenter}>
                  <Text style={styles.nextLine}>
                    {tr('prayer.nextShort')} · <Text style={styles.nextLineStrong}>{tr(`prayer.name.${upcoming.name}`)}</Text>
                  </Text>
                  <Text style={styles.nextTime}>{formatPrayerTime(upcoming.time, localeTag)}</Text>
                  <View style={styles.remainingPill}>
                    <Text style={styles.remainingText}>{remainingLong}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.arcEnds}>
                <Text style={styles.arcEndText}>{tr('prayer.name.fajr')}</Text>
                <Text style={styles.arcEndText}>{tr('prayer.name.isha')}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.heroSub}>{tr('prayer.headerSub')}</Text>
          )}
        </LinearGradient>

        <View style={styles.content}>
          {/* Choix de la position (pastille de ville, « Modifier », ou premier lancement). */}
          {(showCities || !hasLocation) && (
            <View style={[styles.card, { backgroundColor: C.card, marginTop: 18 }]}>
              {!hasLocation && (
                <Text style={[styles.setupText, { color: C.muted }]}>{tr('prayer.setupExplain')}</Text>
              )}
              <Pressable style={[styles.cityRow, { borderBottomColor: C.line }]} onPress={useGps} disabled={locating}>
                <Feather name="navigation" size={17} color={C.accent} />
                <Text style={[styles.cityRowText, { color: C.accent }]}>{tr('prayer.useGps')}</Text>
                {locating && <ActivityIndicator color={C.accent} size="small" />}
              </Pressable>
              {FALLBACK_CITIES.map((c, i) => (
                <Pressable
                  key={c.id}
                  style={[styles.cityRow, i < FALLBACK_CITIES.length - 1 && { borderBottomColor: C.line }]}
                  onPress={() => { setFromCity(c); setShowCities(false); }}
                >
                  <Text style={[styles.cityRowText, { color: C.ink }]}>{c.nom}</Text>
                  {cityName === c.nom && <Feather name="check" size={18} color={C.accent} />}
                </Pressable>
              ))}
            </View>
          )}

          {hasLocation && (
            <>
              <View style={styles.dateRow}>
                <Text style={[styles.dateText, { color: C.ink }]}>{dateLabel}</Text>
                <Text style={[styles.hijriText, { color: C.muted }]}>{hijriLabel}</Text>
              </View>

              {/* ── Les prières du jour ── */}
              <View style={[styles.card, styles.listCard, { backgroundColor: C.card }]}>
                {rows.map((r) => {
                  const minor = !!r.minor;
                  const name = r.key as PrayerName;
                  const isNext = !minor && upcoming?.name === r.key;
                  const time = isNext ? upcoming!.time : r.time;
                  const past = !isNext && r.time.getTime() <= now.getTime();
                  const on = !minor && !!reminderPrayers[name];
                  const active = on && remindersEnabled;
                  const sub = minor
                    ? tr('prayer.sunriseRow')
                    : isNext
                      ? tr('prayer.rowNext', { when: remainingShort })
                      : past ? tr('prayer.rowPassed') : on ? tr('prayer.rowAdhan') : tr('prayer.rowSilent');
                  const label = minor ? tr('prayer.sunrise') : tr(`prayer.name.${name}`);
                  return (
                    <View
                      key={r.key}
                      style={[
                        styles.prayerRow,
                        minor && styles.prayerRowMinor,
                        isNext && { backgroundColor: C.rowNext },
                      ]}
                    >
                      <LinearGradient
                        colors={SKY[r.key]}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.6, y: 1 }}
                        style={[
                          minor ? styles.chipMinor : styles.chip,
                          { opacity: past ? 0.5 : 1 },
                        ]}
                      />
                      <View style={[styles.prayerText, { opacity: past ? 0.5 : 1 }]}>
                        <View style={styles.prayerNameLine}>
                          <Text style={[styles.prayerName, { color: C.ink, fontSize: minor ? 14 : 16 }]}>{label}</Text>
                          <Text style={[styles.prayerAr, { color: C.muted }]}>{AR_NAME[r.key]}</Text>
                        </View>
                        <Text style={[styles.prayerSub, { color: isNext ? C.accent : C.muted }]} numberOfLines={1}>{sub}</Text>
                      </View>
                      <Text
                        style={[
                          styles.prayerTime,
                          { color: isNext ? C.accent : C.ink, fontSize: minor ? 15 : 19, opacity: past ? 0.5 : 1 },
                        ]}
                      >
                        {formatPrayerTime(time, localeTag)}
                      </Text>
                      {minor ? (
                        <View style={styles.bellBtn} />
                      ) : (
                        <Pressable
                          onPress={() => toggleReminderPrayer(name)}
                          style={[styles.bellBtn, active && { backgroundColor: C.accentSoft }]}
                          accessibilityLabel={tr(on ? 'prayer.bellOn' : 'prayer.bellOff', { name: label })}
                          hitSlop={4}
                        >
                          <Feather name={active ? 'bell' : 'bell-off'} size={17} color={active ? C.accent : C.muted} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* ── Rappels ── */}
              <Text style={[styles.sectionTitle, { color: C.ink }]}>{tr('prayer.reminder.sectionTitle')}</Text>
              <View style={[styles.card, { backgroundColor: C.card }]}>
                <View style={styles.reminderHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: C.ink }]}>{tr('prayer.reminder.adhanToggle')}</Text>
                    <Text style={[styles.rowSub, { color: C.muted }]}>{tr('prayer.reminder.adhanHint')}</Text>
                  </View>
                  <Pressable
                    onPress={onToggleReminders}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: remindersEnabled }}
                    accessibilityLabel={tr('prayer.reminder.adhanToggle')}
                    style={[
                      styles.switch,
                      { backgroundColor: remindersEnabled ? C.accent : C.swOff, alignItems: remindersEnabled ? 'flex-end' : 'flex-start' },
                    ]}
                  >
                    <View style={styles.switchKnob} />
                  </Pressable>
                </View>

                <View style={[styles.sounds, { opacity: remindersEnabled ? 1 : 0.4 }]}>
                  {ADHAN_SOUNDS.map((id) => {
                    const sel = adhanSound === id;
                    const playing = playingId === id;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setAdhanSound(id)}
                        style={[
                          styles.soundRow,
                          { backgroundColor: sel ? C.accentSoft : 'transparent', borderColor: sel ? 'transparent' : C.line },
                        ]}
                      >
                        <View style={[styles.radio, { borderColor: sel ? C.accent : C.radioOff }]}>
                          <View style={[styles.radioDot, { backgroundColor: sel ? C.accent : 'transparent' }]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.soundName, { color: C.ink }]}>{tr(`prayer.reminder.sound.${id}`)}</Text>
                          <Text style={[styles.soundSub, { color: C.muted }]}>{tr(`prayer.reminder.sound.${id}Sub`)}</Text>
                        </View>
                        <Pressable
                          onPress={() => togglePreview(id)}
                          style={[styles.playBtn, { backgroundColor: playing ? C.accent : C.seg }]}
                          accessibilityLabel={playing ? tr('prayer.reminder.stop') : tr('prayer.reminder.preview')}
                        >
                          <Feather
                            name={playing ? 'pause' : 'play'}
                            size={14}
                            color={playing ? '#fff' : C.ink}
                            style={playing ? undefined : { marginLeft: 2 }}
                          />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={[styles.hr, { backgroundColor: C.line }]} />
                <View style={styles.beforeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitleSm, { color: C.ink }]}>{tr('prayer.reminder.before')}</Text>
                    <Text style={[styles.rowSub, { color: C.muted }]}>{tr('prayer.reminder.beforeHint')}</Text>
                  </View>
                  <View style={[styles.segment, { backgroundColor: C.seg }]}>
                    {REMINDER_BEFORE_OPTIONS.map((v) => {
                      const sel = reminderBefore === v;
                      return (
                        <Pressable
                          key={v}
                          onPress={() => setReminderBefore(v)}
                          style={[styles.segItem, sel && [styles.segItemOn, { backgroundColor: C.segOn }]]}
                        >
                          <Text style={[styles.segText, { color: sel ? C.ink : C.muted }]}>
                            {v === 0 ? tr('prayer.reminder.beforeNone') : tr('prayer.reminder.beforeMin', { m: v })}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* ── Position ── */}
              <Text style={[styles.sectionTitle, { color: C.ink }]}>{tr('prayer.locationTitle')}</Text>
              <View style={[styles.card, styles.positionCard, { backgroundColor: C.card }]}>
                <View style={[styles.positionIcon, { backgroundColor: C.accentSoft }]}>
                  <Feather name="map-pin" size={21} color={C.accent} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.rowTitle, { color: C.ink }]} numberOfLines={1}>
                    {cityName ?? (source === 'gps' ? tr('prayer.gpsPosition') : '—')}
                  </Text>
                  <Text style={[styles.positionSub, { color: C.muted }]} numberOfLines={1}>
                    {source === 'gps' ? tr('prayer.sourceGps') : tr('prayer.sourceCity')}
                  </Text>
                </View>
                <Pressable onPress={() => setShowCities((v) => !v)} style={[styles.editBtn, { backgroundColor: C.accentSoft }]}>
                  <Text style={[styles.editText, { color: C.accent }]}>{tr('prayer.edit')}</Text>
                </Pressable>
              </View>

              {/* ── Qibla ── */}
              <Text style={[styles.sectionTitle, { color: C.ink }]}>{tr('qibla.sectionTitle')}</Text>
              <QiblaCompass
                latitude={latitude}
                longitude={longitude}
                dark={T.isDark}
                colors={{ text: C.ink, textSecondary: C.muted, textTertiary: C.muted, cardBg: C.card }}
              />
            </>
          )}

          <Text style={[styles.note, { color: C.muted }]}>{tr('prayer.footerNote')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  hero: { paddingHorizontal: 20, paddingBottom: 26, overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  heroTitle: { flex: 1, textAlign: 'center', fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, color: '#fff' },
  cityPill: {
    height: 42, maxWidth: 140, paddingLeft: 11, paddingRight: 12, borderRadius: 14, backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  cityPillText: { flexShrink: 1, fontFamily: 'Nunito_900Black', fontSize: 14, color: '#0F5B44' },
  heroSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 26 },

  sun: {
    position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFD66B',
    shadowColor: '#FFD66B', shadowOpacity: 0.7, shadowRadius: 14, elevation: 8,
  },
  sunHalo: { position: 'absolute', width: 34, height: 34, borderRadius: 17 },
  arcCenter: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center' },
  nextLine: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.78)' },
  nextLineStrong: { fontFamily: 'Nunito_900Black', color: '#fff' },
  nextTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 54, lineHeight: 64, color: '#fff', letterSpacing: -1, marginTop: 6 },
  remainingPill: { marginTop: 4, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)' },
  remainingText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },
  arcEnds: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 2 },
  arcEndText: { fontFamily: 'Nunito_700Bold', fontSize: 11, color: 'rgba(255,255,255,0.6)' },

  content: { paddingHorizontal: 18 },
  card: {
    borderRadius: 24, overflow: 'hidden',
    shadowColor: '#14281E', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1,
  },
  setupText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20, textAlign: 'center', padding: 18, paddingBottom: 6 },
  cityRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent',
  },
  cityRowText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },

  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 18, paddingBottom: 12, gap: 8 },
  dateText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, flexShrink: 1 },
  hijriText: { fontFamily: 'Nunito_700Bold', fontSize: 13, textAlign: 'right', flexShrink: 1 },

  listCard: { padding: 6 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  prayerRowMinor: { paddingTop: 4, paddingBottom: 12 },
  chip: { width: 38, height: 38, borderRadius: 12 },
  chipMinor: { width: 20, height: 20, borderRadius: 7, marginLeft: 9, marginRight: 9 },
  prayerText: { flex: 1, minWidth: 0 },
  prayerNameLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  prayerName: { fontFamily: 'Nunito_800ExtraBold' },
  prayerAr: { fontFamily: 'ScheherazadeNew_400Regular', fontSize: 17, lineHeight: 22 },
  prayerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 1 },
  prayerTime: { fontFamily: 'Baloo2_800ExtraBold', fontVariant: ['tabular-nums'] },
  bellBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, paddingHorizontal: 4, paddingTop: 28, paddingBottom: 10 },

  reminderHead: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  rowTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  rowTitleSm: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  rowSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2 },
  switch: { width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: 'center' },
  switchKnob: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  sounds: { paddingHorizontal: 18, paddingBottom: 18, gap: 8 },
  soundRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingRight: 10, paddingLeft: 14, borderRadius: 16, borderWidth: 1.5,
  },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  soundName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  soundSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12 },
  playBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  hr: { height: 1 },
  beforeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 16 },
  segment: { flexDirection: 'row', gap: 4, padding: 3, borderRadius: 12 },
  segItem: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  segItemOn: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },

  positionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingLeft: 18, paddingRight: 16 },
  positionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  positionSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 1 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  editText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, textAlign: 'center', marginTop: 24, paddingHorizontal: 12, lineHeight: 17 },
});
