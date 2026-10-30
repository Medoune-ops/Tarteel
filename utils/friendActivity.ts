import type { FriendActivityView } from '../lib/api';
import type { I18nKey } from '../lib/i18n';

type Tr = (key: I18nKey, vars?: Record<string, string | number>) => string;

/** Phrase d'une réussite dans le fil (mêmes clés que l'écran Activité). */
export function activityLine(tr: Tr, item: FriendActivityView): string {
  const d = (item.data ?? {}) as { nom?: string; days?: number; titre?: string; title?: string; league?: string };
  switch (item.type) {
    case 'sourate_mastered': return tr('friends.activitySourate', { nom: d.nom ?? '' });
    case 'streak_milestone': return tr('friends.activityStreakMilestone', { streak: d.days ?? 0 });
    case 'section_completed': return tr('friends.activitySection', { titre: d.titre ?? '' });
    case 'challenge_won': return tr('friends.activityChallengeWon', { title: d.title ?? '' });
    case 'league_promoted': return tr('friends.activityLeague', { league: d.league ?? '' });
    default: return tr('friends.activityLevel');
  }
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}j`;
}
