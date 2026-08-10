import { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, Pressable, ScrollView, StyleSheet, Linking, Image, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderPattern from '../../components/HeaderPattern';
import DeviceStatusBar from '../../components/StatusBar';
import Otter from '../../components/Otter';
import { useTheme } from '../../utils/useTheme';
import { useUserStore } from '../../store/userStore';
import { currentMotivationMsg } from '../../utils/widgetData';
import { useT } from '../../lib/i18n';

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
} catch {
  /* Expo Go / module natif absent : on garde les stubs ci-dessus. */
}

// null = icône par défaut (Nuit, celle déclarée dans app.json → icon/ios.icon/
// android.adaptiveIcon), 'Sun' = alternative déclarée via le plugin
// expo-alternate-app-icons (voir app.json → plugins). Le nom DOIT correspondre
// exactement (PascalCase) à celui déclaré dans la config du plugin.
type AppIconChoice = { key: string; name: string | null; source: number; labelKey: 'widgets.icon.night' | 'widgets.icon.sun' };
const APP_ICON_CHOICES: AppIconChoice[] = [
  { key: 'night', name: null, source: require('../../assets/icon.png'), labelKey: 'widgets.icon.night' },
  { key: 'sun', name: 'Sun', source: require('../../assets/icon-sun.png'), labelKey: 'widgets.icon.sun' },
];

