import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPush = jest.fn();
const mockStoreState: Record<string, unknown> = {
  streak: 3, xp: 120, hearts: 2, gems: 500, isPremium: false,
  syncHearts: jest.fn(),
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useFocusEffect: () => {},
}));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// SVG : chaque élément devient un composant vide (le panorama décoratif).
jest.mock('react-native-svg', () => {
  const React2 = require('react');
  const stub = (name: string) => (props: Record<string, unknown>) =>
    React2.createElement(name, props, props.children as React.ReactNode);
  return new Proxy({ __esModule: true, default: stub('Svg') }, { get: (t, k) => (t as any)[k] ?? stub(String(k)) });
});
jest.mock('../lib/api', () => ({ fetchSections: jest.fn(() => Promise.resolve([])) }));
jest.mock('../lib/api/swr', () => ({ swrFetch: jest.fn((_k: string, fn: () => unknown) => Promise.resolve([])) }));
jest.mock('../lib/api/rewards', () => ({
  fetchDailyChestAvailable: jest.fn(() => Promise.resolve(false)),
  claimDailyChestApi: jest.fn(),
}));
jest.mock('../lib/i18n', () => ({ t: (k: string) => k, useT: () => (k: string) => k }));
jest.mock('../constants/sounds', () => ({ playSound: jest.fn(), preloadSounds: jest.fn() }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    pageBg: '#fff', cardBg: '#fff', text: '#000', isDark: false,
    skyline: '#eee', skylineShadow: '#ddd', lockedBg: '#eee', lockedBorder: '#ddd',
  }),
}));
jest.mock('../store/userStore', () => ({
  MAX_HEARTS: 5,
  // Gère useUserStore() (état complet) ET useUserStore(selector).
  useUserStore: Object.assign(
    (sel?: (s: Record<string, unknown>) => unknown) =>
      typeof sel === 'function' ? sel(mockStoreState) : mockStoreState,
    { getState: () => mockStoreState },
  ),
}));

import ParcoursScreen from '../app/(app)/(tabs)/parcours';

function collectOnPress(node: ReactTestInstance | string, acc: Array<() => void>) {
  if (typeof node === 'string') return;
  if (typeof node.props?.onPress === 'function') acc.push(node.props.onPress);
  (node.children ?? []).forEach((c) => collectOnPress(c, acc));
}

describe('Bouton cœurs du parcours', () => {
  let current: TestRenderer.ReactTestRenderer | undefined;
  beforeEach(() => mockPush.mockClear());
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('le compteur de cœurs navigue vers la page /(app)/hearts', () => {
    act(() => { current = TestRenderer.create(<ParcoursScreen />); });

    // Déclenche tous les onPress rendus (sections vides → le seul bouton de la
    // barre de stats est le compteur de cœurs).
    const handlers: Array<() => void> = [];
    collectOnPress(current!.root, handlers);
    act(() => { handlers.forEach((h) => { try { h(); } catch { /* ignore */ } }); });

    expect(mockPush).toHaveBeenCalledWith('/(app)/hearts');
  });
});
