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

// L'écran importe tout via le wrapper constants/trackPlayer (jamais RNTP direct).
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
  },
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

  /**
   * Signalé sur Android : « quand on met sur pause l'affichage ne le montre
   * pas ». Le bouton doit refléter l'état réel du lecteur, et rebasculer en
   * lecture au second appui — sinon l'utilisateur ne sait plus où il en est.
   */
  it("affiche l'icône pause pendant la lecture, play à l'arrêt", () => {
    mockPlaying = true;
    const r1 = renderScreen();
    const pauseIcons = r1.root.findAll(
      (n: ReactTestInstance) => n.props?.name === 'pause',
    );
    expect(pauseIcons.length).toBeGreaterThan(0);
    act(() => { r1.unmount(); });
    current = undefined;

    mockPlaying = false;
    const r2 = renderScreen();
    const playIcons = r2.root.findAll(
      (n: ReactTestInstance) => n.props?.name === 'play',
    );
    expect(playIcons.length).toBeGreaterThan(0);
  });

  it('en cours de lecture, le bouton central met en pause (et non replay)', async () => {
    mockPlaying = true;
    const r = renderScreen();
    const btns = r.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function');
    await act(async () => { for (const b of btns) { try { await b.props.onPress(); } catch { /* ignore */ } } });
    expect(mockPause).toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
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
