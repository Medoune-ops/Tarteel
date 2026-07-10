import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRefill = jest.fn((..._a: unknown[]) => Promise.resolve({ gems: 150, hearts: 5 }));
const mockFreeze = jest.fn((..._a: unknown[]) => Promise.resolve({ gems: 300, streakFreezes: 2 }));
const mockDoubleXp = jest.fn((..._a: unknown[]) => Promise.resolve({ gems: 400, doubleXpUntil: '2026-07-10T12:00:00Z' }));
const mockBuyPack = jest.fn((..._a: unknown[]) => Promise.resolve({ gems: 1000, gemsAdded: 500, pack: 'p500' }));
const mockStoreState: Record<string, unknown> = { gems: 500, streakFreezes: 1, doubleXpUntil: null };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../lib/api', () => ({
  refillHeartsWithGems: (...a: unknown[]) => mockRefill(...a),
  buyStreakFreeze: (...a: unknown[]) => mockFreeze(...a),
  buyDoubleXp: (...a: unknown[]) => mockDoubleXp(...a),
  buyGemPack: (...a: unknown[]) => mockBuyPack(...a),
}));
jest.mock('../lib/api/client', () => ({
  ApiError: class ApiError extends Error { status = 0; code = ''; },
}));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', isDark: false }),
}));
jest.mock('../store/userStore', () => ({
  useUserStore: Object.assign(
    (sel: (s: Record<string, unknown>) => unknown) => sel(mockStoreState),
    { getState: () => mockStoreState },
  ),
}));

import GemsScreen from '../app/(app)/gems';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

function renderScreen() {
  act(() => { current = TestRenderer.create(<GemsScreen />); });
  return current!;
}

/** Renvoie le Pressable (carte) dont le texte contient `label`. */
function cardFor(r: TestRenderer.ReactTestRenderer, label: string) {
  return r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label))
    .at(0);
}

async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const target = cardFor(r, label);
  if (!target) throw new Error(`Aucun bouton contenant « ${label} »`);
  await act(async () => { await target.props.onPress(); });
}

describe('Écran « Mes gemmes » (options avec les diamants)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockRefill.mockClear();
    mockFreeze.mockClear();
    mockDoubleXp.mockClear();
    mockBuyPack.mockClear();
    mockStoreState.gems = 500;
    mockStoreState.streakFreezes = 1;
    mockStoreState.doubleXpUntil = null;
  });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('affiche le solde et toutes les options', () => {
    const r = renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Mes gemmes');
    expect(all).toContain('500'); // solde
    expect(all).toContain('Convertir en cœurs');
    expect(all).toContain('Geler ma série');
    expect(all).toContain('Double XP · 15 min');
    expect(all).toContain('gemmes'); // packs
  });

  it('« Convertir en cœurs » appelle refillHeartsWithGems', async () => {
    const r = renderScreen();
    await press(r, 'Convertir en cœurs');
    expect(mockRefill).toHaveBeenCalled();
  });

  it('« Geler ma série » appelle buyStreakFreeze', async () => {
    const r = renderScreen();
    await press(r, 'Geler ma série');
    expect(mockFreeze).toHaveBeenCalled();
  });

  it('« Double XP » appelle buyDoubleXp', async () => {
    const r = renderScreen();
    await press(r, 'Double XP');
    expect(mockDoubleXp).toHaveBeenCalled();
  });

  it('un pack de gemmes appelle buyGemPack avec le bon id', async () => {
    const r = renderScreen();
    await press(r, '500 gemmes');
    expect(mockBuyPack).toHaveBeenCalledWith('p500');
  });

  it('désactive les options quand le solde est insuffisant', () => {
    mockStoreState.gems = 50; // < tous les coûts
    const r = renderScreen();
    const refill = cardFor(r, 'Convertir en cœurs');
    expect(refill?.props.disabled).toBe(true);
  });

  it('désactive « Double XP » si un boost est déjà actif', () => {
    mockStoreState.doubleXpUntil = Date.now() + 600_000; // actif
    const r = renderScreen();
    const xp = cardFor(r, 'Double XP');
    expect(xp?.props.disabled).toBe(true);
  });

  it('le bouton retour revient en arrière', async () => {
    const r = renderScreen();
    const backBtn = r.root
      .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function')
      .find((n) => n.props.hitSlop != null);
    await act(async () => { backBtn?.props.onPress(); });
    expect(mockBack).toHaveBeenCalled();
  });
});
