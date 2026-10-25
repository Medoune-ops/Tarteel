import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockNext = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockPrev = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockSetRate = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockSetRepeat = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockSeek = jest.fn();
let mockPlaying = false;

// L'écran importe tout via le wrapper constants/trackPlayer (jamais le moteur direct).
jest.mock('../constants/trackPlayer', () => ({
  AUDIO_AVAILABLE: true,
  useActiveTrack: () => ({ id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' }),
  useProgress: () => ({ position: 30, duration: 120, buffered: 0 }),
  useIsPlaying: () => ({ playing: mockPlaying }),
  RepeatMode: { Off: 0, Track: 1, Queue: 2 },
  audioControls: {
    play: (...a: unknown[]) => mockPlay(...a),
    pause: (...a: unknown[]) => mockPause(...a),
    skipToNext: (...a: unknown[]) => mockNext(...a),
    skipToPrevious: (...a: unknown[]) => mockPrev(...a),
    setRate: (...a: unknown[]) => mockSetRate(...a),
    setRepeatMode: (...a: unknown[]) => mockSetRepeat(...a),
    seekTo: (...a: unknown[]) => mockSeek(...a),
  },
  getCurrentSourates: () => [
    { numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة', nombreVersets: 7, revelation: 'makkah' },
  ],
}));
const mockVersets = {
  sourate: { numero: 1 },
  versets: Array.from({ length: 7 }, (_, i) => ({
    id: String(i + 1), numero: i + 1, texteArabe: `AR${i + 1}`, audioUrl: null,
    traduction: { texte: `FR${i + 1}`, langue: 'fr', source: 'x' }, translitteration: null, mots: [],
  })),
};
jest.mock('../lib/api', () => ({ fetchVersets: () => Promise.resolve(mockVersets) }));
jest.mock('../lib/api/swr', () => ({ swrFetch: (_k: string, fn: () => Promise<unknown>) => fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', border: '#eee', selectorBg: '#eee', isDark: false }),
}));

import CoranPlayerScreen from '../app/(app)/coran-player';
import { useCoranListenStore } from '../store/coranListenStore';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}
let current: TestRenderer.ReactTestRenderer | undefined;
async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<CoranPlayerScreen />); });
  return current!;
}
function byLabel(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = r.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && n.props?.accessibilityLabel === label).at(0);
  if (!t) throw new Error(`bouton « ${label} » introuvable`);
  return t;
}
async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = byLabel(r, label);
  await act(async () => { await t.props.onPress({ nativeEvent: { locationX: 0 } }); });
}

describe('Lecteur Coran (contrôles)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlaying = false;
    useCoranListenStore.setState({ speed: 1, loop: false, favorites: [] });
  });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('affiche la sourate en cours, le récitateur, le badge et le verset estimé', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('1. Al-Fatiha');
    expect(all).toContain('الفاتحة');
    expect(all).toContain('Abdul Basit');
    expect(all).toContain('MECQUOISE');
    // 30 s / 120 s = 25 % de 7 versets → verset 2.
    expect(all).toContain('Verset 2/7');
    expect(all).toContain('AR2');
    expect(all).toContain('FR2');
  });

  it('à l’arrêt, le bouton central lance la lecture', async () => {
    const r = await renderScreen();
    await press(r, 'Lire');
    expect(mockPlay).toHaveBeenCalled();
    expect(mockPause).not.toHaveBeenCalled();
  });

  it('en cours de lecture, le bouton central met en pause (et non replay)', async () => {
    mockPlaying = true;
    const r = await renderScreen();
    await press(r, 'Pause');
    expect(mockPause).toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('précédent / suivant changent de sourate', async () => {
    const r = await renderScreen();
    await press(r, 'Sourate précédente');
    await press(r, 'Sourate suivante');
    expect(mockPrev).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('le bouton vitesse passe à la vitesse suivante', async () => {
    const r = await renderScreen();
    await press(r, 'Vitesse');
    expect(mockSetRate).toHaveBeenCalledWith(1.25);
    expect(textOf(r.root)).toContain('1.25×');
  });

  it('activer la boucle répète la sourate', async () => {
    const r = await renderScreen();
    mockSetRepeat.mockClear(); // ignore l'appel du useEffect initial
    await press(r, 'Boucle');
    expect(mockSetRepeat).toHaveBeenCalledWith(1);
  });

  it('le cœur ajoute la sourate aux favoris', async () => {
    const r = await renderScreen();
    await press(r, 'Ajouter aux favoris');
    expect(useCoranListenStore.getState().favorites).toEqual([1]);
  });
});
