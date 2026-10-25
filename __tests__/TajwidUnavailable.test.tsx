import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

// RÉGRESSION : dans Expo Go (RNTP natif absent), AUDIO_AVAILABLE = false.
// L'écran Tajwid ne doit PAS planter mais afficher « dev build requis ».
const mockSourates = [{ numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة', nombreVersets: 7 }];

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../lib/api', () => ({ fetchSourates: () => Promise.resolve(mockSourates) }));
jest.mock('../lib/api/swr', () => ({ swrFetch: (_k: string, fn: () => Promise<unknown>) => fn() }));
jest.mock('../constants/trackPlayer', () => ({
  AUDIO_AVAILABLE: false,
  playSurates: jest.fn(),
  changeReciter: jest.fn(),
  getCurrentReciterId: () => 'basit',
  getCurrentSourates: () => [],
  useActiveTrack: () => undefined,
  useProgress: () => ({ position: 0, duration: 0, buffered: 0 }),
  useIsPlaying: () => ({ playing: false }),
  audioControls: {},
  refreshLocalSudaisCache: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../constants/audioDownload', () => ({ fetchSudaisTotalMb: () => Promise.resolve(null) }));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', border: '#eee', divider: '#eee', isDark: false }),
}));

import TajwidScreen from '../app/(app)/tajwid';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

it('Tajwid montre le design (liste + récitateurs) + bannière quand l’audio natif est absent', async () => {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<TajwidScreen />); });
  const all = textOf(r!.root);
  // Le DESIGN reste visible en Expo Go (ce que l'utilisateur veut voir)…
  expect(all).toContain('Écoute du Coran');
  expect(all).toContain('Abdul Basit');
  expect(all).toContain('الفاتحة');
  // …avec une bannière d'aperçu (pas de blocage plein écran).
  expect(all).toContain('development build');
  act(() => { r?.unmount(); });
});
