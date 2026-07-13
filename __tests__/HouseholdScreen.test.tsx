import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockCreate = jest.fn((..._a: unknown[]) => Promise.resolve({}));
const mockInvite = jest.fn((..._a: unknown[]) => Promise.resolve({}));
const mockAccept = jest.fn((..._a: unknown[]) => Promise.resolve({}));
const mockDecline = jest.fn((..._a: unknown[]) => Promise.resolve({ ok: true }));
let mockView: unknown = { household: null, receivedInvitations: [] };
const mockFetch = jest.fn((..._a: unknown[]) => Promise.resolve(mockView));

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
  fetchHousehold: (...a: unknown[]) => mockFetch(...a),
  createHousehold: (...a: unknown[]) => mockCreate(...a),
  deleteHousehold: jest.fn(() => Promise.resolve({ ok: true })),
  leaveHousehold: jest.fn(() => Promise.resolve({ ok: true })),
  transferHousehold: jest.fn(() => Promise.resolve({})),
  inviteToHousehold: (...a: unknown[]) => mockInvite(...a),
  acceptHouseholdInvite: (...a: unknown[]) => mockAccept(...a),
  declineHouseholdInvite: (...a: unknown[]) => mockDecline(...a),
  cancelHouseholdInvite: jest.fn(() => Promise.resolve({})),
  removeHouseholdMember: jest.fn(() => Promise.resolve({})),
  subscribePremium: jest.fn(() => Promise.resolve({})),
}));
jest.mock('../lib/api/client', () => ({ ApiError: class ApiError extends Error { status = 0; code = ''; } }));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999',
    border: '#eee', divider: '#eee', inputBg: '#f2f2f2', isDark: false,
  }),
}));

import HouseholdScreen from '../app/(app)/household';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}
let current: TestRenderer.ReactTestRenderer | undefined;
async function renderScreen() {
  await act(async () => { current = TestRenderer.create(<HouseholdScreen />); });
  await act(async () => { await Promise.resolve(); });
  return current!;
}
async function press(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = r.root.findAll((n: ReactTestInstance) => typeof n.props?.onPress === 'function' && textOf(n).includes(label)).at(0);
  if (!t) throw new Error(`bouton « ${label} » introuvable`);
  await act(async () => { await t.props.onPress(); });
}

const OWNED = {
  household: {
    id: 'h1', isOwner: true, subscriptionActive: false, subscriptionUntil: null, plan: null, maxMembers: 5,
    members: [
      { userId: 'u1', email: 'me@x.com', displayName: 'Moi', avatarInitials: 'MO', role: 'owner', joinedAt: '2026-07-01', isMe: true },
      { userId: 'u2', email: 'kid@x.com', displayName: 'Enfant', avatarInitials: 'EN', role: 'member', joinedAt: '2026-07-02', isMe: false },
    ],
    invitations: [{ id: 'i1', email: 'invite@x.com', status: 'pending', createdAt: '2026-07-03', expiresAt: '2026-07-10' }],
  },
  receivedInvitations: [],
};

describe('Écran Plan familial (foyer)', () => {
  beforeEach(() => {
    mockPush.mockClear(); mockCreate.mockClear(); mockInvite.mockClear();
    mockAccept.mockClear(); mockDecline.mockClear(); mockFetch.mockClear();
    mockView = { household: null, receivedInvitations: [] };
  });
  afterEach(() => { act(() => { current?.unmount(); }); current = undefined; });

  it('sans foyer : propose de créer un foyer', async () => {
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Plan familial');
    expect(all).toContain('Créer un foyer');
  });

  it('« Créer un foyer » appelle createHousehold', async () => {
    const r = await renderScreen();
    await press(r, 'Créer un foyer');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('avec foyer : affiche les membres, le compteur et l\'abonnement inactif', async () => {
    mockView = OWNED;
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Membres (2/5)');
    expect(all).toContain('Moi');
    expect(all).toContain('Enfant');
    expect(all).toContain('Abonnement familial inactif');
    expect(all).toContain('invite@x.com'); // invitation en attente
  });

  it('propriétaire : « S\'abonner » et suppression du foyer disponibles', async () => {
    mockView = OWNED;
    const r = await renderScreen();
    const all = textOf(r.root);
    expect(all).toContain('Supprimer le foyer');
    expect(all).toContain("S'abonner");
  });

  it('invitation reçue : accepter appelle acceptHouseholdInvite', async () => {
    mockView = { household: null, receivedInvitations: [{ token: 'tok1', householdId: 'h9', invitedBy: 'Papa', expiresAt: '2026-07-20' }] };
    const r = await renderScreen();
    expect(textOf(r.root)).toContain('Papa');
    await press(r, 'Accepter');
    expect(mockAccept).toHaveBeenCalledWith('tok1');
  });
});
