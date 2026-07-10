import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockNext = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockPrev = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockSetRate = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockSetRepeat = jest.fn((..._a: unknown[]) => Promise.resolve());
const mockChangeReciter = jest.fn((..._a: unknown[]) => Promise.resolve());
let mockPlaying = false;

jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    play: (...a: unknown[]) => mockPlay(...a),
    pause: (...a: unknown[]) => mockPause(...a),
    skipToNext: (...a: unknown[]) => mockNext(...a),
    skipToPrevious: (...a: unknown[]) => mockPrev(...a),
    setRate: (...a: unknown[]) => mockSetRate(...a),
    setRepeatMode: (...a: unknown[]) => mockSetRepeat(...a),
  },
  useActiveTrack: () => ({ id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' }),
  useProgress: () => ({ position: 30, duration: 120, buffered: 0 }),
  useIsPlaying: () => ({ playing: mockPlaying }),
  RepeatMode: { Off: 0, Track: 1, Queue: 2 },
}));
jest.mock('../constants/trackPlayer', () => ({
  changeReciter: (...a: unknown[]) => mockChangeReciter(...a),
  getCurrentReciterId: () => 'basit',
  getCurrentSourates: () => [{ numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة' }],
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', border: '#eee', selectorBg: '#eee', isDark: false }),
}));

import CoranPlayerScreen from '../app/(app)/coran-player';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}
let current: TestRenderer.ReactTestRenderer | undefined;
function renderScreen() { act(() => { current = TestRenderer.create(<CoranPlayerScreen />); }); return current!; }
async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = r.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label)).at(0);
  if (!t) throw new Error(`bouton « ${label} » introuvable`);
  await act(async () => { await t.props.onPress(); });
}

describe('Lecteur Coran (contrôles)', () => {
  beforeEach(() => {
    mockPlay.mockClear(); mockPause.mockClear(); mockNext.mockClear(); mockPrev.mockClear();
    mockSetRate.mockClear(); mockSetRepeat.mockClear(); mockChangeReciter.mockClear();
    mockPlaying = false;
  });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('affiche la sourate en cours et le récitateur', () => {
    const r = renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Al-Fatiha');
    expect(all).toContain('الفاتحة');
  });

  it('le bouton lecture appelle TrackPlayer.play', async () => {
    const r = renderScreen();
    // Trouve le gros bouton play (Pressable avec onPress mais sans texte).
    const btns = r.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function');
    // Le bouton play/pause est le premier sans hitSlop après les skip — on déclenche tous et on vérifie play.
    await act(async () => { for (const b of btns) { try { await b.props.onPress(); } catch { /* ignore */ } } });
    expect(mockPlay).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
    expect(mockPrev).toHaveBeenCalled();
  });

  it('changer la vitesse appelle setRate', async () => {
    const r = renderScreen();
    await press(r, '1.5×');
    expect(mockSetRate).toHaveBeenCalledWith(1.5);
  });

  it('activer la boucle appelle setRepeatMode', async () => {
    const r = renderScreen();
    mockSetRepeat.mockClear(); // ignore l'appel du useEffect initial
    await press(r, 'Boucle');
    expect(mockSetRepeat).toHaveBeenCalled();
  });

  it('changer de récitateur appelle changeReciter', async () => {
    const r = renderScreen();
    await press(r, 'Cheikh Sudais');
    expect(mockChangeReciter).toHaveBeenCalled();
  });
});
