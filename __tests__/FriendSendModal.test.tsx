/**
 * RÉGRESSION : la feuille « envoyer un message » passait SOUS le clavier.
 *
 * Le KeyboardAvoidingView était posé à l'intérieur de la feuille, sans
 * hauteur bornée : il ne pouvait donc pas rétrécir. Sur iOS son `padding`
 * gonflait la feuille par le bas (le champ restait collé au clavier), sur
 * Android (`behavior` par défaut) il ne rétrécissait rien du tout. Résultat :
 * plus rien n'était visible une fois le clavier déployé.
 *
 * Le correctif : le KeyboardAvoidingView enveloppe le FOND (donc sa hauteur
 * est bornée et il peut rétrécir), et le ScrollView porte `flexShrink: 1`
 * pour défiler au lieu d'être découpé par la feuille.
 */
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Keyboard } from 'react-native';

jest.mock('@expo/vector-icons', () => ({ Feather: 'Feather' }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('../components/FriendAvatar', () => ({ __esModule: true, default: 'Avatar' }));
jest.mock('../components/FriendButton', () => ({ __esModule: true, default: 'Button' }));
jest.mock('../lib/i18n', () => ({ useT: () => (k: string) => k }));
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({
    isDark: false,
    pageBg: '#fff', cardBg: '#f5f5f5', text: '#000', textSecondary: '#666',
    textTertiary: '#999', divider: '#eee', border: '#ddd',
  }),
}));
jest.mock('../utils/friendTheme', () => ({ friendPalette: () => ({ tint: '#eee' }) }));
jest.mock('../lib/api', () => ({
  fetchChallenges: () => Promise.resolve({ challenges: [] }),
  sendToFriend: jest.fn(() => Promise.resolve()),
}));
jest.mock('../lib/api/client', () => ({ ApiError: class ApiError extends Error {} }));

import FriendSendModal from '../components/FriendSendModal';

const friend = { id: 'f1', displayName: 'Awa', username: 'awa' } as never;

/** Monte la modale et laisse les promesses (liste de défis) se résoudre. */
async function render() {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    r = TestRenderer.create(<FriendSendModal visible friend={friend} onClose={() => {}} />);
  });
  return r!;
}

it('le KeyboardAvoidingView enveloppe le fond : c\'est lui qui rétrécit au clavier', async () => {
  const r = await render();
  const kavs = r.root.findAllByType(KeyboardAvoidingView);
  expect(kavs).toHaveLength(1);

  const style = StyleSheet.flatten(kavs[0]!.props.style) as Record<string, unknown>;
  // Hauteur bornée (flex: 1) : sans ça le composant ne peut pas rétrécir.
  expect(style.flex).toBe(1);
  // La feuille reste collée en bas du fond.
  expect(style.justifyContent).toBe('flex-end');
  // iOS : padding ; Android : height (la fenêtre ne se redimensionne pas,
  // la barre de statut est translucide — cf. expo android.translucent).
  expect(kavs[0]!.props.behavior).toBe(Platform.OS === 'ios' ? 'padding' : 'height');

  await act(async () => { r.unmount(); });
});

it('le contenu défile au lieu d\'être coupé par la feuille', async () => {
  const r = await render();
  const scrolls = r.root.findAllByType(ScrollView);
  expect(scrolls.length).toBeGreaterThan(0);

  const style = StyleSheet.flatten(scrolls[0]!.props.style) as Record<string, unknown>;
  expect(style.flexShrink).toBe(1);

  await act(async () => { r.unmount(); });
});

it('écoute le clavier pour ramener la zone de saisie dans le champ', async () => {
  const spy = jest.spyOn(Keyboard, 'addListener');
  const r = await render();

  expect(spy).toHaveBeenCalledWith('keyboardDidShow', expect.any(Function));

  spy.mockRestore();
  await act(async () => { r.unmount(); });
});
