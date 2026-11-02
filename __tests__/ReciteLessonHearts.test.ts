const mockApiFetch = jest.fn();
jest.mock('../lib/api/client', () => ({
  apiFetch: (...a: unknown[]) => mockApiFetch(...a),
}));

import { reciteLessonStep } from '../lib/api/revision';
import { useUserStore } from '../store/userStore';

const verdict = (over: Record<string, unknown>) => ({
  correct: false, score: 12, heartsLeft: 4, outOfHearts: false, unlimited: false, msUntilNextHeart: 3_600_000, ...over,
});

describe('compteur de cœurs après une récitation de leçon', () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
    useUserStore.setState({ hearts: 5, lastHeartLossAt: null });
  });

  it('une récitation ratée retire le cœur du compteur', async () => {
    mockApiFetch.mockResolvedValue(verdict({}));
    await reciteLessonStep('l1', 's1', 'file://r.m4a');
    expect(useUserStore.getState().hearts).toBe(4);
    expect(useUserStore.getState().lastHeartLossAt).not.toBeNull();
  });

  it('le dernier cœur perdu met le compteur à zéro', async () => {
    useUserStore.setState({ hearts: 1 });
    mockApiFetch.mockResolvedValue(verdict({ heartsLeft: 0, outOfHearts: true }));
    await reciteLessonStep('l1', 's1', 'file://r.m4a');
    expect(useUserStore.getState().hearts).toBe(0);
  });

  it('une récitation réussie ne change pas le compteur', async () => {
    useUserStore.setState({ hearts: 3 });
    mockApiFetch.mockResolvedValue(verdict({ correct: true, score: 95, heartsLeft: 3 }));
    await reciteLessonStep('l1', 's1', 'file://r.m4a');
    expect(useUserStore.getState().hearts).toBe(3);
  });

  it('un compte premium reste à cœurs pleins', async () => {
    useUserStore.setState({ hearts: 5 });
    mockApiFetch.mockResolvedValue(verdict({ heartsLeft: 5, unlimited: true, msUntilNextHeart: 0 }));
    await reciteLessonStep('l1', 's1', 'file://r.m4a');
    expect(useUserStore.getState().hearts).toBe(5);
  });
});
