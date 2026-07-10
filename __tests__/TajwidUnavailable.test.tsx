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
jest.mock('../constants/trackPlayer', () => ({ AUDIO_AVAILABLE: false, playSurates: jest.fn() }));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', border: '#eee', divider: '#eee', isDark: false }),
}));

import TajwidScreen from '../app/(app)/tajwid';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

it('Tajwid affiche « development build requis » quand l’audio natif est absent (Expo Go)', async () => {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<TajwidScreen />); });
  expect(textOf(r!.root)).toContain('development build');
  act(() => { r?.unmount(); });
});
