/**
 * Écran « Heures de prière » (maquette) : liste du jour, date hégirienne,
 * cloches par prière, voix de l'adhan, délai « avant » et choix de ville.
 */
import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }));
jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Path: 'Path', Line: 'Line' }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'denied' })),
  getCurrentPositionAsync: jest.fn(),
}));
const mockPlay = jest.fn();
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: mockPlay, pause: jest.fn(), seekTo: jest.fn() }),
  useAudioPlayerStatus: () => ({ playing: false }),
}));
jest.mock('expo-sensors', () => ({
  Magnetometer: { isAvailableAsync: () => Promise.resolve(false), setUpdateInterval: jest.fn(), addListener: jest.fn() },
}));
jest.mock('../lib/prayerReminders', () => ({ requestReminderPermission: jest.fn(async () => true) }));
jest.mock('../components/StatusBar', () => () => null);
jest.mock('../utils/useTheme', () => ({
  useTheme: () => ({ pageBg: '#fff', cardBg: '#fff', text: '#000', textSecondary: '#666', textTertiary: '#999', isDark: false }),
}));

import PrieresScreen from '../app/(app)/prieres';
import { usePrayerStore } from '../store/prayerStore';

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}
function pressByLabel(r: TestRenderer.ReactTestRenderer, label: string) {
  const t = r.root.findAll((n) => typeof n.props?.onPress === 'function' && n.props?.accessibilityLabel === label).at(0);
  if (!t) throw new Error(`« ${label} » introuvable`);
  return act(async () => { await t.props.onPress(); });
}
/** Le Pressable le plus proche qui contient exactement ce texte. */
function pressText(r: TestRenderer.ReactTestRenderer, text: string) {
  const t = r.root.findAll((n) => typeof n.props?.onPress === 'function' && textOf(n).includes(text))
    .sort((a, b) => textOf(a).length - textOf(b).length).at(0);
  if (!t) throw new Error(`« ${text} » introuvable`);
  return act(async () => { await t.props.onPress(); });
}

let current: TestRenderer.ReactTestRenderer | undefined;
async function render() {
  await act(async () => { current = TestRenderer.create(<PrieresScreen />); });
  return current!;
}

describe('Écran Heures de prière', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 9, 24, 10, 44));
    usePrayerStore.setState({
      latitude: 14.6928, longitude: -17.4467, cityName: 'Dakar', source: 'city',
      remindersEnabled: true,
      reminderPrayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: false },
      adhanSound: 'makkah', reminderBefore: 10,
    });
  });
  afterEach(() => {
    act(() => { current?.unmount(); });
    current = undefined;
    jest.useRealTimers();
  });

  it('affiche les prières du jour, le Chourouq, les noms arabes et la date hégirienne', async () => {
    const r = await render();
    const all = textOf(r.root);
    for (const n of ['Fajr', 'Chourouq', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) expect(all).toContain(n);
    expect(all).toContain('الظهر');
    expect(all).toContain('12 Joumada al-Oula 1448');
    expect(all).toContain('Prochaine prière');
    expect(all).toContain('Vers La Mecque');
  });

  it('la cloche bascule l’adhan d’une prière', async () => {
    const r = await render();
    await pressByLabel(r, 'Activer l’adhan pour Isha');
    expect(usePrayerStore.getState().reminderPrayers.isha).toBe(true);
    await pressByLabel(r, 'Couper l’adhan pour Fajr');
    expect(usePrayerStore.getState().reminderPrayers.fajr).toBe(false);
  });

  it('choisir une voix, écouter, et régler « avant »', async () => {
    const r = await render();
    await pressText(r, 'Adhan de Médine');
    expect(usePrayerStore.getState().adhanSound).toBe('madina');
    await pressByLabel(r, 'Écouter le son');
    expect(mockPlay).toHaveBeenCalled();
    await pressText(r, '15 min');
    expect(usePrayerStore.getState().reminderBefore).toBe(15);
    await pressText(r, 'Non');
    expect(usePrayerStore.getState().reminderBefore).toBe(0);
  });

  it('l’interrupteur principal coupe les rappels', async () => {
    const r = await render();
    await pressByLabel(r, "Adhan à l'heure de la prière");
    expect(usePrayerStore.getState().remindersEnabled).toBe(false);
  });

  it('« Modifier » ouvre la liste des villes et en choisit une', async () => {
    const r = await render();
    expect(textOf(r.root)).not.toContain('Touba');
    await pressText(r, 'Modifier');
    expect(textOf(r.root)).toContain('Touba');
    await pressText(r, 'Touba');
    expect(usePrayerStore.getState().cityName).toBe('Touba');
    expect(textOf(r.root)).not.toContain('Ziguinchor');
  });
});
