import { apiFetch } from '../lib/api/client';
import {
  fetchFriends,
  fetchFriendsLeaderboard,
  fetchFriendsActivity,
  fetchChallenges,
  fetchFriendCode,
  fetchFriendsInbox,
  addFriend,
  sendToFriend,
  cheerActivity,
  resetFriendsIdentity,
} from '../lib/api/friends';

jest.mock('../lib/api/client', () => ({
  apiFetch: jest.fn(),
  ApiError: class ApiError extends Error {},
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

/** Répond selon le chemin appelé ; un chemin inconnu fait échouer le test. */
function routes(table: Record<string, unknown>) {
  mockApiFetch.mockImplementation(async (path: string) => {
    if (!(path in table)) throw new Error(`appel inattendu : ${path}`);
    return table[path] as never;
  });
}

const profile = (id: string, extra: Record<string, unknown> = {}) => ({
  id, displayName: `User ${id}`, username: null, avatarInitials: 'U', avatarStyle: null, ...extra,
});

describe('client API Amis — routes et formats du backend', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    resetFriendsIdentity();
  });

  it('fetchFriendCode lit le code sur /me/referral', async () => {
    routes({ '/me/referral': { code: 'ABC234', referredCount: 0, rewardPerReferral: 1 } });
    await expect(fetchFriendCode()).resolves.toEqual({ code: 'ABC234' });
  });

  it('addFriend envoie une demande par code', async () => {
    mockApiFetch.mockResolvedValue({ accepted: false, friendshipId: 'f1' } as never);
    await expect(addFriend('ABC234')).resolves.toEqual({ accepted: false, friendshipId: 'f1' });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends/requests', { method: 'POST', json: { code: 'ABC234' } });
  });

  it('fetchFriends traduit { items } en liste', async () => {
    routes({ '/me/friends?limit=50': { items: [{ user: profile('u2'), friendsSince: '2026-10-01' }], nextCursor: null } });
    const friends = await fetchFriends();
    expect(friends).toEqual([{ user: profile('u2'), since: '2026-10-01' }]);
  });

  it('fetchFriendsLeaderboard marque ma ligne avec isMe', async () => {
    routes({
      '/me': { id: 'me' },
      '/me/friends/leaderboard': {
        items: [
          { rank: 1, user: profile('u2', { streak: 4, weeklyXp: 90 }), weeklyXp: 90 },
          { rank: 2, user: profile('me', { streak: 2, weeklyXp: 30 }), weeklyXp: 30 },
        ],
      },
    });
    const { entries } = await fetchFriendsLeaderboard();
    expect(entries.map((e) => [e.rank, e.isMe, e.streak])).toEqual([[1, false, 4], [2, true, 2]]);
  });

  it('fetchFriendsActivity lit le fil des réussites', async () => {
    routes({
      '/me/achievements/feed': {
        items: [{
          id: 'a1', type: 'streak_milestone', refKey: 'd7', payload: { days: 7 }, createdAt: '2026-10-01',
          user: profile('u2'), reactionsCount: 2, myReaction: 'bravo',
        }],
      },
    });
    const { activity } = await fetchFriendsActivity();
    expect(activity[0]).toMatchObject({ id: 'a1', type: 'streak_milestone', data: { days: 7 }, cheers: 2, cheeredByMe: true });
  });

  it('cheerActivity retire ma réaction si elle existe', async () => {
    mockApiFetch.mockResolvedValue({ reacted: false } as never);
    const item = { id: 'a1', cheers: 2, cheeredByMe: true } as never;
    await expect(cheerActivity(item)).resolves.toEqual({ cheered: false, cheers: 1 });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/achievements/a1/reaction', { method: 'DELETE' });
  });

  it('fetchChallenges charge le détail de chaque défi', async () => {
    routes({
      '/me': { id: 'me' },
      '/me/challenges?limit=20': { items: [{ id: 'c1' }], nextCursor: null },
      '/me/challenges/c1': {
        id: 'c1', type: 'streak', title: 'Série', status: 'pending', goal: { days: 7 },
        creatorId: 'u2', startsAt: '2026-11-01', endsAt: '2026-11-07', winnerIds: [],
        participants: [
          { userId: 'u2', user: profile('u2'), status: 'accepted', progress: 0, target: 7, reached: false },
          { userId: 'me', user: profile('me'), status: 'invited', progress: 0, target: 7, reached: false },
        ],
      },
    });
    const { challenges } = await fetchChallenges();
    expect(challenges[0]).toMatchObject({
      id: 'c1', metric: 'streak', targetValue: 7, status: 'pending', isCreator: false, myStatus: 'invited',
    });
    expect(challenges[0].creator?.id).toBe('u2');
  });

  it('fetchFriendsInbox lit /me/messages et compte les non lus', async () => {
    routes({
      '/me/messages?limit=50': {
        items: [
          { id: 'm1', sender: profile('u2'), kind: 'encouragement', payload: { key: 'keep_going' }, note: 'Courage', readAt: null, createdAt: '2026-10-01' },
          { id: 'm2', sender: profile('u2'), kind: 'hadith', payload: { collection: 'nawawi', n: 1 }, note: null, readAt: '2026-10-02', createdAt: '2026-10-01' },
        ],
        nextCursor: null,
      },
    });
    const inbox = await fetchFriendsInbox();
    expect(inbox.unread).toBe(1);
    expect(inbox.messages[0]).toMatchObject({ type: 'encouragement', note: 'Courage', read: false });
  });

  it('sendToFriend envoie un encouragement avec la note', async () => {
    mockApiFetch.mockResolvedValue({ sent: 1, recipients: 1 } as never);
    await sendToFriend('u2', { type: 'encouragement', text: ' Bravo ' });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/messages', {
      method: 'POST',
      json: { recipientIds: ['u2'], kind: 'encouragement', payload: { key: 'keep_going' }, note: 'Bravo' },
    });
  });

  it('sendToFriend passe une relance par le nudge du défi', async () => {
    mockApiFetch.mockResolvedValue({ nudged: true } as never);
    await sendToFriend('u2', { type: 'reminder', challengeId: 'c1' });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/challenges/c1/nudge', { method: 'POST', json: { userId: 'u2' } });
  });
});
