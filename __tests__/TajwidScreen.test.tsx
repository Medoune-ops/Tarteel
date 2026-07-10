import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockPlaySurates = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockSourates = [
  { numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة', nombreVersets: 7 },
  { numero: 2, nom: 'Al-Baqara', nomArabe: 'البقرة', nombreVersets: 286 },
];
const mockFetch = jest.fn((..._a: unknown[]) => Promise.resolve(mockSourates));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../lib/api', () => ({ fetchSourates: (...a: unknown[]) => mockFetch(...a) }));
jest.mock('../lib/api/swr', () => ({ swrFetch: (_k: string, fn: () => Promise<unknown>) => fn() }));
// Mocke trackPlayer -> évite de charger react-native-track-player (natif).
jest.mock('../constants/trackPlayer', () => ({ playSurates: (...a: unknown[]) => mockPlaySurates(...a) }));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999',
    border: '#eee', divider: '#eee', isDark: false,
  }),
}));

import TajwidScreen from '../app/(app)/tajwid';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;
async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<TajwidScreen />); });
  return current!;
}
async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = r.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label)).at(0);
  if (!t) throw new Error(`bouton « ${label} » introuvable`);
  await act(async () => { await t.props.onPress(); });
}

describe('Écran Tajwid (écoute du Coran)', () => {
  beforeEach(() => { mockPush.mockClear(); mockPlaySurates.mockClear(); mockFetch.mockClear(); });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('affiche le titre, les 4 récitateurs et les sourates', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Écoute du Coran');
    expect(all).toContain('Abdul Basit');
    expect(all).toContain('Cheikh Sudais');
    expect(all).toContain('Mansour Al Salami');
    expect(all).toContain('Mishary Alafasy');
    expect(all).toContain('الفاتحة');
  });

  it('taper une sourate lance la lecture et ouvre le lecteur', async () => {
    const r = await renderScreen();
    await press(r, 'الفاتحة');
    expect(mockPlaySurates).toHaveBeenCalled();
    // 3e argument = index de départ (0 pour Al-Fatiha).
    expect(mockPlaySurates.mock.calls[0][2]).toBe(0);
    expect(mockPush).toHaveBeenCalledWith('/(app)/coran-player');
  });
});
