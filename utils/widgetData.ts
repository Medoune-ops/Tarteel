import { Platform } from 'react-native';
import { t, type I18nKey } from '../lib/i18n';

/**
 * iOS n'a pas besoin de l'App Group ici : c'est le module natif Swift
 * (widgets/ios/TarteelWidgets/Module.swift) qui fixe le suite name et la clé
 * d'écriture. Le dupliquer côté JS ferait courir le risque que les deux
 * valeurs divergent silencieusement.
 */
/** Package Android (≠ bundle iOS : com.tarteel.app était déjà pris sur le Play Store). */
const ANDROID_PACKAGE = 'com.tarteel.sn';

/**
 * `expo-widget` est un module Expo (ExpoModulesCore), PAS un module de l'ancien
 * bridge React Native : il n'apparaît donc jamais dans `NativeModules`. Y accéder
 * par `NativeModules.ExpoWidgets?.setWidgetData(...)` donnait `undefined`, et
 * l'optional chaining avalait l'échec en silence — les widgets restaient bloqués
 * sur leurs valeurs par défaut (série 0, XP 0) alors que l'app croyait écrire.
 *
 * On passe par l'export du package, qui fait le `requireNativeModule('ExpoWidgets')`
 * (avec repli sur le bridge quand le debugger distant est actif). Le require est
 * protégé : sur le web et dans Expo Go, le module natif est absent et un import
 * statique ferait planter le chargement du fichier.
 */
let setWidgetDataNative: ((...args: unknown[]) => void) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  setWidgetDataNative = require('expo-widget').setWidgetData ?? null;
} catch {
  /* Expo Go / web : pas de module natif, la synchro est simplement inopérante. */
}

export interface WidgetData {
  streak: number;
  xp: number;
  currentLesson: number;
  lessonProgress: number; // 0-100
  lessonSection: string;
  /** Jours de la semaine actifs (0=lun … 6=dim) */
  activeDays: boolean[];
  motivationMsg: string;
  /** Heure locale (0-23) du rappel quotidien — miroir de userStore.reminderHour,
   *  affichée sur le widget "Rappel". */
  reminderHour: number;
}

const MOTIVATION_KEYS: I18nKey[] = [
  'widgets.motivation.1', 'widgets.motivation.2', 'widgets.motivation.3', 'widgets.motivation.4',
];

export function currentMotivationMsg(): string {
  const idx = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % MOTIVATION_KEYS.length;
  return t(MOTIVATION_KEYS[idx]!);
}

function getTodayActiveDays(streak: number): boolean[] {
  // On considère que les <streak> derniers jours jusqu'à aujourd'hui sont actifs
  const today = new Date().getDay(); // 0=dim, 1=lun…
  // Convertir en index lun-dim (0=lun … 6=dim)
  const todayIdx = today === 0 ? 6 : today - 1;
  return Array.from({ length: 7 }, (_, i) => {
    const daysAgo = (todayIdx - i + 7) % 7;
    return daysAgo < Math.min(streak, 7) && i <= todayIdx;
  });
}

export function syncWidgetData(params: {
  streak: number;
  xp: number;
  currentLesson: number;
  /** Heure locale (0-23) du rappel quotidien (userStore.reminderHour). */
  reminderHour: number;
}) {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  const activeDays = getTodayActiveDays(params.streak);

  const data: WidgetData = {
    streak: params.streak,
    xp: params.xp,
    currentLesson: params.currentLesson,
    lessonProgress: 42, // sera remplacé par la vraie progression leçon
    lessonSection: 'Alphabet',
    activeDays,
    motivationMsg: currentMotivationMsg(),
    reminderHour: params.reminderHour,
  };

  if (!setWidgetDataNative) return;

  try {
    if (Platform.OS === 'ios') {
      // Le suite name et la clé sont fixés côté Swift (voir Module.swift),
      // l'App Group n'a donc pas à être passé ici.
      setWidgetDataNative(JSON.stringify(data));
    } else if (Platform.OS === 'android') {
      // Le module Android attend `setWidgetData(json, packageName)` : il écrit
      // dans les SharedPreferences "<package>.widgetdata", que lisent les
      // AppWidgetProvider Kotlin.
      setWidgetDataNative(JSON.stringify(data), ANDROID_PACKAGE);
    }
  } catch (_) {
    // Silencieux en dev web/simulateur
  }
}
