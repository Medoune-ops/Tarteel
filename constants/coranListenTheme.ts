/**
 * Palette et petits utilitaires de l'« Écoute du Coran » (maquette
 * « Tarteel Écoute du Coran ») — partagés par la liste (tajwid.tsx) et le
 * lecteur plein écran (coran-player.tsx).
 */
export type ListenPalette = {
  bg: string; card: string; mini: string; ink: string; muted: string;
  line: string; track: string; accent: string; accentSoft: string; recSel: string;
  hero: readonly [string, string, string];
  art: readonly [string, string, string];
  playerBg: readonly [string, string];
  playerBgEnd: number;
};

export const LISTEN_LIGHT: ListenPalette = {
  bg: '#F4F3F8', card: '#FFFFFF', mini: 'rgba(255,255,255,0.96)', ink: '#1A1730', muted: '#6F6B84',
  line: '#ECEAF3', track: '#E3DFF0', accent: '#6B4DFF', accentSoft: '#EEEAFF', recSel: '#EEEAFF',
  hero: ['#4A31C2', '#6B4DFF', '#8A6CFF'],
  art: ['#9A7DFF', '#6B4DFF', '#4A31C2'],
  playerBg: ['#EEEAFF', '#F4F3F8'], playerBgEnd: 0.45,
};

export const LISTEN_DARK: ListenPalette = {
  bg: '#0C0B12', card: '#17151F', mini: 'rgba(30,27,42,0.97)', ink: '#EEEDF5', muted: '#918DA6',
  line: '#25222F', track: '#2A2638', accent: '#8B70FF', accentSoft: 'rgba(139,112,255,0.15)', recSel: 'rgba(139,112,255,0.15)',
  hero: ['#130D2C', '#22165A', '#33227E'],
  art: ['#7A5CF5', '#5034C8', '#2E1D7A'],
  playerBg: ['#1E1640', '#0C0B12'], playerBgEnd: 0.5,
};

/** Dégradés à 160° et 150° de la maquette (CSS → points start/end). */
export const G160 = { start: { x: 0.33, y: 0 }, end: { x: 0.67, y: 1 } };
export const G150 = { start: { x: 0.25, y: 0 }, end: { x: 0.75, y: 1 } };
export const G140 = { start: { x: 0.18, y: 0 }, end: { x: 0.82, y: 1 } };

/** Avatar (initiales + dégradé) de chaque récitateur de constants/reciters. */
export const RECITER_AVATAR: Record<string, { ini: string; colors: readonly [string, string] }> = {
  basit: { ini: 'AB', colors: ['#7C5BF0', '#4F35C9'] },
  sudais: { ini: 'AS', colors: ['#2BA47D', '#166F55'] },
  salami: { ini: 'MS', colors: ['#F0A41E', '#D0700C'] },
  afasy: { ini: 'MA', colors: ['#4A8FE0', '#2A5CB0'] },
};

/** Formate des secondes en "m:ss". */
export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Forme d'onde décorative de la sourate `numero` : 52 barres pseudo-aléatoires
 * mais stables (même sourate → même forme), enveloppe plus haute au milieu.
 * L'API ne fournit pas l'enveloppe réelle du fichier audio.
 */
export function waveFor(numero: number, count = 52): number[] {
  return Array.from({ length: count }, (_, i) => {
    const x = Math.sin(i * 12.9898 + numero * 7.1) * 43758.5453;
    const r = x - Math.floor(x);
    const env = 0.55 + 0.45 * Math.sin((i / (count - 1)) * Math.PI);
    return Math.round(8 + r * 32 * env);
  });
}
