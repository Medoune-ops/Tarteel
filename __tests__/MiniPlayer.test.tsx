import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

/**
 * Le mini-lecteur (barre du bas : titre, pause, avance/retour, croix) ne
 * s'affichait pas sur Android alors que le son jouait — signalé sur les builds
 * 18 et 19. Il disparaissait en silence via un `return null`, sans qu'aucun
 * test ne couvre sa condition d'affichage. Ces cas verrouillent le contrat :
 * un track actif => la barre est visible avec ses contrôles.
 */

const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockNext = jest.fn();
const mockPrev = jest.fn();
const mockStop = jest.fn();

let mockTrack: { id?: string; title?: string; artist?: string } | undefined;
let mockPlaying = false;
let mockPathname = '/parcours';

jest.mock('../constants/trackPlayer', () => ({
  AUDIO_AVAILABLE: true,
  useActiveTrack: () => mockTrack,
  useProgress: () => ({ position: 30, duration: 120, buffered: 0 }),
  useIsPlaying: () => ({ playing: mockPlaying }),
  audioControls: {
    play: () => mockPlay(),
    pause: () => mockPause(),
    skipToNext: () => mockNext(),
    skipToPrevious: () => mockPrev(),
    stop: () => mockStop(),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => mockPathname,
}));

jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    cardBg: '#fff', border: '#eee', text: '#000',
    textSecondary: '#666', selectorBg: '#eee', isDark: false,
  }),
}));

import MiniPlayer from '../components/MiniPlayer';

/** Concatène tout le texte rendu, pour des assertions lisibles. */
function textOf(node: ReactTestInstance): string {
  return node.findAll((n) => typeof n.type === 'string')
    .flatMap((n) => n.children)
    .filter((c): c is string => typeof c === 'string')
    .join(' ');
}

/** Compte les éléments pressables (les contrôles du lecteur). */
function pressableCount(node: ReactTestInstance): number {
  return node.findAll((n) => typeof n.props?.onPress === 'function').length;
}

describe('MiniPlayer (barre de lecture du bas)', () => {
  beforeEach(() => {
    mockTrack = undefined;
    mockPlaying = false;
    mockPathname = '/parcours';
    jest.clearAllMocks();
  });

  it("s'affiche avec le titre de la sourate quand un track est actif", () => {
    mockTrack = { id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' };
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<MiniPlayer />); });
    const all = textOf(r.root);
    expect(all).toContain('Al-Fatiha');
    expect(all).toContain('Abdul Basit');
  });

  it('expose les 4 contrôles : précédent, play/pause, suivant, fermer', () => {
    mockTrack = { id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' };
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<MiniPlayer />); });
    // 1 pressable racine (ouvre le lecteur plein écran) + 4 contrôles.
    expect(pressableCount(r.root)).toBeGreaterThanOrEqual(5);
  });

  it('le bouton central met en pause quand la lecture est en cours', () => {
    mockTrack = { id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' };
    mockPlaying = true;
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<MiniPlayer />); });
    // Le bouton play/pause est celui qui porte le fond violet plein.
    const playBtn = r.root.findAll((n) => typeof n.props?.onPress === 'function')
      .find((n) => JSON.stringify(n.props?.style ?? '').includes('8A5CF0'));
    act(() => { playBtn?.props.onPress({ stopPropagation: () => {} }); });
    expect(mockPause).toHaveBeenCalled();
    expect(mockPlay).not.toHaveBeenCalled();
  });

  it('la croix arrête la lecture', () => {
    mockTrack = { id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' };
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<MiniPlayer />); });
    const pressables = r.root.findAll((n) => typeof n.props?.onPress === 'function');
    // La croix est le dernier contrôle de la rangée.
    act(() => { pressables[pressables.length - 1]?.props.onPress({ stopPropagation: () => {} }); });
    expect(mockStop).toHaveBeenCalled();
  });

  it("reste masqué sur l'écran plein écran du lecteur", () => {
    mockTrack = { id: '1', title: '1. Al-Fatiha', artist: 'Abdul Basit' };
    mockPathname = '/coran-player';
    let r!: TestRenderer.ReactTestRenderer;
    act(() => { r = TestRenderer.create(<MiniPlayer />); });
    expect(textOf(r.root)).not.toContain('Al-Fatiha');
  });
});
