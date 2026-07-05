/**
 * Récupération de l'utilisateur courant.
 *
 * `GET /me` renvoie déjà la forme PLATE attendue par le store
 * (`serializeUserFlat` côté backend = contrat de BACKEND.md), donc on la passe
 * directement à `hydrateFromBackend`.
 */
import { apiFetch } from './client';
import { clearTokens } from './tokens';
import { useUserStore } from '../../store/userStore';
import type { SourateListItem } from './content';

export interface MeResponse {
  streak: number;
  xp: number;
  hearts: number;
  isPremium: boolean;
  currentLesson: number;
  lastHeartLossAt: number | null;
  gems?: number;
  streakFreezes?: number;
  doubleXpUntil?: number | null;
  sourates?: number;
  precision?: number;
  name?: string;
  email?: string;
  avatar?: string | null;
  onboardingDone?: boolean;
  level?: 'debutant' | 'alphabet' | 'lent' | 'fluent';
  objectif?: 'lire' | 'hifz' | 'tafsir' | 'complet';
  dailyMinutes?: number;
  voiceEnabled?: boolean;
}

export interface OnboardingInput {
  level: 'debutant' | 'alphabet' | 'lent' | 'fluent';
  objectif: 'lire' | 'hifz' | 'tafsir' | 'complet';
  dailyMinutes: number;
  /** Numéros (1–114) des sourates déjà mémorisées → point de départ personnalisé. */
  sourates?: number[];
}

/**
 * `PATCH /me` — persiste les choix du setup (niveau, objectif, minutes) ET
 * marque `onboardingDone: true` côté serveur, pour que la reconnexion ne
 * relance PAS la configuration. Rehydrate le store.
 */
export async function saveOnboarding(input: OnboardingInput): Promise<MeResponse> {
  const data = await apiFetch<MeResponse>('/me', {
    method: 'PATCH',
    json: { ...input, onboardingDone: true },
  });
  useUserStore.getState().hydrateFromBackend(data);
  return data;
}

/** Appelle GET /me et hydrate le store. Renvoie les données brutes. */
export async function fetchMe(): Promise<MeResponse> {
  const data = await apiFetch<MeResponse>('/me');
  useUserStore.getState().hydrateFromBackend(data);
  return data;
}

/**
 * GET /me/activity?month=YYYY-MM — jours RÉELLEMENT actifs du mois (calendrier).
 * Renvoie la liste des jours "YYYY-MM-DD" où l'utilisateur a fait ≥1 leçon.
 */
export async function fetchActivity(month: string): Promise<string[]> {
  const data = await apiFetch<{ month: string; days: string[] }>(
    `/me/activity?month=${month}`,
  );
  return data.days;
}

/**
 * GET /me/sourates — les sourates que l'utilisateur a apprises EN INTÉGRALITÉ
 * (toutes les leçons de leur section terminées). Alimente le badge
 * « Sourates apprises » du profil (liste en lecture seule).
 */
export async function fetchLearnedSourates(): Promise<SourateListItem[]> {
  const data = await apiFetch<{ sourates: SourateListItem[] }>('/me/sourates');
  return data.sourates;
}

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

/**
 * `PATCH /me` — met à jour le profil (nom, avatar). Renvoie la forme plate de
 * /me ; on rehydrate le store pour rester en sync.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<MeResponse> {
  const data = await apiFetch<MeResponse>('/me', { method: 'PATCH', json: input });
  useUserStore.getState().hydrateFromBackend(data);
  return data;
}

export interface UpdateSettingsInput {
  voiceEnabled?: boolean;
  language?: 'fr' | 'en' | 'ar';
}

/**
 * `PATCH /me/settings` — préférences serveur (voix, langue). Renvoie la forme
 * plate de /me ; on rehydrate le store pour rester en sync.
 */
export async function updateSettings(input: UpdateSettingsInput): Promise<MeResponse> {
  const data = await apiFetch<MeResponse>('/me/settings', { method: 'PATCH', json: input });
  useUserStore.getState().hydrateFromBackend(data);
  return data;
}

/**
 * `DELETE /me` — suppression DÉFINITIVE du compte côté serveur (cascade sur
 * toute la progression). Efface ensuite les jetons locaux et vide le store.
 */
export async function deleteAccount(): Promise<void> {
  await apiFetch('/me', { method: 'DELETE' });
  await clearTokens();
  useUserStore.getState().logout();
}
