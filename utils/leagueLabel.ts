import { t, type I18nKey } from '../lib/i18n';

/** Libellé de ligue traduit à partir du nom backend (français). */
const LEAGUE_NAME_KEYS: Record<string, I18nKey> = {
  bronze: 'ligues.name.bronze', argent: 'ligues.name.argent', or: 'ligues.name.or',
  emeraude: 'ligues.name.emeraude', saphir: 'ligues.name.saphir', rubis: 'ligues.name.rubis',
  diamant: 'ligues.name.diamant',
};

export function leagueLabel(nom?: string | null): string | null {
  if (!nom) return null;
  const key = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return LEAGUE_NAME_KEYS[key] ? t(LEAGUE_NAME_KEYS[key]!) : nom;
}
