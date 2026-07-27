import { create } from 'zustand';
import { fetchAppConfig, type AppConfigPricing } from '../lib/api';

// Valeurs de repli si /config est injoignable au démarrage — mêmes défauts
// que le schéma backend (AppConfig), pour rester cohérent hors-ligne.
const FALLBACK_PRICING: AppConfigPricing = {
  premiumMonthlyPriceEur: 1.52,
  premiumYearlyPriceEur: 15.24,
  premiumFamilyMonthlyPriceEur: 3.99,
  premiumFamilyYearlyPriceEur: 39.99,
  streakRepairPriceEur: 0.87,
  heartRefillPriceEur: 1.99,
  gemPack500PriceEur: 0.99,
  gemPack3000PriceEur: 4,
  gemPack7000PriceEur: 7,
  gemCostHeartRefill: 350,
  gemCostStreakFreeze: 200,
  gemCostDoubleXp: 100,
};

interface AppConfigState {
  /** Faux tant que /config n'a pas répondu — les écrans doivent traiter ce cas
   *  comme "paiements visibles" (fail-open) pour ne jamais casser l'usage
   *  normal à cause d'une panne réseau ponctuelle. */
  loaded: boolean;
  paymentsEnabled: boolean;
  /** Tarification réelle, modifiable depuis le back-office SANS redéploiement
   *  — voir back-office/Monétisation. Toujours ces valeurs de repli tant que
   *  /config n'a pas répondu. */
  pricing: AppConfigPricing;
  load: () => Promise<void>;
}

/**
 * Réglages produit globaux, réglables depuis le back-office SANS
 * redéploiement (ex: masquer les paiements le temps d'une revue App Store /
 * Play Store, ou changer un prix). Chargé une fois au démarrage de l'app
 * (voir app/_layout.tsx), PAS persisté : on veut toujours la valeur fraîche
 * du serveur, jamais une ancienne valeur mise en cache sur l'appareil.
 */
export const useAppConfigStore = create<AppConfigState>((set) => ({
  loaded: false,
  paymentsEnabled: true,
  pricing: FALLBACK_PRICING,
  load: async () => {
    try {
      const cfg = await fetchAppConfig();
      set({ paymentsEnabled: cfg.paymentsEnabled, pricing: cfg.pricing, loaded: true });
    } catch {
      // Hors-ligne / erreur réseau au démarrage : on garde les défauts
      // (paiements visibles, prix de repli) plutôt que de bloquer l'app.
      set({ loaded: true });
    }
  },
}));
