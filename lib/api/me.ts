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
  /** Date ISO de fin du Premium effectif (personnel ou familial) ; null = pas de Premium actif. */
  premiumUntil?: string | null;
  currentLesson: number;
  lastHeartLossAt: number | null;
  gems?: number;
  streakFreezes?: number;
  /** Série sauvegardée quand elle s'est cassée = jours récupérés en payant la restauration. */
  lastStreakValue?: number;
  doubleXpUntil?: number | null;
  sourates?: number;
  precision?: number;
  name?: string;
  /** Pseudo public (ligues) ; null pour les comptes créés avant le champ. */
  username?: string | null;
  email?: string;
  avatar?: string | null;
  onboardingDone?: boolean;
  level?: 'debutant' | 'alphabet' | 'lent' | 'fluent';
  objectif?: 'lire' | 'hifz' | 'tafsir' | 'complet';
  dailyMinutes?: number;
  voiceEnabled?: boolean;
  /** Présents uniquement sur la réponse de POST /lesson/complete (voir completeLesson). */
  xpGained?: number;
  /** true si le boost ×2 XP (100 gemmes) était actif pendant CETTE complétion. */
  doubleXpWasActive?: boolean;
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
  /** Pseudo public (ligues) — modifiable depuis Paramètres → Modifier le profil. */
  username?: string;
}

/**
 * `PATCH /me` — met à jour le profil. Renvoie la forme plate de /me ; on
 * rehydrate le store pour rester en sync.
 *
 * ⚠ Mapping obligatoire : le store/front parle de `name`, mais le schéma
 * backend (Zod `.strict()`, anti mass-assignment) n'accepte QUE `displayName`
 * — envoyer `name` tel quel provoquait un 400 et rien ne s'enregistrait.
 * `avatar` n'a pas encore de support serveur : on ne l'envoie pas.
 */
export async function updateProfile(input: UpdateProfileInput): Promise<MeResponse> {
  const payload: { displayName?: string; username?: string } = {};
  if (input.name != null) payload.displayName = input.name;
  if (input.username != null) payload.username = input.username;
  const data = await apiFetch<MeResponse>('/me', { method: 'PATCH', json: payload });
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

export interface NotificationPrefs {
  notifDailyReminder: boolean;
  notifStreakAlert: boolean;
  /** Heure locale préférée (0–23) pour le rappel quotidien. */
  reminderHour: number;
}

/** `GET /me/notifications/preferences` — préférences de notification (source de vérité serveur). */
export async function fetchNotificationPrefs(): Promise<NotificationPrefs> {
  return apiFetch<NotificationPrefs>('/me/notifications/preferences');
}

export interface UpdateNotificationPrefsInput {
  notifDailyReminder?: boolean;
  notifStreakAlert?: boolean;
  reminderHour?: number;
}

/**
 * `PATCH /me/notifications/preferences` — persiste `reminderHour` (0–23, heure
 * locale). Le job `jobs:reminders` (backend, horaire) relit ce champ à chaque
 * passage : aucune reprogrammation manuelle n'est nécessaire côté client, la
 * nouvelle heure est prise en compte dès le prochain tick.
 */
export async function updateNotificationPrefs(
  input: UpdateNotificationPrefsInput,
): Promise<NotificationPrefs> {
  return apiFetch<NotificationPrefs>('/me/notifications/preferences', {
    method: 'PATCH',
    json: input,
  });
}

/**
 * `DELETE /me` — suppression DÉFINITIVE du compte côté serveur (cascade sur
 * toute la progression). Le mot de passe est exigé par le serveur (un access
 * token volé ne suffit pas). Efface ensuite les jetons locaux et vide le store.
 */
export async function deleteAccount(password: string): Promise<void> {
  // skipAuthRetry : un 401 ici signifie "mot de passe incorrect", pas "token
  // expiré" — sans ça, apiFetch tenterait un refresh + une 2e suppression, et
  // déconnecterait l'utilisateur si ce refresh échoue pour une autre raison.
  await apiFetch('/me', { method: 'DELETE', json: { password }, skipAuthRetry: true });
  await clearTokens();
  useUserStore.getState().logout();
}

export interface PendingGift {
  id: string;
  kind: 'hearts' | 'gems' | 'premium';
  amount: number;
}

/**
 * `GET /me/pending-gift` — cadeau admin (cœurs/gemmes/premium) pas encore vu.
 * Pollé par `app/(app)/_layout.tsx` toutes les ~15s tant que l'app est ouverte,
 * pour déclencher la modale cadeau animée sans attendre un push (fonctionne
 * sur Expo Go, pas de build natif requis).
 */
export async function fetchPendingGift(): Promise<PendingGift | null> {
  const data = await apiFetch<{ gift: PendingGift | null }>('/me/pending-gift');
  return data.gift;
}

/** `POST /me/pending-gift/:id/ack` — marque le cadeau vu, pour ne jamais rejouer son animation. */
export async function ackPendingGift(giftId: string): Promise<void> {
  await apiFetch(`/me/pending-gift/${giftId}/ack`, { method: 'POST' });
}
