/**
 * Données des ligues et de l'historique des podiums (top 3) de l'utilisateur.
 *
 * ⚠️ STRUCTURE MIROIR DE L'API.
 * Reproduit le format que renverra `GET /me/podiums` (historique des semaines
 * où l'utilisateur a fini dans le top 3). Au branchement, remplacer
 * `PODIUMS_HISTORIQUE` par le fetch — l'écran ne change pas.
 */

export type LigueTier = 'bronze' | 'argent' | 'or' | 'emeraude' | 'diamant';

export interface Ligue {
  tier: LigueTier;
  nom: string;
  emoji: string;
  couleur: string;   // accent
  bg: string;        // fond clair
}

export const LIGUES: Record<LigueTier, Ligue> = {
  bronze:   { tier: 'bronze',   nom: 'Ligue Bronze',   emoji: '🥉', couleur: '#B5701F', bg: '#F4E3CE' },
  argent:   { tier: 'argent',   nom: 'Ligue Argent',   emoji: '🥈', couleur: '#7A8595', bg: '#EEF0F4' },
  or:       { tier: 'or',       nom: 'Ligue Or',       emoji: '🥇', couleur: '#E0A02C', bg: '#FBEFD0' },
  emeraude: { tier: 'emeraude', nom: 'Ligue Émeraude', emoji: '💚', couleur: '#1FA873', bg: '#DBF3E8' },
  diamant:  { tier: 'diamant',  nom: 'Ligue Diamant',  emoji: '💎', couleur: '#2C9CE0', bg: '#DEF0FB' },
};

export interface PodiumEntry {
  id: string;
  semaine: number;       // n° de semaine de la ligue
  date: string;          // libellé court (ex: "Mars 2026")
  ligue: LigueTier;
  rang: 1 | 2 | 3;       // position dans le top 3
  xp: number;            // XP accumulés cette semaine-là
}

/** Historique (du plus récent au plus ancien). À remplacer par l'API. */
export const PODIUMS_HISTORIQUE: PodiumEntry[] = [
  { id: 'w23', semaine: 23, date: 'Juin 2026',    ligue: 'or',       rang: 2, xp: 1250 },
  { id: 'w21', semaine: 21, date: 'Juin 2026',    ligue: 'or',       rang: 3, xp: 1080 },
  { id: 'w19', semaine: 19, date: 'Mai 2026',     ligue: 'argent',   rang: 1, xp: 1420 },
  { id: 'w17', semaine: 17, date: 'Mai 2026',     ligue: 'argent',   rang: 1, xp: 1510 },
  { id: 'w15', semaine: 15, date: 'Avril 2026',   ligue: 'argent',   rang: 3, xp: 990  },
  { id: 'w12', semaine: 12, date: 'Mars 2026',    ligue: 'bronze',   rang: 1, xp: 1340 },
  { id: 'w10', semaine: 10, date: 'Mars 2026',    ligue: 'bronze',   rang: 2, xp: 1120 },
  { id: 'w08', semaine: 8,  date: 'Février 2026', ligue: 'bronze',   rang: 1, xp: 1280 },
];

const RANG_LABEL: Record<1 | 2 | 3, string> = { 1: '1ʳᵉ place', 2: '2ᵉ place', 3: '3ᵉ place' };
const RANG_MEDAILLE: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export const podiumRangLabel = (r: 1 | 2 | 3) => RANG_LABEL[r];
export const podiumMedaille = (r: 1 | 2 | 3) => RANG_MEDAILLE[r];