/** Sélecteur d'icône d'app (Nuit/Soleil) — natif iOS/Android, hors Expo Go. */
function AppIconPicker() {
  const T = useTheme();
  const tr = useT();
  const [active, setActive] = useState<string | null | undefined>(undefined); // undefined = pas encore lu
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    try { setActive(getAppIconName()); } catch { setActive(null); }
  }, []);

  const choose = useCallback(async (choice: AppIconChoice) => {
    if (busy || active === choice.name) return;
    setError(false);
    setBusy(choice.key);
    try {
      await setAlternateAppIcon(choice.name);
      setActive(choice.name);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }, [busy, active]);

  // On affiche TOUJOURS les aperçus des icônes (ce sont de simples images
  // locales, disponibles partout). Si le changement d'icône n'est pas supporté
  // (Expo Go, iOS ancien), les aperçus restent visibles mais non cliquables
  // (grisés) avec une note explicative — l'utilisateur voit à quoi ressemblent
  // les options même sans pouvoir encore les activer.
  return (
    <View>
      <View style={styles.iconRow}>
        {APP_ICON_CHOICES.map((choice) => {
          const isActive = active === choice.name;
          return (
            <Pressable
              key={choice.key}
              style={[
                styles.iconOption,
                isActive && supportsAlternateIcons && styles.iconOptionActive,
                !supportsAlternateIcons && styles.iconOptionDisabled,
              ]}
              onPress={() => choose(choice)}
              disabled={busy != null || !supportsAlternateIcons}
            >
              <View style={[styles.iconPreviewWrap, isActive && supportsAlternateIcons && styles.iconPreviewWrapActive]}>
                <Image source={choice.source} style={styles.iconPreviewImg} />
                {busy === choice.key && (
                  <View style={styles.iconPreviewOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                {isActive && busy == null && supportsAlternateIcons && (
                  <View style={styles.iconCheckBadge}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.iconOptionLabel, { color: T.text }]}>{tr(choice.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
      {!supportsAlternateIcons && (
        <Text style={[styles.iconUnsupportedNote, { color: T.textSecondary }]}>
          {tr('widgets.icon.unsupported')}
        </Text>
      )}
      {error && <Text style={styles.iconErrorText}>{tr('widgets.icon.error')}</Text>}
    </View>
  );
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function todayIndex(): number {
  const wd = new Date().getDay(); // 0=dim … 6=sam
  return wd === 0 ? 6 : wd - 1;
}

function weekActiveDays(streak: number): boolean[] {
  const idx = todayIndex();
  return Array.from({ length: 7 }, (_, i) => i <= idx && (idx - i) < Math.min(streak, 7));
}

// ─── Preview fidèle du widget natif "Série" (petit, iOS/Android) ───────────
function StreakPreview({ streak }: { streak: number }) {
  const tr = useT();
  const idx = todayIndex();
  const active = weekActiveDays(streak);
  return (
    <LinearGradient colors={['#FF9A3D', '#F5731F', '#E0560E']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} style={pv.streakBox}>
      <Text style={pv.streakGhostFlame}>🔥</Text>
      <View style={pv.streakOtterWrap}><Otter size={60} /></View>
      <View style={pv.streakHeaderRow}>
        <Text style={pv.streakFlame}>🔥</Text>
        <Text style={pv.streakLabel}>{tr('widgets.preview.streakLabel')}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <Text style={pv.streakNumber} numberOfLines={1} adjustsFontSizeToFit>{streak}</Text>
      <Text style={pv.streakSub}>{tr('widgets.preview.daysInARow')}</Text>
      <View style={{ flex: 1 }} />
      <View style={pv.streakDotsRow}>
        {DAYS.map((d, i) => (
          <View key={i} style={pv.streakDotCol}>
            <View style={[
              pv.dotBase,
              i === idx ? pv.dotToday : active[i] ? pv.dotActive : pv.dotInactive,
            ]} />
            <Text style={[pv.streakDayLabel, i === idx && pv.streakDayLabelToday]}>{d}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

// ─── Preview fidèle du widget natif "Reprendre" (petit) ────────────────────
function ContinuePreview({ streak, lesson, progress }: { streak: number; lesson: number; progress: number }) {
  const tr = useT();
  return (
    <LinearGradient colors={['#7E62F2', '#6244DE', '#4E32C4']} start={{ x: 0.8, y: 0 }} end={{ x: 0.2, y: 1 }} style={pv.contBox}>
      <View style={pv.contHeaderRow}>
        <View style={pv.contLessonPill}>
          <Text style={pv.contLessonText}>{tr('widgets.preview.lessonN', { n: lesson })}</Text>
        </View>
        <View style={pv.contStreakRow}>
          <Text style={pv.contFlame}>🔥</Text>
          <Text style={pv.contStreakText}>{streak}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={pv.contOtterWrap}><Otter size={52} /></View>
      <View style={{ flex: 1 }} />
      <View style={pv.contProgressRow}>
        <View style={pv.contProgressTrack}>
          <View style={[pv.contProgressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={pv.contProgressPct}>{progress}%</Text>
      </View>
      <View style={pv.contButton}>
        <Feather name="play" size={11} color="#fff" />
        <Text style={pv.contButtonText}>{tr('widgets.preview.continueBtn')}</Text>
      </View>
    </LinearGradient>
  );
}

// ─── Preview fidèle du widget natif "Ma semaine" (moyen) ───────────────────
function WeekPreview({ streak, xp, motivationMsg }: { streak: number; xp: number; motivationMsg: string }) {
  const tr = useT();
  const idx = todayIndex();
  const active = weekActiveDays(streak);
  return (
    <View style={pv.weekBox}>
      <LinearGradient colors={['#FF9A3D', '#F5731F', '#E0560E']} start={{ x: 0.72, y: 0 }} end={{ x: 0.2, y: 1 }} style={pv.weekHero}>
        <Text style={pv.weekGhostFlame}>🔥</Text>
        <View style={pv.contOtterWrap}><Otter size={36} /></View>
        <Text style={pv.weekHeroNumber}>{streak}</Text>
        <Text style={pv.weekHeroSub}>{tr('widgets.preview.daysInARow')}</Text>
      </LinearGradient>
      <View style={pv.weekRight}>
        <View style={pv.weekTitleRow}>
          <Text style={pv.weekTitle}>{tr('widgets.preview.weekTitle')}</Text>
          <View style={pv.weekXpPill}>
            <Feather name="zap" size={10} color="#6B4DFF" />
            <Text style={pv.weekXpText}>{xp} XP</Text>
          </View>
        </View>
        <View style={pv.weekTimelineRow}>
          {DAYS.map((d, i) => {
            const isToday = i === idx;
            const isActive = active[i];
            return (
              <View key={i} style={pv.weekDotCol}>
                <View style={[
                  pv.weekDot,
                  isToday ? pv.weekDotToday : isActive ? pv.weekDotActive : pv.weekDotInactive,
                ]}>
                  {isToday && <Feather name="play" size={9} color="#6B4DFF" />}
                  {!isToday && isActive && <Text style={pv.weekDotFlame}>🔥</Text>}
                </View>
                <Text style={[pv.weekDayLabel, isToday && pv.weekDayLabelToday]}>{d}</Text>
              </View>
            );
          })}
        </View>
        <View style={{ flex: 1 }} />
        <View style={pv.weekQuoteBox}>
          <Text style={pv.weekQuoteFlame}>🔥</Text>
          <Text style={pv.weekQuoteText} numberOfLines={1} adjustsFontSizeToFit>{motivationMsg}</Text>
        </View>
      </View>
    </View>
  );
}

type WidgetPreview = {
  key: string;
  size: string;
  titleKey: 'widgets.continue.title' | 'widgets.streak.title' | 'widgets.week.title';
  descKey: 'widgets.continue.desc' | 'widgets.streak.desc' | 'widgets.week.desc';
  render: () => React.ReactElement;
};

export default function WidgetsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const currentLesson = useUserStore((s) => s.currentLesson);

  const howTo = Platform.OS === 'ios' ? tr('widgets.howTo.ios') : tr('widgets.howTo.android');

  const WIDGET_PREVIEWS: WidgetPreview[] = [
    { key: 'continue', size: 'S', titleKey: 'widgets.continue.title', descKey: 'widgets.continue.desc', render: () => <ContinuePreview streak={streak} lesson={currentLesson} progress={42} /> },
    { key: 'streak', size: 'S', titleKey: 'widgets.streak.title', descKey: 'widgets.streak.desc', render: () => <StreakPreview streak={streak} /> },
    { key: 'week', size: 'M', titleKey: 'widgets.week.title', descKey: 'widgets.week.desc', render: () => <WeekPreview streak={streak} xp={xp} motivationMsg={currentMotivationMsg()} /> },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <LinearGradient colors={['#FFA733', '#F0820C', '#D96E00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <HeaderPattern width={width} height={180} variant="grid" />
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <View style={styles.headerMedallion}>
          <Text style={styles.headerEmoji}>🧩</Text>
        </View>
        <Text style={styles.headerTitle}>{tr('widgets.title')}</Text>
        <View style={styles.headerRule} />
        <Text style={styles.headerSub}>{tr('widgets.subtitle')}</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {WIDGET_PREVIEWS.map((w) => (
          <View key={w.key} style={[styles.card, { backgroundColor: T.cardBg, borderColor: T.border }]}>
            <View style={styles.previewWrap}>
              {w.render()}
              <View style={styles.sizeBadge}><Text style={styles.sizeBadgeText}>{w.size}</Text></View>
            </View>
            <Text style={[styles.cardTitle, { color: T.text }]}>{tr(w.titleKey)}</Text>
            <Text style={[styles.cardDesc, { color: T.textSecondary }]}>{tr(w.descKey)}</Text>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('widgets.iconTitle')}</Text>
        <Text style={[styles.iconSubtitle, { color: T.textSecondary }]}>{tr('widgets.iconSubtitle')}</Text>
        <AppIconPicker />

        <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('widgets.howToTitle')}</Text>
        <View style={[styles.howToBox, { backgroundColor: T.cardBg, borderColor: T.border }]}>
          <Text style={[styles.howToText, { color: T.text }]}>{howTo}</Text>
        </View>

        <Pressable
          style={[styles.settingsBtn, { backgroundColor: T.isDark ? '#332A14' : '#FFF3CD' }]}
          onPress={() => Linking.openSettings()}
        >
          <Feather name="external-link" size={18} color="#E8A800" />
          <Text style={styles.settingsLabel}>{tr('widgets.openSettings')}</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 16, paddingBottom: 24, paddingHorizontal: 24, alignItems: 'center',
    overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  backBtn: { position: 'absolute', top: 16, left: 16, zIndex: 2 },
  headerMedallion: {
    width: 68, height: 68, borderRadius: 34, marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff', marginTop: 12 },
  headerRule: { width: 46, height: 3, borderRadius: 2, marginTop: 8, backgroundColor: '#fff' },
  headerSub: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)',
    marginTop: 8, textAlign: 'center', paddingHorizontal: 12,
  },

  content: { padding: 18 },
  card: {
    borderRadius: 20, borderWidth: 1.5, padding: 16, marginBottom: 16,
    alignItems: 'center',
  },
  previewWrap: { position: 'relative', marginBottom: 12 },
  sizeBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#1B2333', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  sizeBadgeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#fff' },
  cardTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16 },
  cardDesc: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 2, textAlign: 'center' },

  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginTop: 14, marginBottom: 10 },
  howToBox: { borderRadius: 16, borderWidth: 1.5, padding: 16, width: '100%' },
  howToText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 22 },

  iconSubtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: -6, marginBottom: 14 },
  iconRow: { flexDirection: 'row', gap: 20, justifyContent: 'center' },
  iconOption: { alignItems: 'center', gap: 8 },
  iconOptionActive: {},
  // Aperçu visible mais fonctionnalité pas encore dispo (Expo Go / iOS ancien).
  iconOptionDisabled: { opacity: 0.55 },
  iconUnsupportedNote: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 12, lineHeight: 18,
    textAlign: 'center', marginTop: 12,
  },
  iconPreviewWrap: {
    width: 72, height: 72, borderRadius: 18, overflow: 'hidden',
    borderWidth: 2.5, borderColor: 'transparent',
  },
  iconPreviewWrapActive: { borderColor: '#6B4DFF' },
  iconPreviewImg: { width: '100%', height: '100%' },
  iconPreviewOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconCheckBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9, backgroundColor: '#6B4DFF',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  iconOptionLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  iconErrorText: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#FF4B4B',
    textAlign: 'center', marginTop: 10,
  },

  settingsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 15, marginTop: 18, width: '100%',
  },
  settingsLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#E8A800' },
});

// ─── Styles des previews (dimensions ≈ ratio réel des widgets iOS) ─────────
const SMALL_W = 155;
const SMALL_H = 155;

const pv = StyleSheet.create({
  // Streak (small)
  streakBox: {
    width: SMALL_W, height: SMALL_H, borderRadius: 26, padding: 14,
    overflow: 'hidden',
  },
  streakGhostFlame: {
    position: 'absolute', fontSize: 130, opacity: 0.18,
    left: 40, top: 30,
  },
  streakOtterWrap: { position: 'absolute', top: 8, right: 6, opacity: 0.85 },
  streakHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakFlame: { fontSize: 11 },
  streakLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: '#fff' },
  streakNumber: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 46, color: '#fff', lineHeight: 50 },
  streakSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: 'rgba(255,255,255,0.95)' },
  streakDotsRow: { flexDirection: 'row' },
  streakDotCol: { flex: 1, alignItems: 'center', gap: 3 },
  dotBase: { width: 8, height: 8, borderRadius: 4 },
  dotToday: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  dotActive: { backgroundColor: '#FFE08A' },
  dotInactive: { backgroundColor: 'rgba(255,255,255,0.32)' },
  streakDayLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8, color: 'rgba(255,255,255,0.6)' },
  streakDayLabelToday: { color: '#fff' },

  // Continue (small)
  contBox: {
    width: SMALL_W, height: SMALL_H, borderRadius: 26, padding: 12,
    overflow: 'hidden',
  },
  contHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contLessonPill: {
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  contLessonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, color: '#fff' },
  contStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  contFlame: { fontSize: 11 },
  contStreakText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#fff' },
  contOtterWrap: { alignSelf: 'center' },
  contProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  contProgressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  contProgressFill: { height: 6, borderRadius: 3, backgroundColor: '#34C724' },
  contProgressPct: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, color: '#fff' },
  contButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#34C724', borderRadius: 12, paddingVertical: 8,
  },
  contButtonText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#fff' },

  // Week (medium)
  weekBox: {
    width: SMALL_W * 2 + 12, height: SMALL_H, borderRadius: 26,
    flexDirection: 'row', overflow: 'hidden',
  },
  weekHero: {
    width: 108, alignItems: 'center', justifyContent: 'center', gap: 3, padding: 8,
    overflow: 'hidden',
  },
  weekGhostFlame: {
    position: 'absolute', fontSize: 100, opacity: 0.2,
    left: 20, top: 24,
  },
  weekHeroNumber: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  weekHeroSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, color: 'rgba(255,255,255,0.95)', textAlign: 'center' },
  weekRight: { flex: 1, backgroundColor: '#fff', padding: 12 },
  weekTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  weekTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#1B2333' },
  weekXpPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#EFEBFF', borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2,
  },
  weekXpText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, color: '#6B4DFF' },
  weekTimelineRow: { flexDirection: 'row', alignItems: 'center' },
  weekDotCol: { flex: 1, alignItems: 'center', gap: 3 },
  weekDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weekDotToday: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#6B4DFF' },
  weekDotActive: { backgroundColor: '#F0720F' },
  weekDotInactive: { backgroundColor: '#EFECF7' },
  weekDotFlame: { fontSize: 9 },
  weekDayLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 8, color: '#C2C6CE' },
  weekDayLabelToday: { color: '#6B4DFF' },
  weekQuoteBox: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FFF2E6', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6, marginTop: 8,
  },
  weekQuoteFlame: { fontSize: 11 },
  weekQuoteText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 9.5, color: '#B5571A' },
});
