import { create } from 'zustand';
import { fetchAppConfig } from '../lib/api';

interface AppConfigState {
  /** Faux tant que /config n'a pas répondu — les écrans doivent traiter ce cas
   *  comme "paiements visibles" (fail-open) pour ne jamais casser l'usage
   *  normal à cause d'une panne réseau ponctuelle. */
  loaded: boolean;
  paymentsEnabled: boolean;
  load: () => Promise<void>;
}

/**
 * Réglages produit globaux, réglables depuis le back-office SANS
 * redéploiement (ex: masquer les paiements le temps d'une revue App Store /
 * Play Store). Chargé une fois au démarrage de l'app (voir app/_layout.tsx),
 * PAS persisté : on veut toujours la valeur fraîche du serveur, jamais une
 * ancienne valeur mise en cache sur l'appareil.
 */
export const useAppConfigStore = create<AppConfigState>((set) => ({
  loaded: false,
  paymentsEnabled: true,
  load: async () => {
    try {
      const cfg = await fetchAppConfig();
      set({ paymentsEnabled: cfg.paymentsEnabled, loaded: true });
    } catch {
      // Hors-ligne / erreur réseau au démarrage : on garde le défaut
      // (paiements visibles) plutôt que de bloquer l'app ou de masquer à tort.
      set({ loaded: true });
    }
  },
}));
