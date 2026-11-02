import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

// fetchLesson mock configurable par test.
let mockLesson: unknown = null;
let mockRetryable = true;
const mockFetchLesson = jest.fn((..._a: unknown[]) => Promise.resolve(mockLesson));
const mockAnswerStep = jest.fn((..._a: unknown[]) => Promise.resolve({ correct: true, bonneReponse: 'A' }));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ lessonId: 'lesson1' }),
}));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-audio', () => ({
  useAudioRecorder: () => ({ record: jest.fn(), stop: jest.fn(), uri: null }),
  RecordingPresets: { HIGH_QUALITY: {} },
}));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('../lib/audio/recorder', () => ({
  ensureMicPermission: jest.fn(() => Promise.resolve(true)),
  enterRecordingMode: jest.fn(), exitRecordingMode: jest.fn(),
}));
jest.mock('../constants/sounds', () => ({
  playRemoteAudio: jest.fn(() => true), playRemoteAudioAsync: jest.fn(() => Promise.resolve()),
  stopRemoteAudio: jest.fn(), setRemotePlaybackRate: jest.fn(),
  correctFeedback: jest.fn(), wrongFeedback: jest.fn(),
}));
jest.mock('../constants/letterSounds', () => ({ getLetterSound: jest.fn(() => null) }));
jest.mock('../lib/api', () => ({
  fetchLesson: (...a: unknown[]) => mockFetchLesson(...a),
  answerStep: (...a: unknown[]) => mockAnswerStep(...a),
  reciteLessonStep: jest.fn(() => Promise.resolve({})),
  ApiError: class ApiError extends Error { status = 0; code = ''; },
  isRetryableError: () => mockRetryable,
}));
const mockStore: Record<string, unknown> = { hearts: 5, isPremium: false, voiceEnabled: true };
jest.mock('../store/userStore', () => ({
  useUserStore: Object.assign(
    (sel?: (s: Record<string, unknown>) => unknown) => (typeof sel === 'function' ? sel(mockStore) : mockStore),
    { getState: () => mockStore },
  ),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import LessonPlayScreen from '../app/(app)/lesson/play';
import { LESSON_RESUME_KEY } from '../lib/api/tokens';

// Le chargement enchaîne plusieurs attentes (leçon gardée, puis réseau).
async function flush() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

const WRITTEN_LESSON = {
  id: 'lesson1', titre: 'x',
  steps: [
    { id: 'w0', type: 'written', consigne: 'Question 0', arabe: 'ا', options: [{ id: 'A', text: 'réponse a' }, { id: 'B', text: 'réponse b' }] },
    { id: 'w1', type: 'written', consigne: 'Question 1', arabe: 'ب', options: [{ id: 'A', text: 'réponse c' }, { id: 'B', text: 'réponse d' }] },
  ],
};

async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const target = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label))
    .pop();
  if (!target) throw new Error(`bouton introuvable : ${label}`);
  await act(async () => { await target.props.onPress(); });
  await flush();
}

function storedResume(index: number, correctCount: number) {
  return JSON.stringify({
    lesson: WRITTEN_LESSON, attemptId: 'attempt1', index, correctCount, elapsedMs: 1000, savedAt: Date.now(),
  });
}

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<LessonPlayScreen />); });
  await flush();
  return current!;
}

