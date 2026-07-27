import { apiFetch } from './client';

export interface AppConfigPricing {
  premiumMonthlyPriceEur: number;
  premiumYearlyPriceEur: number;
  premiumFamilyMonthlyPriceEur: number;
  premiumFamilyYearlyPriceEur: number;
  streakRepairPriceEur: number;
  heartRefillPriceEur: number;
  gemPack500PriceEur: number;
  gemPack3000PriceEur: number;
  gemPack7000PriceEur: number;
  gemCostHeartRefill: number;
  gemCostStreakFreeze: number;
  gemCostDoubleXp: number;
}

export interface AppConfig {
  paymentsEnabled: boolean;
  pricing: AppConfigPricing;
}

/** GET /config — réglages produit globaux, lecture publique (pas d'auth). */
export function fetchAppConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>('/config', { auth: false });
}
