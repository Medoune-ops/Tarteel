/**
 * Réécriture des liens entrants (`tarteel://…`) avant qu'Expo Router ne route.
 *
 * Les widgets ouvrent l'app sur un écran précis (prières, série, lecture,
 * 99 noms). App déjà lancée : le lien est suivi tel quel. Mais au démarrage à
 * FROID, router directement sur l'écran saute `splash.tsx` — qui restaure la
 * session et masque le splash natif — et l'app restait bloquée sur l'accueil
 * au lieu d'afficher la page demandée. On passe donc par le splash en lui
 * confiant la destination (`next`) ; il l'ouvre une fois la session prête,
 * par-dessus le parcours pour que « retour » ramène dans l'app.
 */
export const WIDGET_TARGETS = ['/prieres', '/streak', '/lecture-libre', '/asma'] as const;
export type WidgetTarget = (typeof WIDGET_TARGETS)[number];

export function isWidgetTarget(path: string): path is WidgetTarget {
  return (WIDGET_TARGETS as readonly string[]).includes(path);
}

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  try {
    if (!initial) return path;
    // `tarteel://prieres` ou `/prieres` → `/prieres` (sans requête ni slash final).
    const route = '/' + path.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^\/+/, '').split(/[?#]/)[0]!.replace(/\/+$/, '');
    return isWidgetTarget(route) ? `/splash?next=${encodeURIComponent(route)}` : path;
  } catch {
    return path;
  }
}
