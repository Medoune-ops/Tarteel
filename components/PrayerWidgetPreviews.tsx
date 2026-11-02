/**
 * Aperçus des widgets « Heures de prière » pour la page Widgets. Reproduisent
 * les widgets natifs (widgets/ios/TarteelWidgets/PrayerWidgets.swift et
 * widgets/android/src/res/layout/w_prayer_*.xml) : prochaine prière (petit),
 * toutes les prières (moyen), journée + Qibla (grand).
 *
 * Les horaires sont ceux de la position enregistrée, ou de Dakar à défaut —
 * comme l'aperçu de la galerie de widgets du téléphone.
 */
import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { usePrayerStore } from '../store/prayerStore';
import { buildPrayerWidgetData, type PrayerWidgetKey } from '../utils/widgetData';
import { useT, type I18nKey } from '../lib/i18n';
import { useUserStore } from '../store/userStore';

const DAKAR = { latitude: 14.6937, longitude: -17.4441, city: 'Dakar' };

const AR: Record<PrayerWidgetKey, string> = {
  fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};
const SHORT: Record<PrayerWidgetKey, string> = {
  fajr: 'FAJR', sunrise: 'SHUR', dhuhr: 'DHUHR', asr: 'ASR', maghrib: 'MAGH', isha: 'ISHA',
};
const NAME_KEY: Record<PrayerWidgetKey, I18nKey> = {
  fajr: 'prayer.name.fajr', sunrise: 'prayer.sunrise', dhuhr: 'prayer.name.dhuhr',
  asr: 'prayer.name.asr', maghrib: 'prayer.name.maghrib', isha: 'prayer.name.isha',
};
/** Ciel à l'heure de la prière (pastilles du grand widget). */
const SKY: Record<PrayerWidgetKey, readonly [string, string]> = {
  fajr: ['#3B3F8C', '#C77A9A'], sunrise: ['#F6B26B', '#F7D88A'], dhuhr: ['#5BB8F0', '#FFE08A'],
  asr: ['#E9A94B', '#F7D27A'], maghrib: ['#D9564A', '#F29A5B'], isha: ['#141C3E', '#3A4A8A'],
};

type PPalette = {
  card: string; ink: string; muted: string; line: string; accent: string; accentSoft: string;
  nextBg: string; hero: readonly [string, string, string]; pastOpacity: number;
};
const LIGHT: PPalette = {
  card: '#FFFFFF', ink: '#16201C', muted: '#6E7873', line: '#ECEEEA', accent: '#1A8F69',
  accentSoft: '#E2F2EA', nextBg: '#E6F4EC', hero: ['#166F55', '#1E8E6A', '#2BA47D'], pastOpacity: 0.45,
};
const DARK: PPalette = {
  card: '#151C1A', ink: '#EDF3F0', muted: '#8C9893', line: '#232C29', accent: '#3DCB98',
  accentSoft: 'rgba(61,203,152,0.14)', nextBg: 'rgba(61,203,152,0.13)',
  hero: ['#08201A', '#0D3328', '#13503E'], pastOpacity: 0.4,
};
const SUN = '#FFD66B';
const SUN_INK = '#1C1A26';
const DIAG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };

type Slot = { k: PrayerWidgetKey; date: Date };

