import { NativeModules, Platform } from 'react-native';
import { t, type I18nKey } from '../lib/i18n';

const APP_GROUP = 'group.com.tarteel.app';

export interface WidgetData {
  streak: number;
  xp: number;
  currentLesson: number;
  lessonProgress: number; // 0-100
  lessonSection: string;
  /** Jours de la semaine actifs (0=lun … 6=dim) */
  activeDays: boolean[];
  motivationMsg: string;
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
  };

  try {
    if (Platform.OS === 'ios') {
      // expo-widget lit les données depuis UserDefaults (App Group)
      NativeModules.ExpoWidget?.setItem(
        'tarteel_widget_data',
        JSON.stringify(data),
        APP_GROUP,
      );
    } else if (Platform.OS === 'android') {
      NativeModules.ExpoWidget?.setItem(
        'tarteel_widget_data',
        JSON.stringify(data),
      );
    }
  } catch (_) {
    // Silencieux en dev web/simulateur
  }
}
