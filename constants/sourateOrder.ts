/**
 * Ordre d'affichage des sourates : Al-Fatiha (n°1) TOUJOURS en tête, puis toutes
 * les autres en ordre DÉCROISSANT (114 → 2).
 */
export function fatihaFirstThenDesc<T extends { numero: number }>(list: T[]): T[] {
  const fatiha = list.filter((s) => s.numero === 1);
  const rest = list.filter((s) => s.numero !== 1).sort((a, b) => b.numero - a.numero);
  return [...fatiha, ...rest];
}
