import { apiFetch } from '../lib/api/client';
import {
  fetchFriends,
  fetchFriendsLeaderboard,
  fetchFriendsActivity,
  fetchChallenges,
  fetchFriendCode,
  sendToFriend,
} from '../lib/api/friends';

jest.mock('../lib/api/client', () => ({ apiFetch: jest.fn() }));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe('client API Amis — enveloppes de réponse', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('fetchFriends déballle l’enveloppe { friends } en tableau', async () => {
    const friends = [{ friendshipId: 'f1' }, { friendshipId: 'f2' }];
    mockApiFetch.mockResolvedValue({ friends } as never);

    await expect(fetchFriends()).resolves.toEqual(friends);
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends');
  });

  it('fetchFriendsLeaderboard rend l’enveloppe { entries }', async () => {
    const entries = [{ rank: 1, isMe: true }];
    mockApiFetch.mockResolvedValue({ entries } as never);

    await expect(fetchFriendsLeaderboard()).resolves.toEqual({ entries });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends/leaderboard');
  });

  it('fetchFriendsActivity rend l’enveloppe { activity }', async () => {
    const activity = [{ id: 'a1' }];
    mockApiFetch.mockResolvedValue({ activity } as never);

    await expect(fetchFriendsActivity()).resolves.toEqual({ activity });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends/activity');
  });

  it('fetchFriendsActivity passe la limite en query string', async () => {
    mockApiFetch.mockResolvedValue({ activity: [] } as never);
    await fetchFriendsActivity(50);
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends/activity?limit=50');
  });

  it('fetchChallenges rend l’enveloppe { challenges }', async () => {
    const challenges = [{ id: 'c1' }];
    mockApiFetch.mockResolvedValue({ challenges } as never);

    await expect(fetchChallenges()).resolves.toEqual({ challenges });
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends/challenges');
  });

  it('fetchFriendCode rend { code }', async () => {
    mockApiFetch.mockResolvedValue({ code: 'ABC234' } as never);
    await expect(fetchFriendCode()).resolves.toEqual({ code: 'ABC234' });
  });

  it('sendToFriend rend { id, quota }', async () => {
    const res = { id: 'm1', quota: { used: 1, limit: 3, remaining: 2, day: '2026-01-01' } };
    mockApiFetch.mockResolvedValue(res as never);

    await expect(sendToFriend('u2', { type: 'encouragement', text: 'Bravo' })).resolves.toEqual(res);
    expect(mockApiFetch).toHaveBeenCalledWith('/me/friends/u2/send', {
      method: 'POST',
      json: { type: 'encouragement', text: 'Bravo' },
    });
  });
});
