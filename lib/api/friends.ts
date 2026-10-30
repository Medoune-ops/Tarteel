/**
 * Amis — code de partage, demandes, liste, classement, fil d'activité, défis
 * et boîte de réception. Le backend répartit ces fonctions sur plusieurs
 * modules (voir Tarteelback/docs/API_CONTRACT.md §9-12) :
 *   /me/referral            code de partage (le même code sert aux demandes)
 *   /me/friends             amis, demandes, classement, compteurs
 *   /me/blocks, /me/reports blocages et signalements
 *   /me/achievements        réussites et fil d'activité
 *   /me/messages            boîte de réception
 *   /me/challenges          défis
 * Ce fichier traduit leurs réponses dans les formes qu'utilisent les écrans.
 */
import { apiFetch, ApiError } from './client';
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
  user: FriendUser;
  /** Date d'ajout (ISO). */
  since: string;
}

export interface FriendRequestView {
  id: string;
  user: FriendUser;
  createdAt: string;
}

export interface FriendRequestsView {
  received: FriendRequestView[];
  sent: FriendRequestView[];
}

export interface FriendsSummary {
  pendingRequests: number;
  unreadMessages: number;
  challengeInvites: number;
  activeChallenges: number;
  unseenFeed: number;
}

export interface FriendProgressView {
  user: FriendUser;
  streak: number;
  weeklyXp: number;
  /** Ligue de la semaine (nom backend, ex. « Saphir ») ; vide si aucune. */
  leagueTier: string;
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

export type FriendActivityType =
  | 'sourate_mastered'
  | 'section_completed'
  | 'streak_milestone'
  | 'challenge_won'
  | 'league_promoted';

export interface FriendActivityView {
  id: string;
  user: FriendUser;
  type: FriendActivityType;
  /** Clé de la réussite (n° de sourate, palier…) : identifie un même badge. */
  refKey: string;
  /** `payload` de la réussite (voir API_CONTRACT §9). */
  data: unknown;
  createdAt: string;
  cheers: number;
  cheeredByMe: boolean;
}

export type ChallengeMetric = 'streak' | 'sourates';

export type ChallengeParticipantStatus = 'invited' | 'accepted' | 'declined' | 'left' | 'expired';

export interface ChallengeParticipantView {
  user: FriendUser;
  status: ChallengeParticipantStatus;
  progress: number;
  target: number;
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
  /** pending = pas encore commencé (invitations en cours). */
  status: 'pending' | 'active' | 'ended' | 'cancelled';
  creator: FriendUser | null;
  isCreator: boolean;
  /** Mon statut dans le défi (invited tant que je n'ai pas répondu). */
  myStatus: ChallengeParticipantStatus | null;
  participants: ChallengeParticipantView[];
  winnerIds: string[];
}

export type CreateChallengeInput = {
  title: string;
  durationDays: number;
  friendIds: string[];
} & (
  | { metric: 'streak'; days: number }
  | { metric: 'sourates'; from: number; to: number }
);

export type FriendSendType = 'hadith' | 'success' | 'encouragement' | 'reminder';

export type FriendMessageKind = 'hadith' | 'achievement' | 'encouragement';

export interface FriendInboxMessage {
  id: string;
  type: FriendMessageKind;
  payload: unknown;
  note: string | null;
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

// ── Formes renvoyées par le backend ────────────────────────────────────────

interface Page<T> {
  items: T[];
  nextCursor?: string | null;
}

interface BackendProfile extends FriendUser {
  streak?: number;
  weeklyXp?: number;
  leagueTier?: string;
}

interface BackendAchievement {
  id: string;
  type: FriendActivityType;
  refKey: string;
  payload: unknown;
  createdAt: string;
  user?: FriendUser;
  reactionsCount: number;
  myReaction?: string | null;
}

interface BackendChallengeParticipant {
  userId: string;
  user: BackendProfile | null;
  status: ChallengeParticipantStatus;
  progress: number;
  target: number;
  reached: boolean;
}

interface BackendChallenge {
  id: string;
  type: ChallengeMetric;
  title: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  goal: { days?: number; sourateNumeros?: number[] } | null;
  creatorId: string;
  startsAt: string;
  endsAt: string;
  winnerIds: string[] | null;
  participants: BackendChallengeParticipant[];
}

interface BackendMessage {
  id: string;
  sender: FriendUser;
  kind: FriendMessageKind;
  payload: unknown;
  note: string | null;
  readAt: string | null;
  createdAt: string;
}

function toFriendUser(p: BackendProfile): FriendUser {
  return {
    id: p.id,
    displayName: p.displayName,
    username: p.username ?? null,
    avatarInitials: p.avatarInitials,
    avatarStyle: p.avatarStyle ?? null,
  };
}

// Le store ne garde pas l'id du compte : on le lit une fois sur /me pour
// reconnaître « moi » dans le classement et les défis.
let myIdPromise: Promise<string> | null = null;
function myUserId(): Promise<string> {
  if (!myIdPromise) {
    myIdPromise = apiFetch<{ id: string }>('/me').then((me) => me.id);
    myIdPromise.catch(() => { myIdPromise = null; });
  }
  return myIdPromise;
}

/** À appeler à la déconnexion / au changement de compte. */
export function resetFriendsIdentity(): void {
  myIdPromise = null;
}

// ── Code de partage ────────────────────────────────────────────────────────

/** GET /me/referral — mon code de partage (stable, sert aussi aux demandes d'ami). */
export async function fetchFriendCode(): Promise<{ code: string }> {
  const res = await apiFetch<{ code: string }>('/me/referral');
  return { code: res.code };
}

// ── Demandes, liste, progrès ───────────────────────────────────────────────

/**
 * POST /me/friends/requests — envoie une demande à partir d'un code (saisi ou
 * scanné). `accepted` vaut true si l'autre personne m'avait déjà demandé :
 * nous sommes alors amis tout de suite.
 */
export function addFriend(code: string): Promise<{ accepted: boolean; friendshipId: string }> {
  return apiFetch('/me/friends/requests', { method: 'POST', json: { code } });
}

/** GET /me/friends/requests — demandes reçues et envoyées. */
export function fetchFriendRequests(): Promise<FriendRequestsView> {
  return apiFetch('/me/friends/requests');
}

/** POST /me/friends/requests/:id/accept */
export function acceptFriendRequest(requestId: string): Promise<{ accepted: true }> {
  return apiFetch(`/me/friends/requests/${requestId}/accept`, { method: 'POST' });
}

/** POST /me/friends/requests/:id/decline */
export function declineFriendRequest(requestId: string): Promise<{ declined: true }> {
  return apiFetch(`/me/friends/requests/${requestId}/decline`, { method: 'POST' });
}

/** GET /me/friends/summary — compteurs (demandes, messages non lus…). */
export function fetchFriendsSummary(): Promise<FriendsSummary> {
  return apiFetch('/me/friends/summary');
}

/** GET /me/friends — liste de mes amis (première page de 50). */
export async function fetchFriends(): Promise<FriendView[]> {
  const res = await apiFetch<Page<{ user: BackendProfile; friendsSince: string }>>('/me/friends?limit=50');
  return res.items.map((f) => ({ user: toFriendUser(f.user), since: f.friendsSince }));
}

/** GET /me/friends/:userId — profil et progrès d'un ami. */
export async function fetchFriendProgress(userId: string): Promise<FriendProgressView> {
  const res = await apiFetch<{ user: BackendProfile; masteredSourates: { numero: number }[] }>(
    `/me/friends/${userId}`,
  );
  return {
    user: toFriendUser(res.user),
    streak: res.user.streak ?? 0,
    weeklyXp: res.user.weeklyXp ?? 0,
    leagueTier: res.user.leagueTier ?? '',
    masteredSourates: res.masteredSourates.length,
    masteredSourateNumeros: res.masteredSourates.map((s) => s.numero),
  };
}

/** DELETE /me/friends/:userId — retire un ami. */
export function removeFriend(userId: string): Promise<{ removed: true }> {
  return apiFetch(`/me/friends/${userId}`, { method: 'DELETE' });
}

/** POST /me/blocks/:userId — bloque un utilisateur. */
export function blockFriend(userId: string): Promise<{ blocked: true }> {
  return apiFetch(`/me/blocks/${userId}`, { method: 'POST' });
}

/** DELETE /me/blocks/:userId — débloque un utilisateur. */
export function unblockFriend(userId: string): Promise<{ unblocked: true }> {
  return apiFetch(`/me/blocks/${userId}`, { method: 'DELETE' });
}

/** POST /me/reports — signale un utilisateur ; le texte libre part en `details`. */
export function reportFriend(userId: string, reason: string): Promise<{ reported: true }> {
  return apiFetch('/me/reports', {
    method: 'POST',
    json: {
      targetUserId: userId,
      targetKind: 'user',
      targetRef: userId,
      reason: 'other',
      details: reason.slice(0, 500),
    },
  });
}

// ── Classement & fil d'activité ────────────────────────────────────────────

/** GET /me/friends/leaderboard — classement de la semaine (moi + amis). */
export async function fetchFriendsLeaderboard(): Promise<{ entries: LeaderboardEntry[] }> {
  const [res, meId] = await Promise.all([
    apiFetch<Page<{ rank: number; user: BackendProfile; weeklyXp: number }>>('/me/friends/leaderboard'),
    myUserId(),
  ]);
  return {
    entries: res.items.map((e) => ({
      rank: e.rank,
      isMe: e.user.id === meId,
      user: toFriendUser(e.user),
      weeklyXp: e.weeklyXp,
      streak: e.user.streak ?? 0,
    })),
  };
}

/** GET /me/achievements/feed — réussites de mes amis. */
export async function fetchFriendsActivity(): Promise<{ activity: FriendActivityView[] }> {
  const res = await apiFetch<Page<BackendAchievement>>('/me/achievements/feed');
  return {
    activity: res.items
      .filter((a): a is BackendAchievement & { user: FriendUser } => !!a.user)
      .map((a) => ({
        id: a.id,
        user: toFriendUser(a.user),
        type: a.type,
        refKey: a.refKey,
        data: a.payload,
        createdAt: a.createdAt,
        cheers: a.reactionsCount,
        cheeredByMe: a.myReaction != null,
      })),
  };
}

/** GET /me/achievements — mes réussites, réduites à leur clé `type:refKey`. */
export async function fetchMyAchievementKeys(): Promise<Set<string>> {
  const res = await apiFetch<Page<BackendAchievement>>('/me/achievements');
  return new Set(res.items.map((a) => `${a.type}:${a.refKey}`));
}

/** PUT / DELETE /me/achievements/:id/reaction — « bravo » en bascule. */
export async function cheerActivity(item: FriendActivityView): Promise<{ cheered: boolean; cheers: number }> {
  if (item.cheeredByMe) {
    await apiFetch(`/me/achievements/${item.id}/reaction`, { method: 'DELETE' });
    return { cheered: false, cheers: Math.max(0, item.cheers - 1) };
  }
  await apiFetch(`/me/achievements/${item.id}/reaction`, { method: 'PUT', json: { kind: 'bravo' } });
  return { cheered: true, cheers: item.cheers + 1 };
}

// ── Défis ──────────────────────────────────────────────────────────────────

function toChallengeView(c: BackendChallenge, meId: string): ChallengeView {
  const participants: ChallengeParticipantView[] = c.participants
    .filter((p): p is BackendChallengeParticipant & { user: BackendProfile } => !!p.user)
    .map((p) => ({
      user: toFriendUser(p.user),
      status: p.status,
      progress: p.progress,
      target: p.target,
      achieved: p.reached,
      isMe: p.userId === meId,
    }));
  const me = participants.find((p) => p.isMe);
  const goalTarget = c.type === 'streak' ? c.goal?.days ?? 0 : c.goal?.sourateNumeros?.length ?? 0;
  return {
    id: c.id,
    title: c.title ?? '',
    metric: c.type,
    targetValue: me?.target || goalTarget,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    status: c.status === 'completed' ? 'ended' : c.status,
    creator: participants.find((p) => p.user.id === c.creatorId)?.user ?? null,
    isCreator: c.creatorId === meId,
    myStatus: me?.status ?? null,
    participants,
    winnerIds: c.winnerIds ?? [],
  };
}

/**
 * GET /me/challenges puis GET /me/challenges/:id pour chacun : la liste ne
 * porte pas les participants, et le détail recalcule la progression.
 */
export async function fetchChallenges(): Promise<{ challenges: ChallengeView[] }> {
  const [list, meId] = await Promise.all([
    apiFetch<Page<{ id: string }>>('/me/challenges?limit=20'),
    myUserId(),
  ]);
  const details = await Promise.all(
    list.items.map((c) => apiFetch<BackendChallenge>(`/me/challenges/${c.id}`)),
  );
  return {
    challenges: details
      .map((c) => toChallengeView(c, meId))
      .filter((c) => c.status !== 'cancelled' && c.myStatus !== 'declined' && c.myStatus !== 'left'),
  };
}

/** POST /me/challenges — crée un défi (il commence demain à 00:00). */
export function createChallenge(input: CreateChallengeInput): Promise<{ id: string }> {
  const goal = input.metric === 'streak'
    ? { days: input.days }
    : { from: input.from, to: input.to };
  return apiFetch('/me/challenges', {
    method: 'POST',
    json: {
      type: input.metric,
      goal,
      durationDays: input.durationDays,
      title: input.title,
      inviteeIds: input.friendIds,
    },
  });
}

/** GET /me/challenges/:id — détail d'un défi. */
export async function fetchChallenge(challengeId: string): Promise<ChallengeView> {
  const [c, meId] = await Promise.all([
    apiFetch<BackendChallenge>(`/me/challenges/${challengeId}`),
    myUserId(),
  ]);
  return toChallengeView(c, meId);
}

/** POST /me/challenges/:id/accept — accepter une invitation (avant le début). */
export function acceptChallenge(challengeId: string): Promise<unknown> {
  return apiFetch(`/me/challenges/${challengeId}/accept`, { method: 'POST' });
}

/** POST /me/challenges/:id/decline — refuser une invitation (avant le début). */
export function declineChallenge(challengeId: string): Promise<unknown> {
  return apiFetch(`/me/challenges/${challengeId}/decline`, { method: 'POST' });
}

/** POST /me/challenges/:id/leave — quitter un défi (définitif). */
export function leaveChallenge(challengeId: string): Promise<unknown> {
  return apiFetch(`/me/challenges/${challengeId}/leave`, { method: 'POST' });
}

/** POST /me/challenges/:id/cancel — annuler (créateur, avant le début). */
export function cancelChallenge(challengeId: string): Promise<unknown> {
  return apiFetch(`/me/challenges/${challengeId}/cancel`, { method: 'POST' });
}

// ── Envois & boîte de réception ────────────────────────────────────────────

/** GET /me/messages — messages reçus ; `unread` compte la première page. */
export async function fetchFriendsInbox(): Promise<FriendInboxView> {
  const res = await apiFetch<Page<BackendMessage>>('/me/messages?limit=50');
  const messages = res.items.map((m) => ({
    id: m.id,
    type: m.kind,
    payload: m.payload,
    note: m.note,
    read: m.readAt != null,
    createdAt: m.createdAt,
    sender: toFriendUser(m.sender),
  }));
  return { unread: messages.filter((m) => !m.read).length, messages };
}

/** Id de la réussite « sourate maîtrisée » à partager (le serveur exige l'id). */
async function sourateAchievementId(numero: number): Promise<string> {
  const res = await apiFetch<Page<BackendAchievement>>('/me/achievements');
  const found = res.items.find((a) => a.type === 'sourate_mastered' && a.refKey === String(numero));
  if (!found) throw new ApiError(404, 'Réussite introuvable.', undefined, 'NOT_FOUND');
  return found.id;
}

/**
 * Envoie quelque chose à un ami. Une relance de défi passe par
 * POST /me/challenges/:id/nudge ; le reste par POST /me/messages.
 * Quota serveur : 3 envois par jour (30 en Premium), relances comprises.
 */
export async function sendToFriend(userId: string, input: SendToFriendInput): Promise<void> {
  if (input.type === 'reminder') {
    await apiFetch(`/me/challenges/${input.challengeId}/nudge`, { method: 'POST', json: { userId } });
    return;
  }
  const note = input.text?.trim().slice(0, 140) || undefined;
  let body: { kind: FriendMessageKind; payload: Record<string, unknown> };
  if (input.type === 'hadith') {
    body = { kind: 'hadith', payload: { collection: input.collectionId, n: input.n } };
  } else if (input.type === 'success') {
    body = { kind: 'achievement', payload: { achievementId: await sourateAchievementId(input.numero!) } };
  } else {
    body = { kind: 'encouragement', payload: { key: 'keep_going' } };
  }
  await apiFetch('/me/messages', {
    method: 'POST',
    json: { recipientIds: [userId], ...body, ...(note ? { note } : {}) },
  });
}

/** POST /me/messages/:id/read — marque un message comme lu. */
export function markFriendMessageRead(messageId: string): Promise<{ read: true }> {
  return apiFetch(`/me/messages/${messageId}/read`, { method: 'POST' });
}
