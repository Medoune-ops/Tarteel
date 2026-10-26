import { Platform } from 'react-native';
import { t, type I18nKey } from '../lib/i18n';
import { computePrayerTimes, computeSunrise, qiblaDirection } from '../constants/prayerTimes';
import { usePrayerStore } from '../store/prayerStore';

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
  /** Horaires de prière pour les widgets « Heures de prière ». Absent tant
   *  qu'aucune position n'a été choisie dans l'écran Prières. */
  prayer?: PrayerWidgetData;
  /** De quoi savoir si la flamme s'est éteinte, même sans rouvrir l'app.
   *  Absent tant que le store ne s'est pas enregistré (tests, web). */
  flame?: FlameWidgetData;
}

export interface FlameWidgetData {
  /** Dernier jour (YYYY-MM-DD, local) où la série a progressé. */
  lastActiveDay: string | null;
  /** Série qui vient de s'éteindre ; 0 tant que rien n'est perdu. */
  lostStreak: number;
  /** Jour (YYYY-MM-DD, local) où la flamme s'est éteinte. */
  lostDay: string | null;
  /** Gels en stock : chacun couvre un jour manqué avant que la flamme s'éteigne. */
  freezes: number;
}

/**
 * Le suivi vit dans userStore, qui importe déjà ce fichier : il s'enregistre
 * ici plutôt que d'être importé (cycle), et chaque synchro le relit.
 */
let flameProvider: (() => FlameWidgetData) | null = null;
export function setFlameProvider(fn: (() => FlameWidgetData) | null) {
  flameProvider = fn;
}

/** Clé d'un créneau : les 5 prières + le chourouq (affiché, jamais « prochaine »). */
export type PrayerWidgetKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerWidgetData {
  /** Ville choisie, ou null pour une position GPS brute (le widget affiche « Ma position »). */
  city: string | null;
  /** Direction de la Qibla en degrés depuis le nord géographique (arrondie). */
  qibla: number;
  /**
   * Créneaux de PRAYER_WIDGET_DAYS jours, dans l'ordre, en secondes epoch.
   * Le widget n'a aucun moyen de recalculer les horaires (la librairie `adhan`
   * est en JS) : on lui en donne d'avance pour qu'il reste juste plusieurs
   * jours sans que l'app soit rouverte. Le widget découpe lui-même par jour
   * selon son fuseau local.
   */
  slots: { k: PrayerWidgetKey; t: number }[];
}

/** Jours d'horaires embarqués : 7 × 6 créneaux = 42 entrées, quelques Ko. */
export const PRAYER_WIDGET_DAYS = 7;

/** Horaires des PRAYER_WIDGET_DAYS prochains jours (aujourd'hui compris). */
export function buildPrayerWidgetData(
  latitude: number,
  longitude: number,
  city: string | null,
  now: Date = new Date(),
): PrayerWidgetData {
  const slots: PrayerWidgetData['slots'] = [];
  for (let d = 0; d < PRAYER_WIDGET_DAYS; d++) {
    // Midi local : évite qu'un passage à l'heure d'été fasse sauter ou doubler un jour.
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, 12);
    const times = computePrayerTimes(latitude, longitude, day);
    const sunrise = computeSunrise(latitude, longitude, day);
    const sec = (date: Date) => Math.round(date.getTime() / 1000);
    slots.push({ k: 'fajr', t: sec(times[0]!.time) });
    slots.push({ k: 'sunrise', t: sec(sunrise) });
    for (const s of times.slice(1)) slots.push({ k: s.name, t: sec(s.time) });
  }
  return { city, qibla: Math.round(qiblaDirection(latitude, longitude)), slots };
}

/** Horaires pour la position enregistrée, ou undefined si aucune position. */
function currentPrayerWidgetData(): PrayerWidgetData | undefined {
  const s = usePrayerStore.getState();
  if (s.latitude == null || s.longitude == null) return undefined;
  try {
    return buildPrayerWidgetData(s.latitude, s.longitude, s.cityName);
  } catch {
    return undefined;
  }
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
    // Recalculé à chaque synchro : l'app et les widgets partagent UN seul
    // JSON, donc chaque écriture doit porter aussi les horaires.
    prayer: currentPrayerWidgetData(),
    flame: flameProvider?.() ?? undefined,
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
