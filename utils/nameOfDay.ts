import { ASMA_UL_HUSNA, type AsmaName } from '../constants/asmaulHusna';

/**
 * Date d'ancrage : jour 1 = premier des 99 noms (Ar-Rahmān). Doit être
 * identique au ANCHOR_DAY_MS du widget Swift (WordOfDayWidget.swift) pour
 * que l'app et le widget natif affichent toujours le même nom le même jour.
 */
const ANCHOR = Date.UTC(2024, 0, 1); // 1er janvier 2024, minuit UTC
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Nom d'Allah du jour : avance de 1 par jour calendaire (UTC), boucle sur
 * les 99 noms indéfiniment (jour 100 -> nom n°1, etc.).
 */
export function nameOfTheDay(date: Date = new Date()): AsmaName {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceAnchor = Math.floor((today - ANCHOR) / MS_PER_DAY);
  // Modulo toujours positif même pour des dates antérieures à l'ancre.
  const index = ((daysSinceAnchor % 99) + 99) % 99;
  return ASMA_UL_HUSNA[index]!;
}
