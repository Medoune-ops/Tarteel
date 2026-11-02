const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((k: string) => Promise.resolve(mockStorage.get(k) ?? null)),
    setItem: jest.fn((k: string, v: string) => { mockStorage.set(k, v); return Promise.resolve(); }),
    removeItem: jest.fn((k: string) => { mockStorage.delete(k); return Promise.resolve(); }),
    multiRemove: jest.fn((keys: string[]) => { keys.forEach((k) => mockStorage.delete(k)); return Promise.resolve(); }),
  },
}));

const mockComplete = jest.fn();
jest.mock('../lib/api/lesson', () => ({
  completeLesson: (...a: unknown[]) => mockComplete(...a),
}));
jest.mock('../lib/emailVerificationRedirect', () => ({ redirectToVerifyEmail: jest.fn() }));

import { ApiError } from '../lib/api/client';
import {
  enqueueCompletion, flushCompletions, hasPendingCompletion, onLessonSynced,
} from '../lib/api/lessonSync';
import { clearTokens } from '../lib/api/tokens';

const offline = () => new ApiError(0, 'réseau');
const lesson = (lessonId: string) => ({ lessonId, correctAnswers: 2, totalAnswers: 2 });

describe('leçons en attente de validation', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockComplete.mockReset();
    mockComplete.mockResolvedValue({ xpGained: 19 });
  });

  it('garde la leçon sans réseau et ne préviens personne', async () => {
    mockComplete.mockRejectedValue(offline());
    const synced = jest.fn();
    const off = onLessonSynced(synced);

    await enqueueCompletion(lesson('a'));
    await flushCompletions();

    expect(await hasPendingCompletion('a')).toBe(true);
    expect(synced).not.toHaveBeenCalled();
    off();
  });

  it('valide la leçon au retour du réseau et prévient l’écran', async () => {
    mockComplete.mockRejectedValueOnce(offline());
    const synced = jest.fn();
    const off = onLessonSynced(synced);

    await enqueueCompletion(lesson('a'));
    await flushCompletions();
    await flushCompletions();

    expect(await hasPendingCompletion('a')).toBe(false);
    expect(synced).toHaveBeenCalledWith('a', { xpGained: 19 });
    off();
  });

  it('une erreur serveur passagère garde aussi la leçon', async () => {
    mockComplete.mockRejectedValue(new ApiError(503, 'indisponible'));
    await enqueueCompletion(lesson('a'));
    await flushCompletions();
    expect(await hasPendingCompletion('a')).toBe(true);
  });

  it('envoie dans l’ordre et s’arrête à la première coupure', async () => {
    await enqueueCompletion(lesson('a'));
    await enqueueCompletion(lesson('b'));
    await enqueueCompletion(lesson('c'));
    mockComplete.mockResolvedValueOnce({}).mockRejectedValueOnce(offline());

    await flushCompletions();

    expect(mockComplete.mock.calls.map(([i]) => i.lessonId)).toEqual(['a', 'b']);
    expect(await hasPendingCompletion('a')).toBe(false);
    expect(await hasPendingCompletion('b')).toBe(true);
    expect(await hasPendingCompletion('c')).toBe(true);
  });

  it('une leçon refusée pour de bon ne bloque pas les suivantes', async () => {
    await enqueueCompletion(lesson('supprimee'));
    await enqueueCompletion(lesson('b'));
    mockComplete.mockRejectedValueOnce(new ApiError(404, 'introuvable'));

    await flushCompletions();

    expect(await hasPendingCompletion('supprimee')).toBe(false);
    expect(await hasPendingCompletion('b')).toBe(false);
    expect(mockComplete).toHaveBeenCalledTimes(2);
  });

  it('deux envois simultanés ne valident la leçon qu’une fois', async () => {
    await enqueueCompletion(lesson('a'));
    await Promise.all([flushCompletions(), flushCompletions()]);
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it('une leçon ajoutée pendant un envoi part aussi', async () => {
    await enqueueCompletion(lesson('a'));
    const first = flushCompletions();
    await enqueueCompletion(lesson('b'));
    await flushCompletions();
    await first;
    expect(await hasPendingCompletion('b')).toBe(false);
  });

  it('une leçon rejouée n’apparaît qu’une fois dans la file', async () => {
    mockComplete.mockRejectedValue(offline());
    await enqueueCompletion(lesson('a'));
    await enqueueCompletion({ ...lesson('a'), correctAnswers: 1 });
    await flushCompletions();
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockComplete.mock.calls[0][0].correctAnswers).toBe(1);
  });

  it('la déconnexion efface la file : un autre compte n’en hérite pas', async () => {
    await enqueueCompletion(lesson('a'));
    await clearTokens();
    await flushCompletions();
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
