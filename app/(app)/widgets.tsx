import { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, Pressable, ScrollView, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import DeviceStatusBar from '../../components/StatusBar';
import Otter from '../../components/Otter';
import { FlameIcon } from '../../components/IslamicIcons';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { currentMotivationMsg } from '../../utils/widgetData';
import { nameOfTheDay } from '../../utils/nameOfDay';
import { useT, type I18nKey } from '../../lib/i18n';

// `expo-alternate-app-icons` est un module NATIF : dans Expo Go (pas de code
// natif custom), le simple `import` déclenche `requireNativeModule` qui plante
// et fait crasher toute l'app au scan des routes. On le charge donc de façon
// résiliente : si le module n'est pas là (Expo Go), on retombe sur des stubs
// inertes et le sélecteur d'icône s'affiche comme « non supporté ».
let supportsAlternateIcons = false;
let setAlternateAppIcon: (name: string | null) => Promise<void> = async () => {};
let getAppIconName: () => string | null = () => null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-alternate-app-icons');
  supportsAlternateIcons = mod.supportsAlternateIcons ?? false;
  setAlternateAppIcon = mod.setAlternateAppIcon;
  getAppIconName = mod.getAppIconName;
} catch (e) {
  // Dans Expo Go l'absence du natif est attendue. Dans un vrai build c'est un
  // BUG : sans ce log, l'écran afficherait « non supporté » sans qu'on puisse
  // jamais savoir pourquoi — c'est exactement ainsi que le module audio est
  // resté cassé sans qu'on le voie (voir constants/trackPlayer.ts).
  if (Constants.appOwnership === 'expo') {
    console.warn('[app-icons] module natif absent (Expo Go) — sélecteur d’icône désactivé.');
  } else {
    console.error(
      '[app-icons] expo-alternate-app-icons INTROUVABLE hors Expo Go — ' +
      'le sélecteur d’icône est cassé alors que le natif devrait être présent. Cause :',
      e,
    );
  }
}

// ─── Palette de la maquette (Tarteel Widgets et Podiums) ───────────────────
type Palette = {
  bg: string; card: string; ink: string; muted: string; line: string; accent: string;
  wall: readonly [string, string];
  hero: readonly [string, string, string];
};
const LIGHT: Palette = {
  bg: '#F5F4F1', card: '#FFFFFF', ink: '#1C1A26', muted: '#6F6C7A', line: '#EEECE8', accent: '#6B4DFF',
  wall: ['#E9E4F7', '#F7E7DA'] as const,
  hero: ['#FFA43A', '#F27A1A', '#E0601A'] as const,
};
const DARK: Palette = {
  bg: '#0D0C11', card: '#17161E', ink: '#EFEEF4', muted: '#9290A2', line: '#25232E', accent: '#9A82FF',
  wall: ['#1C1838', '#2A1A1A'],
  hero: ['#C9661A', '#A8481A', '#7E3216'],
};

// Angle CSS 160° ≈ du haut-gauche léger vers le bas-droite léger.
const G160 = { start: { x: 0.33, y: 0 }, end: { x: 0.67, y: 1 } };
const G155 = { start: { x: 0.29, y: 0 }, end: { x: 0.71, y: 1 } };

