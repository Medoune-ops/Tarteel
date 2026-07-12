import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPush = jest.fn();
const mockBack = jest.fn();
// Ledger : 3 évènements de série + 1 non-série (doit être filtré).
const mockTransactions = [
  { id: 't1', amount: 5, reason: 'daily_streak', ref: null, createdAt: '2026-07-01T10:00:00Z' },
  { id: 't2', amount: 20, reason: 'streak_bonus', ref: null, createdAt: '2026-06-25T10:00:00Z' },
  { id: 't3', amount: -200, reason: 'streak_freeze', ref: null, createdAt: '2026-06-20T10:00:00Z' },
  { id: 't4', amount: 42, reason: 'lesson_complete', ref: null, createdAt: '2026-06-19T10:00:00Z' },
];
let mockGems = { gems: 500, streakFreezes: 1, doubleXpUntil: null, doubleXpActive: false, transactions: mockTransactions };
const mockFetchGems = jest.fn((..._a: unknown[]) => Promise.resolve(mockGems));
const mockRepairStreak = jest.fn((..._a: unknown[]) => Promise.resolve({ streak: 7 }));
let mockMe: Record<string, unknown> = { lastStreakValue: 12 };
const mockFetchMe = jest.fn((..._a: unknown[]) => Promise.resolve(mockMe));
const mockStoreState: Record<string, unknown> = { streak: 7, streakGoal: null, streakFreezes: 1 };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../lib/api', () => ({
  fetchGems: (...a: unknown[]) => mockFetchGems(...a),
  fetchMe: (...a: unknown[]) => mockFetchMe(...a),
  repairStreak: (...a: unknown[]) => mockRepairStreak(...a),
}));
jest.mock('../lib/api/client', () => ({
  ApiError: class ApiError extends Error { status = 0; code = ''; },
}));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', divider: '#eee', isDark: false,
  }),
}));
jest.mock('../store/userStore', () => ({
  useUserStore: Object.assign(
    (sel: (s: Record<string, unknown>) => unknown) => sel(mockStoreState),
    { getState: () => mockStoreState },
  ),
}));

import StreakScreen from '../app/(app)/streak';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<StreakScreen />); });
  return current!;
}

async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const target = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label))
    .at(0);
  if (!target) throw new Error(`Aucun bouton contenant « ${label} »`);
  await act(async () => { await target.props.onPress(); });
}

describe('Écran « Ma série » (historique des flammes)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockFetchGems.mockClear();
    mockFetchMe.mockClear();
    mockRepairStreak.mockClear();
    mockStoreState.streakGoal = null;
    mockGems = { gems: 500, streakFreezes: 1, doubleXpUntil: null, doubleXpActive: false, transactions: mockTransactions };
    mockMe = { lastStreakValue: 12 };
  });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('affiche la série courante et le titre', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Ma série');
    expect(all).toContain('7'); // streak
    expect(all).toContain('Historique des flammes');
  });

  it('affiche uniquement les évènements de série (filtre le reste)', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Série maintenue');
    expect(all).toContain('Bonus de série');
    expect(all).toContain('Gel de série');
    // L'entrée lesson_complete (+42) ne doit PAS apparaître.
    expect(all).not.toContain('+42');
  });

  it('charge l’historique via fetchGems', async () => {
    await renderScreen();
    expect(mockFetchGems).toHaveBeenCalledTimes(1);
  });

  it('le bouton objectif navigue vers /(app)/streak-goal', async () => {
    const r = await renderScreen();
    await press(r, 'Fixer un objectif de série');
    expect(mockPush).toHaveBeenCalledWith('/(app)/streak-goal');
  });

  it('« Restaurer ma série » (payer) appelle repairStreak', async () => {
    const r = await renderScreen();
    await press(r, 'Restaurer ma série');
    expect(mockRepairStreak).toHaveBeenCalled();
  });

  it('affiche les jours récupérés (lastStreakValue) dans la restauration', async () => {
    mockMe = { lastStreakValue: 12 };
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Récupère 12 jours');
    expect(all).toContain('Payer · 12 j');
  });

  it('sans série à restaurer (lastStreakValue 0) : message dédié', async () => {
    mockMe = { lastStreakValue: 0 };
    const r = await renderScreen();
    expect(textOf(r.root)).toContain('Aucune série à restaurer');
  });

  it('affiche un état vide quand aucun évènement de série', async () => {
    mockGems = { gems: 0, streakFreezes: 0, doubleXpUntil: null, doubleXpActive: false, transactions: [] };
    const r = await renderScreen();
    expect(textOf(r.root)).toContain('Aucun évènement de série');
  });

  it('le bouton retour revient en arrière', async () => {
    const r = await renderScreen();
    const backBtn = r.root
      .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function')
      .find((n) => n.props.hitSlop != null);
    await act(async () => { backBtn?.props.onPress(); });
    expect(mockBack).toHaveBeenCalled();
  });
});
