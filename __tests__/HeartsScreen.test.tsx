import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

// ── Mocks (prefixés `mock` pour être utilisables dans les factories jest) ──
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockBuyHearts = jest.fn((..._a: unknown[]) => Promise.resolve({ hearts: 5 }));
const mockRefill = jest.fn((..._a: unknown[]) => Promise.resolve({ gems: 150, hearts: 5 }));
const mockStoreState: Record<string, unknown> = {
  hearts: 2,
  gems: 500,
  isPremium: false,
  syncHearts: jest.fn(),
  msUntilNextHeart: () => 3_600_000,
};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
// Wrapper (et non référence directe) : late-binding requis car le mock est
// hoisté au-dessus de l'init de `mockBuyHearts` (sinon on capture undefined).
jest.mock('../lib/api', () => ({ buyHearts: (...a: unknown[]) => mockBuyHearts(...a) }));
jest.mock('../lib/api/gems', () => ({ refillHeartsWithGems: (...a: unknown[]) => mockRefill(...a) }));
jest.mock('../lib/api/client', () => ({
  ApiError: class ApiError extends Error { status = 0; code = ''; },
}));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', isDark: false }),
}));
jest.mock('../store/userStore', () => ({
  MAX_HEARTS: 5,
  useUserStore: Object.assign(
    (sel: (s: Record<string, unknown>) => unknown) => sel(mockStoreState),
    { getState: () => mockStoreState },
  ),
}));

import HeartsScreen from '../app/(app)/hearts';

/** Concatène tout le texte rendu sous une instance (string children inclus). */
function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

/** Rend l'écran et renvoie le renderer (dans act, pour vider les effets). */
function renderScreen() {
  act(() => { current = TestRenderer.create(<HeartsScreen />); });
  return current!;
}

/** Trouve l'élément pressable (a un onPress) dont le texte contient `label`. */
async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const target = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label))
    .at(0);
  if (!target) throw new Error(`Aucun bouton contenant « ${label} »`);
  await act(async () => { await target.props.onPress(); });
}

describe('Page des cœurs (hub)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBuyHearts.mockClear();
    mockRefill.mockClear();
    mockStoreState.isPremium = false;
    mockStoreState.hearts = 2;
    mockStoreState.gems = 500;
  });

  // Démonte le composant → déclenche clearInterval (sinon le setInterval de la
  // page continue de tourner après le test et pollue l'environnement jest).
  afterEach(() => {
    act(() => { current?.unmount(); });
    current = undefined;
  });

  it('affiche les 4 options quand on n’est pas Premium', () => {
    const r = renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Mes cœurs');
    expect(all).toContain('Convertir mes gemmes');
    expect(all).toContain("Acheter avec de l'argent");
    expect(all).toContain('Réviser pour des cœurs');
    expect(all).toContain('Parrainer des amis');
  });

  it('« Parrainer » navigue vers l’écran de parrainage', async () => {
    const r = renderScreen();
    await press(r, 'Parrainer des amis');
    expect(mockPush).toHaveBeenCalledWith('/(app)/referral');
  });

  it('« Réviser » navigue vers l’onglet révisions', async () => {
    const r = renderScreen();
    await press(r, 'Réviser pour des cœurs');
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/(app)/(tabs)/revisions' }),
    );
  });

  it('« Acheter avec de l\'argent » appelle l’API buyHearts', async () => {
    const r = renderScreen();
    await press(r, 'Acheter');
    expect(mockBuyHearts).toHaveBeenCalled();
  });

  it('« Convertir mes gemmes » appelle refillHeartsWithGems', async () => {
    const r = renderScreen();
    await press(r, 'Convertir mes gemmes');
    expect(mockRefill).toHaveBeenCalled();
  });

  it('affiche l’état Premium (cœurs illimités) sans les options d’achat', () => {
    mockStoreState.isPremium = true;
    const r = renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Tu es Premium');
    expect(all).not.toContain('Convertir mes gemmes');
  });
});
