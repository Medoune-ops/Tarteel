/**
 * Amis — codes de partage/QR, liste, classement, fil d'activité, défis et
 * boîte de réception d'envois. Tous les endpoints sont préfixés `/me/friends`
 * (voir Tarteelback/src/modules/friends). La page publique de redirection QR
 * vit hors API, sur `/f/:code`.
 */
import { apiFetch } from './client';
import type { AvatarConfig } from '../../components/Avatar';

export interface FriendUser {
  id: string;
  displayName: string;
  username: string | null;
  avatarInitials: string;
  /** Avatar composé par l'ami ; null/absent = initiales. */
  avatarStyle?: AvatarConfig | null;
}

export interface FriendView {
  friendshipId: string;
  user: FriendUser;
  /** Date d'ajout (ISO). */
  since: string;
}

export interface FriendProgressView {
  user: FriendUser;
  streak: number;
  weeklyXp: number;
  masteredSourates: number;
  masteredSourateNumeros: number[];
}

export interface LeaderboardEntry {
  rank: number;
  isMe: boolean;
  user: FriendUser;
  weeklyXp: number;
  streak: number;
}

export type FriendActivityType = 'sourate_mastered' | 'streak_milestone' | 'level_up';

export interface FriendActivityView {
  id: string;
  user: FriendUser;
  type: FriendActivityType;
  data: unknown;
  createdAt: string;
  cheers: number;
  cheeredByMe: boolean;
}

export type ChallengeMetric = 'xp' | 'streak' | 'sourates';

export interface ChallengeParticipantView {
  user: FriendUser;
  progress: number;
  achieved: boolean;
  isMe: boolean;
}

export interface ChallengeView {
  id: string;
  title: string;
  metric: ChallengeMetric;
  targetValue: number;
  startsAt: string;
  endsAt: string;
  status: 'active' | 'ended';
  creator: FriendUser;
  isCreator: boolean;
  participants: ChallengeParticipantView[];
  winnerIds: string[];
}

export interface CreateChallengeInput {
  title: string;
  metric: ChallengeMetric;
  targetValue: number;
  /** Date ISO de fin. */
  endsAt: string;
  friendIds: string[];
}

export type FriendSendType = 'hadith' | 'success' | 'encouragement' | 'reminder';

export interface SendQuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  day: string;
}

export interface FriendInboxMessage {
  id: string;
  type: FriendSendType;
  payload: unknown;
  read: boolean;
  createdAt: string;
  sender: FriendUser;
}

export interface FriendInboxView {
  unread: number;
  messages: FriendInboxMessage[];
}

export interface SendToFriendInput {
  type: FriendSendType;
  collectionId?: string;
  n?: number;
  numero?: number;
  text?: string;
  challengeId?: string;
}

// ── Code de partage ────────────────────────────────────────────────────────

/** GET /me/friends/code — mon code de partage (stable). */
export function fetchFriendCode(): Promise<{ code: string }> {
  return apiFetch('/me/friends/code');
}

/** POST /me/friends/code/regenerate — remplace mon code par un nouveau. */
export function regenerateFriendCode(): Promise<{ code: string }> {
  return apiFetch('/me/friends/code/regenerate', { method: 'POST' });
}

// ── Ajout, liste, progrès ──────────────────────────────────────────────────

/** POST /me/friends/add — ajoute un ami à partir d'un code (saisi ou scanné). */
export function addFriend(code: string): Promise<FriendView> {
  return apiFetch('/me/friends/add', { method: 'POST', json: { code } });
}

/** GET /me/friends — liste de mes amis. */
export async function fetchFriends(): Promise<FriendView[]> {
  const res = await apiFetch<{ friends: FriendView[] }>('/me/friends');
  return res.friends;
}

/** GET /me/friends/:userId/progress — progrès d'un ami. */
export function fetchFriendProgress(userId: string): Promise<FriendProgressView> {
  return apiFetch(`/me/friends/${userId}/progress`);
}

/** DELETE /me/friends/:friendshipId — retire une amitié. */
export function removeFriend(friendshipId: string): Promise<{ removed: true }> {
  return apiFetch(`/me/friends/${friendshipId}`, { method: 'DELETE' });
}

/** POST /me/friends/:userId/block — bloque un utilisateur. */
export function blockFriend(userId: string): Promise<{ blocked: true }> {
  return apiFetch(`/me/friends/${userId}/block`, { method: 'POST' });
}

/** DELETE /me/friends/:userId/block — débloque un utilisateur. */
export function unblockFriend(userId: string): Promise<{ unblocked: true }> {
  return apiFetch(`/me/friends/${userId}/block`, { method: 'DELETE' });
}

/** POST /me/friends/report — signale un utilisateur (motif court). */
export function reportFriend(userId: string, reason: string): Promise<{ reported: true }> {
  return apiFetch('/me/friends/report', { method: 'POST', json: { userId, reason } });
}

// ── Classement & fil d'activité ────────────────────────────────────────────

/** GET /me/friends/leaderboard — classement de la semaine (moi + amis). */
export function fetchFriendsLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  return apiFetch('/me/friends/leaderboard');
}

/** GET /me/friends/activity — réussites de mes amis + les miennes. */
export function fetchFriendsActivity(limit?: number): Promise<{ activity: FriendActivityView[] }> {
  const q = limit ? `?limit=${limit}` : '';
  return apiFetch(`/me/friends/activity${q}`);
}

/** POST /me/friends/activity/:id/cheer — réagit « bravo » (toggle). */
export function cheerActivity(activityId: string): Promise<{ cheered: boolean; cheers: number }> {
  return apiFetch(`/me/friends/activity/${activityId}/cheer`, { method: 'POST' });
}

// ── Défis ──────────────────────────────────────────────────────────────────

/** GET /me/friends/challenges — mes défis. */
export function fetchChallenges(): Promise<{ challenges: ChallengeView[] }> {
  return apiFetch('/me/friends/challenges');
}

/** POST /me/friends/challenges — crée un défi partagé. */
export function createChallenge(input: CreateChallengeInput): Promise<ChallengeView> {
  return apiFetch('/me/friends/challenges', { method: 'POST', json: input });
}

/** GET /me/friends/challenges/:id — détail d'un défi. */
export function fetchChallenge(challengeId: string): Promise<ChallengeView> {
  return apiFetch(`/me/friends/challenges/${challengeId}`);
}

/** DELETE /me/friends/challenges/:id — quitte un défi (définitif). */
export function leaveChallenge(challengeId: string): Promise<{ left: true }> {
  return apiFetch(`/me/friends/challenges/${challengeId}`, { method: 'DELETE' });
}

// ── Envois & boîte de réception ────────────────────────────────────────────

/** GET /me/friends/inbox — messages reçus + compteur non lus. */
export function fetchFriendsInbox(): Promise<FriendInboxView> {
  return apiFetch('/me/friends/inbox');
}

/** GET /me/friends/send-quota — quota d'envoi du jour (3). */
export function fetchSendQuota(): Promise<SendQuotaStatus> {
  return apiFetch('/me/friends/send-quota');
}

/** POST /me/friends/:userId/send — envoie un message à un ami. */
export function sendToFriend(
  userId: string,
  input: SendToFriendInput,
): Promise<{ id: string; quota: SendQuotaStatus }> {
  return apiFetch(`/me/friends/${userId}/send`, { method: 'POST', json: input });
}

/** POST /me/friends/inbox/:id/read — marque un message comme lu. */
export function markFriendMessageRead(messageId: string): Promise<{ read: true }> {
  return apiFetch(`/me/friends/inbox/${messageId}/read`, { method: 'POST' });
}