describe('Écran de leçon (play)', () => {
  beforeEach(() => mockFetchLesson.mockClear());
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('rend la 1re étape (discovery) quand la leçon a des étapes', async () => {
    mockLesson = {
      id: 'lesson1', titre: 'ا ب ت ث',
      steps: [
        { id: 'd0', type: 'discovery', arabe: 'ا', ttsText: 'alif', audioUrl: null, letterKey: 'alif', traduction: 'Alif', translitteration: 'ʾalif' },
      ],
    };
    const r = await renderScreen();
    expect(textOf(r.root)).toContain('Découverte');
  });

  describe('sans connexion', () => {
    const getItem = AsyncStorage.getItem as jest.Mock;
    const setItem = AsyncStorage.setItem as jest.Mock;
    const addEventListener = NetInfo.addEventListener as jest.Mock;

    beforeEach(() => {
      mockLesson = WRITTEN_LESSON;
      mockRetryable = true;
      mockAnswerStep.mockReset();
      mockAnswerStep.mockResolvedValue({ correct: true, bonneReponse: 'A' });
      getItem.mockReset();
      getItem.mockResolvedValue(null);
      setItem.mockClear();
      addEventListener.mockClear();
    });

    it('une réponse sans réseau garde l’étape et se renvoie avec la même clé', async () => {
      mockAnswerStep.mockRejectedValueOnce(new Error('réseau'));
      const r = await renderScreen();
      await press(r, 'réponse a');
      await press(r, 'Valider');

      expect(textOf(r.root)).toContain('Question 0');
      expect(textOf(r.root)).toContain('Connexion perdue');
      expect(textOf(r.root)).not.toContain('Impossible de charger');

      await press(r, 'Réessayer');

      expect(mockAnswerStep).toHaveBeenCalledTimes(2);
      expect(mockAnswerStep.mock.calls[1]).toEqual(mockAnswerStep.mock.calls[0]);
      expect(mockAnswerStep.mock.calls[0][3]).toEqual(expect.stringMatching(/^[A-Za-z0-9_-]{8,128}$/));
      expect(textOf(r.root)).not.toContain('Connexion perdue');
    });

    it('le retour du réseau renvoie la réponse tout seul', async () => {
      mockAnswerStep.mockRejectedValueOnce(new Error('réseau'));
      const r = await renderScreen();
      await press(r, 'réponse a');
      await press(r, 'Valider');

      const listener = addEventListener.mock.calls[0][0];
      await act(async () => { listener({ isConnected: false, isInternetReachable: false }); });
      expect(mockAnswerStep).toHaveBeenCalledTimes(1);

      await act(async () => { listener({ isConnected: true, isInternetReachable: true }); });
      expect(mockAnswerStep).toHaveBeenCalledTimes(2);
      expect(textOf(r.root)).not.toContain('Connexion perdue');
    });

    it('une erreur définitive n’est pas présentée comme une coupure', async () => {
      mockRetryable = false;
      mockAnswerStep.mockRejectedValueOnce(new Error('404'));
      const r = await renderScreen();
      await press(r, 'réponse a');
      await press(r, 'Valider');
      expect(textOf(r.root)).toContain('Impossible de charger');
    });

    it('reprend à l’étape gardée, avec la même tentative', async () => {
      getItem.mockImplementation((k: string) => Promise.resolve(k === LESSON_RESUME_KEY ? storedResume(1, 1) : null));
      const r = await renderScreen();
      expect(textOf(r.root)).toContain('Question 1');

      await press(r, 'réponse c');
      await press(r, 'Valider');
      expect(String(mockAnswerStep.mock.calls[0][3])).toMatch(/^attempt1-/);
    });

    it('rouvre la leçon gardée quand le serveur est injoignable', async () => {
      getItem.mockImplementation((k: string) => Promise.resolve(k === LESSON_RESUME_KEY ? storedResume(1, 1) : null));
      mockFetchLesson.mockRejectedValueOnce(new Error('réseau'));
      const r = await renderScreen();
      expect(textOf(r.root)).toContain('Question 1');
    });

    it('repart de zéro si le contenu de la leçon a changé', async () => {
      getItem.mockImplementation((k: string) => Promise.resolve(k === LESSON_RESUME_KEY ? storedResume(1, 1) : null));
      mockLesson = { ...WRITTEN_LESSON, steps: [{ ...WRITTEN_LESSON.steps[0], id: 'autre' }, WRITTEN_LESSON.steps[1]] };
      const r = await renderScreen();
      expect(textOf(r.root)).toContain('Question 0');
    });

    it('sans réseau et sans copie gardée, propose de réessayer', async () => {
      mockFetchLesson.mockRejectedValueOnce(new Error('réseau'));
      const r = await renderScreen();
      expect(textOf(r.root)).toContain('Impossible de charger');
      await press(r, 'Réessayer');
      expect(textOf(r.root)).toContain('Question 0');
    });

    it('ne garde la progression qu’une fois une étape franchie', async () => {
      const r = await renderScreen();
      expect(setItem.mock.calls.filter(([k]) => k === LESSON_RESUME_KEY)).toHaveLength(0);

      await press(r, 'réponse a');
      await press(r, 'Valider');
      await press(r, 'Continuer');

      const saved = setItem.mock.calls.filter(([k]) => k === LESSON_RESUME_KEY).pop();
      expect(JSON.parse(saved![1])).toMatchObject({ index: 1, correctCount: 1 });
    });
  });

  // RÉGRESSION : si la réponse est mal formée (pas de `steps` — ex. réponse
  // enveloppée `{ lesson }` non déballée), l'écran ne doit PAS planter mais
  // afficher un état propre. (Cause de l'ancienne "render error".)
  it('ne plante pas si la leçon n’a pas de champ steps', async () => {
    mockLesson = { id: 'lesson1', titre: 'x' }; // steps === undefined
    const r = await renderScreen();
    expect(textOf(r.root)).toContain("n'est pas encore disponible");
  });
});
