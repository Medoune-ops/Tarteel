import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

// ── Mocks (préfixés `mock` pour être utilisables dans les factories jest) ──
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSourates = [
  { id: 'a', numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة', nombreVersets: 7, hizb: 1, revelation: 'makkah' },
  { id: 'b', numero: 2, nom: 'Al-Baqara', nomArabe: 'البقرة', nombreVersets: 286, hizb: 1, revelation: 'madinah' },
  { id: 'c', numero: 114, nom: 'An-Nas', nomArabe: 'الناس', nombreVersets: 6, hizb: 60, revelation: 'makkah' },
];
const mockFetchSourates = jest.fn((..._a: unknown[]) => Promise.resolve(mockSourates));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  // Exécute l'effet de focus une fois (comme au montage de l'écran).
  useFocusEffect: (cb: () => void | (() => void)) => {
    const React = require('react');
    React.useEffect(() => cb(), []);
  },
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../lib/api', () => ({ fetchSourates: (...a: unknown[]) => mockFetchSourates(...a) }));
// swrFetch → appelle simplement le fetcher (pas de cache en test).
jest.mock('../lib/api/swr', () => ({
  swrFetch: (_key: string, fetcher: () => Promise<unknown>) => fetcher(),
}));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666',
    textTertiary: '#999', divider: '#eee', isDark: false,
  }),
}));

import LectureLibreScreen from '../app/(app)/lecture-libre';

/** Concatène tout le texte rendu sous une instance. */
function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

let current: TestRenderer.ReactTestRenderer | undefined;

async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<LectureLibreScreen />); });
  return current!;
}

async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const target = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label))
    .at(0);
  if (!target) throw new Error(`Aucun bouton contenant « ${label} »`);
  await act(async () => { await target.props.onPress(); });
}

/** Saisit `text` dans la barre de recherche (TextInput = seul champ onChangeText). */
async function type(r: TestRenderer.ReactTestRenderer, text: string) {
  const input = r.root
    .findAll((n: ReactTestInstance) => typeof n.props?.onChangeText === 'function')
    .at(0);
  if (!input) throw new Error('Barre de recherche introuvable');
  await act(async () => { input.props.onChangeText(text); });
}

describe('Écran « Lecture libre » (catalogue des sourates)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockFetchSourates.mockClear();
  });

  afterEach(() => {
    act(() => { current?.unmount(); });
    current = undefined;
  });

  it('affiche le titre et les sourates en arabe', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Lecture libre');
    expect(all).toContain('الفاتحة');
    expect(all).toContain('البقرة');
    expect(all).toContain('الناس');
    expect(all).toContain('286 versets');
  });

  it('affiche le NOM de chaque sourate (pour la reconnaître)', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Al-Fatiha');
    expect(all).toContain('Al-Baqara');
    expect(all).toContain('An-Nas');
  });

  it('ordonne : Al-Fatiha en tête, puis décroissant (114 → 2)', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    // Al-Fatiha (1) avant An-Nas (114) avant Al-Baqara (2).
    expect(all.indexOf('Al-Fatiha')).toBeLessThan(all.indexOf('An-Nas'));
    expect(all.indexOf('An-Nas')).toBeLessThan(all.indexOf('Al-Baqara'));
  });

  it('charge le catalogue complet via fetchSourates', async () => {
    await renderScreen();
    expect(mockFetchSourates).toHaveBeenCalledTimes(1);
  });

  it('ouvre le lecteur de la sourate au clic sur une ligne', async () => {
    const r = await renderScreen();
    await press(r, 'الفاتحة');
    expect(mockPush).toHaveBeenCalledWith('/(app)/lecture/1');
  });

  it('le bouton retour revient en arrière', async () => {
    const r = await renderScreen();
    const backBtn = r.root
      .findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function')
      .find((n) => n.props.hitSlop != null);
    await act(async () => { backBtn?.props.onPress(); });
    expect(mockBack).toHaveBeenCalled();
  });

  // ── Barre de recherche ──

  it("n'affiche plus l'ancien texte d'intro", async () => {
    const r = await renderScreen();
    expect(textOf(r.root)).not.toContain('Choisis une sourate');
  });

  it('la recherche par nom filtre les sourates (dès les premières lettres)', async () => {
    const r = await renderScreen();
    await type(r, 'baq');
    const all = textOf(r.root);
    expect(all).toContain('Al-Baqara');
    expect(all).not.toContain('Al-Fatiha');
    expect(all).not.toContain('An-Nas');
  });

  it('la recherche ignore les accents (requête "nâs" trouve An-Nas)', async () => {
    const r = await renderScreen();
    await type(r, 'nâs');
    const all = textOf(r.root);
    expect(all).toContain('An-Nas');
    expect(all).not.toContain('Al-Fatiha');
  });

  it('la recherche par numéro fonctionne', async () => {
    const r = await renderScreen();
    await type(r, '114');
    const all = textOf(r.root);
    expect(all).toContain('An-Nas');
    expect(all).not.toContain('Al-Fatiha');
  });

  it('affiche « Aucune sourate trouvée » quand rien ne correspond', async () => {
    const r = await renderScreen();
    await type(r, 'zzzzz');
    expect(textOf(r.root)).toContain('Aucune sourate trouvée');
  });
});
