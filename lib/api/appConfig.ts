import { apiFetch } from './client';

export interface AppConfig {
  paymentsEnabled: boolean;
}

/** GET /config — réglages produit globaux, lecture publique (pas d'auth). */
export function fetchAppConfig(): Promise<AppConfig> {
  return apiFetch<AppConfig>('/config', { auth: false });
}