// null = icône par défaut (Soleil, celle déclarée dans app.json → icon/ios.icon/
// android.adaptiveIcon), sinon nom d'alternative déclaré via le plugin
// expo-alternate-app-icons (voir app.json → plugins). Le nom DOIT correspondre
// exactement (PascalCase) à celui déclaré dans la config du plugin.
//
// `legacyName` : avant la 1.0.5 le défaut était Nuit et Soleil était
// l'alternative 'Sun'. Ceux qui l'avaient choisie sont toujours sur cet alias
// (gardé dans app.json : le retirer ferait disparaître leur icône du lanceur
// Android) — on le reconnaît donc comme « Soleil actif ».
type AppIconChoice = {
  key: string; name: string | null; legacyName?: string; source: number;
  labelKey: 'widgets.icon.night' | 'widgets.icon.sun' | 'widgets.icon.fille' | 'widgets.icon.garcon';
  bg: readonly [string, string];
};
const APP_ICON_CHOICES: AppIconChoice[] = [
  { key: 'sun', name: null, legacyName: 'Sun', source: require('../../assets/icon-sun.png'), labelKey: 'widgets.icon.sun', bg: ['#FFE3A6', '#FFB36B'] },
  { key: 'night', name: 'Night', source: require('../../assets/icon.png'), labelKey: 'widgets.icon.night', bg: ['#2A2F6E', '#10143A'] },
  { key: 'garcon', name: 'Garcon', source: require('../../assets/icon-garcon.png'), labelKey: 'widgets.icon.garcon', bg: ['#FFF4E2', '#FFF4E2'] },
  { key: 'fille', name: 'Fille', source: require('../../assets/icon-fille.png'), labelKey: 'widgets.icon.fille', bg: ['#FFF4E2', '#FFF4E2'] },
];

