import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

// fetchLesson mock configurable par test.
let mockLesson: unknown = null;
const mockFetchLesson = jest.fn((..._a: unknown[]) => Promise.resolve(mockLesson));

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
  answerStep: jest.fn(() => Promise.resolve({ correct: true })),
  reciteLessonStep: jest.fn(() => Promise.resolve({})),
  ApiError: class ApiError extends Error { status = 0; code = ''; },
}));
const mockStore: Record<string, unknown> = { hearts: 5, isPremium: false, voiceEnabled: true };
jest.mock('../store/userStore', () => ({
  useUserStore: Object.assign(
    (sel?: (s: Record<string, unknown>) => unknown) => (typeof sel === 'function' ? sel(mockStore) : mockStore),
    { getState: () => mockStore },
  ),
}));

import LessonPlayScreen from '../app/(app)/lesson/play';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<LessonPlayScreen />); });
  await act(async () => { await Promise.resolve(); });
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

  // RÉGRESSION : si la réponse est mal formée (pas de `steps` — ex. réponse
  // enveloppée `{ lesson }` non déballée), l'écran ne doit PAS planter mais
  // afficher un état propre. (Cause de l'ancienne "render error".)
  it('ne plante pas si la leçon n’a pas de champ steps', async () => {
    mockLesson = { id: 'lesson1', titre: 'x' }; // steps === undefined
    const r = await renderScreen();
    expect(textOf(r.root)).toContain("n'est pas encore disponible");
  });
});
