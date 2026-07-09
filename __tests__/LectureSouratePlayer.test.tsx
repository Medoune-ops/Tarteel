import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

// ── Mocks ──
const mockBack = jest.fn();
const mockPlayAsync = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockStop = jest.fn();
const mockActivateKeepAwake = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockDeactivateKeepAwake = jest.fn();
const mockVersets = {
  sourate: { id: 'a', numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة', nombreVersets: 2, hizb: 1, revelation: 'makkah' },
  lang: 'ar',
  versets: [
    { id: 'v1', numero: 1, texteArabe: 'بِسْمِ اللَّهِ', audioUrl: 'https://cdn/1.mp3', traduction: null, translitteration: null, mots: [] },
    { id: 'v2', numero: 2, texteArabe: 'الْحَمْدُ لِلَّهِ', audioUrl: 'https://cdn/2.mp3', traduction: null, translitteration: null, mots: [] },
  ],
};
const mockFetchVersets = jest.fn((..._a: unknown[]) => Promise.resolve(mockVersets));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ numero: '1' }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: (...a: unknown[]) => mockActivateKeepAwake(...a),
  deactivateKeepAwake: (...a: unknown[]) => mockDeactivateKeepAwake(...a),
}));
jest.mock('../lib/api', () => ({ fetchVersets: (...a: unknown[]) => mockFetchVersets(...a) }));
jest.mock('../lib/api/swr', () => ({
  swrFetch: (_key: string, fetcher: () => Promise<unknown>) => fetcher(),
}));
jest.mock('../constants/sounds', () => ({
  playRemoteAudioAsync: (...a: unknown[]) => mockPlayAsync(...a),
  stopRemoteAudio: (...a: unknown[]) => mockStop(...a),
}));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', isDark: false,
  }),
}));

import LectureSourateScreen from '../app/(app)/lecture/[numero]';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<LectureSourateScreen />); });
  return current!;
}

async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const target = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label))
    .at(0);
  if (!target) throw new Error(`Aucun bouton contenant « ${label} »`);
  await act(async () => { await target.props.onPress(); });
}

describe('Lecteur « Lecture libre » (sourate en entier)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockPlayAsync.mockClear();
    mockStop.mockClear();
    mockActivateKeepAwake.mockClear();
    mockDeactivateKeepAwake.mockClear();
    mockFetchVersets.mockClear();
  });

  afterEach(() => {
    act(() => { current?.unmount(); });
    current = undefined;
  });

  it('affiche les versets en arabe et le bouton d\'écoute', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('الفاتحة');
    expect(all).toContain('بِسْمِ اللَّهِ');
    expect(all).toContain('الْحَمْدُ لِلَّهِ');
    expect(all).toContain('Écouter la sourate en entier');
  });

  it('n\'affiche jamais la traduction (arabe uniquement)', async () => {
    const r = await renderScreen();
    // Les versets mockés n'ont pas de traduction ; l'écran ne doit rien inventer.
    expect(textOf(r.root)).not.toContain('traduction');
  });

  it('lit chaque verset dans l\'ordre et garde l\'écran allumé', async () => {
    const r = await renderScreen();
    await press(r, 'Écouter la sourate en entier');
    expect(mockActivateKeepAwake).toHaveBeenCalled();
    expect(mockPlayAsync).toHaveBeenCalledTimes(2);
    expect(mockPlayAsync).toHaveBeenNthCalledWith(1, 'https://cdn/1.mp3');
    expect(mockPlayAsync).toHaveBeenNthCalledWith(2, 'https://cdn/2.mp3');
    // Fin naturelle → verrou d'écran libéré.
    expect(mockDeactivateKeepAwake).toHaveBeenCalled();
  });

  it('coupe l\'audio et libère l\'écran au démontage', async () => {
    const r = await renderScreen();
    act(() => { r.unmount(); });
    current = undefined;
    expect(mockStop).toHaveBeenCalled();
    expect(mockDeactivateKeepAwake).toHaveBeenCalled();
  });
});