/** Sélecteur d'icône d'app — natif iOS/Android, hors Expo Go. */
function AppIconPicker({ P }: { P: Palette }) {
  const tr = useT();
  const [active, setActive] = useState<string | null | undefined>(undefined); // undefined = pas encore lu
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setActive(getAppIconName());
    } catch (e) {
      console.warn('[app-icons] lecture de l’icône active impossible :', e);
      setActive(null);
    }
  }, []);

  const choose = useCallback(async (choice: AppIconChoice) => {
    if (busy || active === choice.name) return;
    setError(false);
    setBusy(choice.key);
    try {
      await setAlternateAppIcon(choice.name);
      setActive(choice.name);
    } catch (e) {
      // L'UI montre déjà l'échec, mais sans cette trace on ne saurait pas
      // POURQUOI (nom d'icône absent du build, iOS trop ancien, autre).
      console.error('[app-icons] changement vers', choice.name, 'échoué :', e);
      setError(true);
    } finally {
      setBusy(null);
    }
  }, [busy, active]);

  // Les aperçus restent TOUJOURS visibles (images locales) ; si le changement
  // d'icône n'est pas supporté (Expo Go, iOS ancien), ils sont grisés et non
  // cliquables, avec une note explicative.
  return (
    <View>
      <View style={styles.iconGrid}>
        {APP_ICON_CHOICES.map((choice) => {
          const isActive = supportsAlternateIcons
            && (active === choice.name || (choice.legacyName != null && active === choice.legacyName));
          return (
            <Pressable
              key={choice.key}
              style={[styles.iconCell, !supportsAlternateIcons && { opacity: 0.55 }]}
              onPress={() => choose(choice)}
              disabled={busy != null || !supportsAlternateIcons}
            >
              <View style={[styles.iconTile, { borderColor: isActive ? P.accent : 'transparent' }]}>
                <LinearGradient colors={choice.bg} {...G160} style={styles.iconTileInner}>
                  <Image source={choice.source} style={styles.iconImg} />
                  {busy === choice.key && (
                    <View style={styles.iconOverlay}>
                      <ActivityIndicator size="small" color="#fff" />
                    </View>
                  )}
                </LinearGradient>
                {isActive && busy == null && (
                  <View style={[styles.iconCheck, { backgroundColor: P.accent, borderColor: P.bg }]}>
                    <Feather name="check" size={13} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.iconLabel, { color: isActive ? P.ink : P.muted }]}>{tr(choice.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
      {!supportsAlternateIcons && (
        <Text style={[styles.iconNote, { color: P.muted }]}>{tr('widgets.icon.unsupported')}</Text>
      )}
      {error && <Text style={styles.iconError}>{tr('widgets.icon.error')}</Text>}
    </View>
  );
}

// ─── Semaine : jours faits, arrondis fusionnés pour les jours consécutifs ──
function todayIndex(): number {
  const wd = new Date().getDay(); // 0=dim … 6=sam
  return wd === 0 ? 6 : wd - 1;
}

/** Jours faits de la semaine (lun→dim) déduits de la série en cours. */
function weekDone(streak: number): boolean[] {
  const idx = todayIndex();
  return Array.from({ length: 7 }, (_, i) => i <= idx && (idx - i) < Math.min(streak, 7));
}

type DayCell = { done: boolean; today: boolean; pl: number; pr: number; radius: { tl: number; tr: number; br: number; bl: number } };

function weekCells(done: boolean[], big: boolean): DayCell[] {
  const idx = todayIndex();
  const r = big ? 12 : 7;
  return done.map((d, i) => {
    const pd = !!done[i - 1];
    const nd = !!done[i + 1];
    return {
      done: d,
      today: i === idx,
      pl: d && pd ? 0 : 2,
      pr: d && nd ? 0 : 2,
      radius: d
        ? { tl: pd ? 0 : r, tr: nd ? 0 : r, br: nd ? 0 : r, bl: pd ? 0 : r }
        : { tl: r, tr: r, br: r, bl: r },
    };
  });
}

function cellRadius(c: DayCell) {
  return {
    borderTopLeftRadius: c.radius.tl, borderTopRightRadius: c.radius.tr,
    borderBottomRightRadius: c.radius.br, borderBottomLeftRadius: c.radius.bl,
  };
}

function CheckMark({ size = 11 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l5 5 9-10" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Aperçu « Rappel » (petit) ──────────────────────────────────────────────
function ReminderWidget({ reminderHour }: { reminderHour: number }) {
  const tr = useT();
  return (
    <LinearGradient colors={['#8A6CFF', '#5B3FD6']} {...G160} style={pv.small}>
      <View style={pv.rowBetween}>
        <View style={pv.row4}>
          <Feather name="bell" size={12} color="#FFD37A" />
          <Text style={pv.reminderLabel}>{tr('widgets.preview.reminder')}</Text>
        </View>
        <Text style={pv.reminderTime}>{String(reminderHour).padStart(2, '0')}:00</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={pv.reminderMsgRow}>
        <Otter size={52} />
        <Text style={pv.reminderMsg} numberOfLines={2}>{tr('widgets.preview.streakAwaits')}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={pv.reminderPill}>
        <Feather name="clock" size={12} color="#FFD37A" />
        <Text style={pv.reminderPillText}>{tr('widgets.preview.threeMin')}</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Aperçu « Série » (petit) ───────────────────────────────────────────────
function StreakWidget({ streak, done }: { streak: number; done: boolean[] }) {
  const tr = useT();
  const cells = weekCells(done, false);
  return (
    <LinearGradient colors={['#FF9A3D', '#F4633A', '#E5484D']} locations={[0, 0.6, 1]} {...G160} style={pv.small}>
      <View style={pv.streakGhost}><FlameIcon size={96} color="#fff" inner="#fff" /></View>
      <Text style={pv.streakNumber} numberOfLines={1} adjustsFontSizeToFit>{streak}</Text>
      <Text style={pv.streakSub}>{tr('widgets.preview.daysInARow')}</Text>
      <View style={{ flex: 1 }} />
      <View style={pv.row}>
        {cells.map((c, i) => (
          <View key={i} style={{ flex: 1, paddingLeft: c.pl, paddingRight: c.pr }}>
            <View
              style={[
                { height: 14, backgroundColor: c.done ? '#FFFFFF' : 'rgba(255,255,255,0.25)' },
                cellRadius(c),
                c.today && !c.done && { borderWidth: 2, borderColor: '#fff' },
              ]}
            />
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

// ─── Aperçu « Semaine » (moyen) ─────────────────────────────────────────────
function WeekWidget({ streak, xp, done, motivation }: { streak: number; xp: number; done: boolean[]; motivation: string }) {
  const tr = useT();
  const cells = weekCells(done, true);
  const letters = tr('widgets.preview.dayLetters').split('');
  return (
    <View style={pv.medium}>
      <LinearGradient colors={['#FF9A3D', '#F4633A', '#E5484D']} locations={[0, 0.6, 1]} {...G160} style={pv.weekLeft}>
        <FlameIcon size={30} color="#fff" inner="#FFD37A" />
        <Text style={pv.weekStreak} numberOfLines={1} adjustsFontSizeToFit>{streak}</Text>
        <Text style={pv.weekStreakSub}>{tr('widgets.preview.daysInARow')}</Text>
      </LinearGradient>
      <View style={pv.weekRight}>
        <View style={pv.rowBetween}>
          <Text style={pv.weekTitle}>{tr('widgets.preview.weekTitle')}</Text>
          <View style={pv.xpPill}>
            <Feather name="zap" size={11} color="#6B4DFF" />
            <Text style={pv.xpText}>{xp} XP</Text>
          </View>
        </View>
        <View style={[pv.row, { marginTop: 10 }]}>
          {cells.map((c, i) => (
            <View key={i} style={pv.weekCol}>
              <View style={{ alignSelf: 'stretch', paddingLeft: c.pl, paddingRight: c.pr }}>
                {c.done ? (
                  <LinearGradient colors={['#FF9A3D', '#F4633A']} style={[pv.weekCell, cellRadius(c)]}>
                    <CheckMark />
                  </LinearGradient>
                ) : (
                  <View
                    style={[
                      pv.weekCell, cellRadius(c), { backgroundColor: '#EFEDF4' },
                      c.today && { borderWidth: 2, borderColor: '#F4633A' },
                    ]}
                  />
                )}
              </View>
              <Text style={[pv.weekLetter, { color: c.today ? '#F4633A' : '#A4A0B4' }]}>{letters[i]}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <View style={pv.motivPill}>
          <Text style={pv.motivText} numberOfLines={1} adjustsFontSizeToFit>{motivation}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Aperçu « Nom du jour » (petit) ─────────────────────────────────────────
function NameOfDayWidget() {
  const tr = useT();
  const lang = useUserStore((s) => s.language);
  const name = nameOfTheDay();
  return (
    <LinearGradient colors={['#FFFBF2', '#FFF1D6']} {...G160} style={pv.small}>
      <View style={pv.rowBetween}>
        <View style={pv.row4}>
          <Feather name="star" size={11} color="#E0A02C" />
          <Text style={pv.nodLabel}>{tr('widgets.preview.wordOfDay')}</Text>
        </View>
        <Text style={pv.nodCount}>{name.numero}/99</Text>
      </View>
      <View style={{ flex: 1 }} />
      <Text style={pv.nodArabic} numberOfLines={1} adjustsFontSizeToFit>{name.arabe}</Text>
      <Text style={pv.nodTranslit} numberOfLines={1}>{name.translitteration}</Text>
      <Text style={pv.nodFr} numberOfLines={2}>{lang === 'fr' ? name.fr : name.en}</Text>
    </LinearGradient>
  );
}

function WidgetCaption({ P, title, desc }: { P: Palette; title: string; desc: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.capTitle, { color: P.ink }]}>{title}</Text>
      <Text style={[styles.capDesc, { color: P.muted }]}>{desc}</Text>
    </View>
  );
}

type Filter = 'all' | 's' | 'm';

const HOWTO_IOS: I18nKey[] = ['widgets.howTo.ios.1', 'widgets.howTo.ios.2', 'widgets.howTo.ios.3', 'widgets.howTo.ios.4'];
const HOWTO_ANDROID: I18nKey[] = ['widgets.howTo.android.1', 'widgets.howTo.android.2', 'widgets.howTo.android.3', 'widgets.howTo.android.4'];

export default function WidgetsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const P = T.isDark ? DARK : LIGHT;
  const [filter, setFilter] = useState<Filter>('all');

  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const reminderHour = useUserStore((s) => s.reminderHour);
  const done = weekDone(streak);

  const showS = filter !== 'm';
  const showM = filter !== 's';
  const steps = Platform.OS === 'ios' ? HOWTO_IOS : HOWTO_ANDROID;
  const cardShadow = T.isDark ? null : styles.cardShadow;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: tr('widgets.filter.all') },
    { key: 's', label: tr('widgets.filter.small') },
    { key: 'm', label: tr('widgets.filter.medium') },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: P.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ── Héros orange ── */}
        <LinearGradient colors={P.hero} locations={[0, 0.55, 1]} {...G155} style={styles.hero}>
          <View style={[styles.deco, { width: 150, height: 150, top: -40, right: -30 }]} />
          <View style={[styles.deco, { width: 90, height: 90, bottom: 26, right: 70, opacity: 0.6 }]} />
          <DeviceStatusBar />
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color="#B4560A" />
          </Pressable>
          <Text style={styles.heroTitle}>{tr('widgets.title')}</Text>
          <Text style={styles.heroSub}>{tr('widgets.subtitle')}</Text>

          <View style={styles.segment}>
            {FILTERS.map((f) => {
              const sel = filter === f.key;
              return (
                <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[styles.segItem, sel && styles.segItemSel]}>
                  <Text style={[styles.segText, { color: sel ? '#B4560A' : '#fff' }]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {showS && (
            <View style={[styles.card, { backgroundColor: P.card }, cardShadow]}>
              <LinearGradient colors={P.wall} {...G160} style={styles.wall}>
                <ReminderWidget reminderHour={reminderHour} />
                <StreakWidget streak={streak} done={done} />
              </LinearGradient>
              <View style={styles.capRow}>
                <WidgetCaption P={P} title={tr('widgets.continue.title')} desc={tr('widgets.continue.desc')} />
                <WidgetCaption P={P} title={tr('widgets.streak.title')} desc={tr('widgets.streak.desc')} />
              </View>
            </View>
          )}

          {showM && (
            <View style={[styles.card, { backgroundColor: P.card }, cardShadow]}>
              <LinearGradient colors={P.wall} {...G160} style={styles.wall}>
                <WeekWidget streak={streak} xp={xp} done={done} motivation={currentMotivationMsg()} />
              </LinearGradient>
              <View style={styles.capRow}>
                <WidgetCaption P={P} title={tr('widgets.week.title')} desc={tr('widgets.week.desc')} />
              </View>
            </View>
          )}

          {showS && (
            <View style={[styles.card, { backgroundColor: P.card }, cardShadow]}>
              <LinearGradient colors={P.wall} {...G160} style={styles.wall}>
                <NameOfDayWidget />
              </LinearGradient>
              <View style={styles.capRow}>
                <WidgetCaption P={P} title={tr('widgets.wordOfDay.title')} desc={tr('widgets.wordOfDay.desc')} />
              </View>
            </View>
          )}

          {/* ── Icône de l'app ── */}
          <Text style={[styles.sectionTitle, { color: P.ink }]}>{tr('widgets.iconTitle')}</Text>
          <Text style={[styles.sectionSub, { color: P.muted }]}>{tr('widgets.iconSubtitle')}</Text>
          <View style={[styles.card, styles.cardPad, { backgroundColor: P.card }, cardShadow]}>
            <AppIconPicker P={P} />
          </View>

          {/* ── Comment l'ajouter ── */}
          <Text style={[styles.sectionTitle, { color: P.ink }]}>{tr('widgets.howToTitle')}</Text>
          <View style={[styles.card, styles.cardPad, { backgroundColor: P.card, gap: 14 }, cardShadow]}>
            {steps.map((k, i) => (
              <View key={k} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: T.isDark ? 'rgba(255,140,50,0.15)' : '#FFEEDD' }]}>
                  <Text style={[styles.stepNumText, { color: T.isDark ? '#FFA35A' : '#D0660C' }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: P.ink }]}>{tr(k)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  hero: {
    paddingHorizontal: 20, paddingBottom: 22,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden',
  },
  deco: {
    position: 'absolute', borderRadius: 28, borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)', transform: [{ rotate: '24deg' }],
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff', marginTop: 14, lineHeight: 36 },
  heroSub: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 20,
    color: 'rgba(255,255,255,0.92)', marginTop: 2,
  },
  segment: {
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.14)',
    padding: 4, borderRadius: 14, marginTop: 18,
  },
  segItem: { flex: 1, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segItemSel: { backgroundColor: '#fff' },
  segText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13.5 },

  body: { paddingHorizontal: 16, paddingTop: 18, gap: 16 },
  card: { borderRadius: 26, overflow: 'hidden' },
  cardPad: { padding: 18 },
  cardShadow: {
    shadowColor: '#28200A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 2,
  },
  wall: { paddingVertical: 22, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'center', gap: 18 },
  capRow: { flexDirection: 'row', gap: 18, paddingTop: 14, paddingHorizontal: 18, paddingBottom: 16 },
  capTitle: { fontFamily: 'Nunito_900Black', fontSize: 15 },
  capDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 17 },

  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginTop: 8, marginBottom: -10 },
  sectionSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 18, marginBottom: -4 },

  iconGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  iconCell: { alignItems: 'center', gap: 8, width: '25%' },
  iconTile: { width: 74, height: 74, borderRadius: 20, padding: 3, borderWidth: 2.5 },
  iconTileInner: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  iconImg: { width: '100%', height: '100%' },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconCheck: {
    position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  iconLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12.5 },
  iconNote: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 14 },
  iconError: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#FF4B4B', textAlign: 'center', marginTop: 10 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15 },
  stepText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 14.5 },
});

// ─── Styles des aperçus (dimensions de la maquette : 150² et 318×150) ──────
const pv = StyleSheet.create({
  small: { width: 150, height: 150, borderRadius: 24, padding: 13, overflow: 'hidden' },
  medium: { width: 318, height: 150, borderRadius: 24, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#fff' },
  row: { flexDirection: 'row' },
  row4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  reminderLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, color: '#fff' },
  reminderTime: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10.5, color: 'rgba(255,255,255,0.75)' },
  reminderMsgRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reminderMsg: { flex: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, lineHeight: 16, color: '#fff' },
  reminderPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 11, paddingVertical: 7,
  },
  reminderPillText: { fontFamily: 'Nunito_900Black', fontSize: 11, color: '#fff' },

  streakGhost: { position: 'absolute', right: -18, bottom: -10, opacity: 0.16 },
  streakNumber: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 46, lineHeight: 50, color: '#fff', marginTop: 4 },
  streakSub: { fontFamily: 'Nunito_900Black', fontSize: 12, color: 'rgba(255,255,255,0.95)', marginTop: -4 },

  weekLeft: { width: 108, alignItems: 'center', justifyContent: 'center', padding: 8 },
  weekStreak: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 40, lineHeight: 44, color: '#fff', marginTop: 2 },
  weekStreakSub: { fontFamily: 'Nunito_900Black', fontSize: 10.5, color: 'rgba(255,255,255,0.95)', textAlign: 'center' },
  weekRight: { flex: 1, paddingTop: 13, paddingHorizontal: 13, paddingBottom: 12 },
  weekTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 15, color: '#1A1730' },
  xpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: '#EEEAFF',
  },
  xpText: { fontFamily: 'Nunito_900Black', fontSize: 11, color: '#6B4DFF' },
  weekCol: { flex: 1, alignItems: 'center', gap: 4 },
  weekCell: { height: 24, alignItems: 'center', justifyContent: 'center' },
  weekLetter: { fontFamily: 'Nunito_900Black', fontSize: 10 },
  motivPill: { backgroundColor: '#FFF1E6', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  motivText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10.5, color: '#B4560A' },

  nodLabel: { fontFamily: 'Nunito_900Black', fontSize: 10, letterSpacing: 0.5, color: '#E0A02C', textTransform: 'uppercase' },
  nodCount: { fontFamily: 'Nunito_900Black', fontSize: 10, color: '#B07A00' },
  nodArabic: {
    fontFamily: 'ScheherazadeNew_700Bold', fontSize: 38, lineHeight: 50,
    color: '#1A1730', textAlign: 'center', writingDirection: 'rtl',
  },
  nodTranslit: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: '#8A6A2A', textAlign: 'center' },
  nodFr: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, lineHeight: 19, color: '#1A1730', textAlign: 'center', marginTop: 2 },
});