function hhmm(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Même découpage que PrayerState.make (Swift) : créneaux du jour, prochaine, précédente. */
function usePrayerState() {
  const lat = usePrayerStore((s) => s.latitude);
  const lng = usePrayerStore((s) => s.longitude);
  const cityName = usePrayerStore((s) => s.cityName);
  return useMemo(() => {
    const now = new Date();
    const hasPos = lat != null && lng != null;
    const data = buildPrayerWidgetData(
      hasPos ? lat : DAKAR.latitude, hasPos ? lng : DAKAR.longitude, hasPos ? cityName : DAKAR.city, now,
    );
    const slots: Slot[] = data.slots.map((s) => ({ k: s.k, date: new Date(s.t * 1000) }));
    const today = slots.filter((s) => sameDay(s.date, now));
    const mains = slots.filter((s) => s.k !== 'sunrise');
    const next = mains.find((s) => s.date > now) ?? mains[0]!;
    const previous = [...slots].reverse().find((s) => s.date <= now) ?? null;
    const start = previous?.date.getTime() ?? next.date.getTime() - 6 * 3600_000;
    const span = next.date.getTime() - start;
    const segment = span > 0 ? Math.min(1, Math.max(0, (now.getTime() - start) / span)) : 0;
    const mainToday = today.filter((s) => s.k !== 'sunrise');
    const first = mainToday[0]?.date.getTime() ?? 0;
    const last = mainToday[mainToday.length - 1]?.date.getTime() ?? 0;
    const day = last > first ? Math.min(1, Math.max(0, (now.getTime() - first) / (last - first))) : 0;
    const minutes = Math.max(0, Math.ceil((next.date.getTime() - now.getTime()) / 60000));
    return { now, city: data.city, qibla: data.qibla, today, mainToday, next, previous, segment, day, minutes };
  }, [lat, lng, cityName]);
}

function useLabels(s: ReturnType<typeof usePrayerState>) {
  const tr = useT();
  const en = useUserStore((u) => u.language) === 'en';
  const h = Math.floor(s.minutes / 60);
  const m = s.minutes % 60;
  const countdown = en
    ? (h > 0 ? `${h}h ${m}m` : `${m} min`)
    : (h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`);
  return {
    tr,
    name: (k: PrayerWidgetKey) => tr(NAME_KEY[k]),
    city: s.city ?? tr('widgets.preview.myLocation'),
    countdownLabel: tr('widgets.preview.prayerIn', { t: countdown }),
  };
}

/** Halo de soleil doré dans le coin du fond vert. */
function SunGlow({ size, style }: { size: number; style: object }) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(255,214,107,0.16)' }, style]}
    />
  );
}

// ─── Petit · Prochaine prière ───────────────────────────────────────────────
export function PrayerNextPreview({ isDark }: { isDark: boolean }) {
  const p = isDark ? DARK : LIGHT;
  const s = usePrayerState();
  const L = useLabels(s);
  return (
    <LinearGradient colors={p.hero} {...DIAG} style={pp.small}>
      <SunGlow size={130} style={{ top: -40, right: -40 }} />
      <View style={pp.rowBetween}>
        <Text style={[pp.label11, { opacity: 0.9 }]}>{L.tr('widgets.preview.nextPrayer')}</Text>
        <Text style={pp.ar15}>{AR[s.next.k]}</Text>
      </View>
      <Text style={[pp.name22, { marginTop: 6 }]} numberOfLines={1} adjustsFontSizeToFit>{L.name(s.next.k)}</Text>
      <Text style={pp.time42} numberOfLines={1} adjustsFontSizeToFit>{hhmm(s.next.date)}</Text>
      <View style={{ flex: 1 }} />
      <View style={pp.rowBetween}>
        <View style={pp.pillLight}><Text style={pp.pillText}>{L.countdownLabel}</Text></View>
        <View style={[pp.row3, { opacity: 0.85, flexShrink: 1, marginLeft: 4 }]}>
          <Feather name="map-pin" size={9} color="#fff" />
          <Text style={pp.city10} numberOfLines={1}>{L.city}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

/** Barre entre la prière précédente et la prochaine, avec la pastille soleil. */
function SegmentBar({ progress, p }: { progress: number; p: PPalette }) {
  return (
    <View style={{ height: 16, justifyContent: 'center' }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: p.line }} />
      <LinearGradient
        colors={[p.accentSoft, p.accent]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 0, height: 8, borderRadius: 4, width: `${Math.max(4, progress * 100)}%` }}
      />
      <View
        style={{
          position: 'absolute', left: `${progress * 100}%`, marginLeft: -16 * progress,
          width: 16, height: 16, borderRadius: 8, backgroundColor: SUN, borderWidth: 3, borderColor: p.card,
        }}
      />
    </View>
  );
}

// ─── Moyen · Toutes les prières ─────────────────────────────────────────────
export function PrayerAllPreview({ isDark }: { isDark: boolean }) {
  const p = isDark ? DARK : LIGHT;
  const s = usePrayerState();
  const L = useLabels(s);
  return (
    <View style={[pp.medium, { backgroundColor: p.card }]}>
      <LinearGradient colors={p.hero} {...DIAG} style={pp.mediumLeft}>
        <SunGlow size={150} style={{ bottom: -50, left: -30 }} />
        <Text style={[pp.label10, { opacity: 0.8 }]}>{L.tr('widgets.preview.nextCaps')}</Text>
        <View style={[pp.rowBetween, { marginTop: 4, alignItems: 'baseline' }]}>
          <Text style={[pp.name19, { flexShrink: 1 }]} numberOfLines={1} adjustsFontSizeToFit>{L.name(s.next.k)}</Text>
          <Text style={[pp.ar16, { opacity: 0.85 }]}>{AR[s.next.k]}</Text>
        </View>
        <Text style={pp.time38} numberOfLines={1} adjustsFontSizeToFit>{hhmm(s.next.date)}</Text>
        <View style={{ flex: 1 }} />
        <View style={[pp.pillLight, pp.row3, { alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 8 }]}>
          <Feather name="bell" size={9} color="#fff" />
          <Text style={pp.pillText} numberOfLines={1}>{L.countdownLabel}</Text>
        </View>
      </LinearGradient>

      <View style={pp.mediumRight}>
        <View style={pp.rowBetween}>
          <View style={[pp.row3, { flexShrink: 1 }]}>
            <Feather name="map-pin" size={9} color={p.muted} />
            <Text style={[pp.meta10, { color: p.muted }]} numberOfLines={1}>{L.city}</Text>
          </View>
        </View>
        {s.previous && (
          <View style={[pp.rowBetween, { marginTop: 12 }]}>
            <Text style={[pp.meta10, { color: p.muted }]} numberOfLines={1}>{L.name(s.previous.k)} {hhmm(s.previous.date)}</Text>
            <Text style={[pp.meta10, { color: p.accent }]} numberOfLines={1}>{L.name(s.next.k)} {hhmm(s.next.date)}</Text>
          </View>
        )}
        <View style={{ marginTop: 5 }}><SegmentBar progress={s.segment} p={p} /></View>
        <Text style={[pp.elapsed, { color: p.muted }]}>
          {L.tr('widgets.preview.elapsed', { n: Math.round(s.segment * 100) })}
        </Text>
        <View style={{ flex: 1 }} />
        <View style={[pp.row, { gap: 2 }]}>
          {s.mainToday.map((slot) => {
            const isNext = slot.date.getTime() === s.next.date.getTime();
            const past = slot.date < s.now && !isNext;
            return (
              <View
                key={slot.k}
                style={[pp.col, isNext && { backgroundColor: p.accent }, past && { opacity: p.pastOpacity }]}
              >
                <Text style={[pp.short, { color: isNext ? 'rgba(255,255,255,0.85)' : p.muted }]}>{SHORT[slot.k]}</Text>
                <Text style={[pp.colTime, { color: isNext ? '#fff' : p.ink }]} numberOfLines={1} adjustsFontSizeToFit>
                  {hhmm(slot.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** Cadran de la Qibla : aiguille dorée orientée depuis le nord. */
function QiblaDial({ degrees }: { degrees: number }) {
  return (
    <View style={pp.dial}>
      {Array.from({ length: 12 }, (_, i) => (
        <View key={i} style={[StyleSheet.absoluteFill, { alignItems: 'center', transform: [{ rotate: `${i * 30}deg` }] }]}>
          <View style={{ width: i % 3 === 0 ? 2 : 1.2, height: i % 3 === 0 ? 6 : 3, backgroundColor: 'rgba(255,255,255,0.5)', marginTop: 4 }} />
        </View>
      ))}
      <Text style={pp.dialN}>N</Text>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: `${degrees}deg` }] }]}>
        <View style={{ width: 2.6, height: 20, borderRadius: 2, backgroundColor: SUN, marginTop: -16 }} />
        <View style={{ width: 2.6, height: 12, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' }} />
      </View>
      <View style={pp.dialHub} />
    </View>
  );
}

// ─── Grand · Journée + Qibla ────────────────────────────────────────────────
export function PrayerLargePreview({ isDark }: { isDark: boolean }) {
  const p = isDark ? DARK : LIGHT;
  const s = usePrayerState();
  const L = useLabels(s);
  return (
    <View style={[pp.large, { backgroundColor: p.card }]}>
      <LinearGradient colors={p.hero} {...DIAG} style={pp.largeHero}>
        <SunGlow size={200} style={{ top: -60, right: -60 }} />
        <View style={[pp.row, { alignItems: 'center', gap: 12 }]}>
          <View style={{ flex: 1 }}>
            <View style={[pp.row3, { gap: 6 }]}>
              <Feather name="moon" size={11} color={SUN} />
              <Text style={[pp.label10, { opacity: 0.85 }]} numberOfLines={1}>
                {L.tr('widgets.preview.nextPrayerCity', { city: L.city.toUpperCase() })}
              </Text>
            </View>
            <View style={[pp.row, { alignItems: 'baseline', gap: 8, marginTop: 2 }]}>
              <Text style={pp.name22}>{L.name(s.next.k)}</Text>
              <Text style={[pp.ar20, { opacity: 0.85 }]}>{AR[s.next.k]}</Text>
            </View>
            <Text style={pp.time44} numberOfLines={1} adjustsFontSizeToFit>{hhmm(s.next.date)}</Text>
          </View>
          <QiblaDial degrees={s.qibla} />
        </View>
        <View style={[pp.row, { alignItems: 'center', gap: 8, marginTop: 10 }]}>
          <Text style={[pp.label10, { opacity: 0.75 }]}>{L.name('fajr')}</Text>
          <View style={{ flex: 1, height: 12, justifyContent: 'center' }}>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <LinearGradient
              colors={['rgba(255,255,255,0.7)', SUN]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', height: 6, borderRadius: 3, width: `${Math.max(3, s.day * 100)}%` }}
            />
            <View style={{ position: 'absolute', left: `${s.day * 100}%`, marginLeft: -12 * s.day, width: 12, height: 12, borderRadius: 6, backgroundColor: SUN }} />
          </View>
          <View style={pp.sunPill}><Text style={pp.sunPillText} numberOfLines={1}>{L.countdownLabel}</Text></View>
        </View>
      </LinearGradient>

      <View style={pp.list}>
        {s.today.map((slot) => {
          const isNext = slot.date.getTime() === s.next.date.getTime();
          const past = slot.date < s.now && !isNext;
          return (
            <View
              key={slot.k}
              style={[pp.listRow, isNext && { backgroundColor: p.nextBg }, past && { opacity: p.pastOpacity }]}
            >
              <LinearGradient colors={SKY[slot.k]} {...DIAG} style={pp.sky} />
              <Text style={[pp.listName, { color: isNext ? p.accent : p.ink }]}>{L.name(slot.k)}</Text>
              <View style={{ flex: 1 }} />
              <Text style={[pp.ar15, { color: p.muted }]}>{AR[slot.k]}</Text>
              <Text style={[pp.listTime, { color: isNext ? p.accent : p.ink }]}>{hhmm(slot.date)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const pp = StyleSheet.create({
  small: { width: 150, height: 150, borderRadius: 24, padding: 15, overflow: 'hidden' },
  medium: { width: 318, height: 150, borderRadius: 24, overflow: 'hidden', flexDirection: 'row' },
  mediumLeft: { width: 128, padding: 14, overflow: 'hidden' },
  mediumRight: { flex: 1, paddingHorizontal: 14, paddingTop: 13, paddingBottom: 12 },
  large: { width: 318, height: 330, borderRadius: 24, overflow: 'hidden' },
  largeHero: { paddingLeft: 18, paddingRight: 16, paddingVertical: 14, overflow: 'hidden' },

  row: { flexDirection: 'row' },
  row3: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  label10: { fontFamily: 'Nunito_900Black', fontSize: 10, color: '#fff' },
  label11: { fontFamily: 'Nunito_900Black', fontSize: 11, color: '#fff' },
  ar15: { fontFamily: 'ScheherazadeNew_400Regular', fontSize: 15, lineHeight: 22, color: '#fff' },
  ar16: { fontFamily: 'ScheherazadeNew_400Regular', fontSize: 16, lineHeight: 22, color: '#fff' },
  ar20: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 20, lineHeight: 28, color: '#fff' },
  name19: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, lineHeight: 23, color: '#fff' },
  name22: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, lineHeight: 26, color: '#fff' },
  time38: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 38, lineHeight: 42, color: '#fff' },
  time42: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 42, lineHeight: 46, color: '#fff' },
  time44: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 44, lineHeight: 48, color: '#fff' },
  city10: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#fff', flexShrink: 1 },
  pillLight: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontFamily: 'Nunito_900Black', fontSize: 11, color: '#fff' },

  meta10: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10 },
  elapsed: { fontFamily: 'Nunito_700Bold', fontSize: 10, marginTop: 3 },
  col: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: 12 },
  short: { fontFamily: 'Nunito_900Black', fontSize: 9.5 },
  colTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, lineHeight: 17 },

  dial: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  dialN: { position: 'absolute', top: 10, fontFamily: 'Nunito_900Black', fontSize: 8, color: '#fff' },
  dialHub: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  sunPill: { backgroundColor: SUN, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 3 },
  sunPillText: { fontFamily: 'Nunito_900Black', fontSize: 11, color: SUN_INK },

  list: { flex: 1, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 10, justifyContent: 'space-around' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  sky: { width: 22, height: 22, borderRadius: 7 },
  listName: { fontFamily: 'Nunito_900Black', fontSize: 13 },
  listTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, lineHeight: 20, width: 50, textAlign: 'right' },
});
