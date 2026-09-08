/**
 * RÉGRESSION (Android) : l'aiguille de la Qibla ne bougeait pas.
 *
 * Trois causes verrouillees ici :
 *  1. setUpdateInterval(120) : Android 12+ (API 31) plafonne les capteurs a
 *     200 ms sans la permission HIGH_SAMPLING_RATE_SENSORS.
 *  2. des mesures (0,0) d'un capteur non calibre donnaient atan2(0,0) = 0,
 *     soit un faux cap « plein nord » au lieu de « pas de mesure ».
 *  3. l'abonnement n'etait pas annule si le composant etait demonte pendant
 *     l'attente de isAvailableAsync().
 */
import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';

let mockListener: ((m: { x: number; y: number }) => void) | null = null;
const mockRemove = jest.fn();
const mockSetInterval = jest.fn();
let mockAvailable = true;

jest.mock('expo-sensors', () => ({
  Magnetometer: {
    isAvailableAsync: () => Promise.resolve(mockAvailable),
    setUpdateInterval: (ms: number) => mockSetInterval(ms),
    addListener: (cb: (m: { x: number; y: number }) => void) => {
      mockListener = cb;
      return { remove: mockRemove };
    },
  },
}));
jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Path: 'Path' }));
jest.mock('../components/IslamicIcons', () => ({ KaabaColorIcon: () => null }));
jest.mock('../lib/i18n', () => ({
  useT: () => (k: string) => k,
}));

import QiblaCompass from '../components/QiblaCompass';

const COLORS = { text: '#000', textSecondary: '#666', textTertiary: '#999', cardBg: '#fff' };
// Dakar.
const props = { latitude: 14.6928, longitude: -17.4467, colors: COLORS };

function textOf(inst: ReactTestInstance | string): string {
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

beforeEach(() => {
  mockListener = null;
  mockAvailable = true;
  mockRemove.mockClear();
  mockSetInterval.mockClear();
});

it('respecte le plafond de 200 ms des capteurs Android 12+', async () => {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  // < 200 ms serait rejete par Android sans HIGH_SAMPLING_RATE_SENSORS.
  expect(mockSetInterval).toHaveBeenCalledWith(200);
  await act(async () => { r?.unmount(); });
});

it("ignore les mesures (0,0) d'un capteur non calibre au lieu d'afficher un faux nord", async () => {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  await act(async () => { mockListener?.({ x: 0, y: 0 }); });
  // heading reste null -> l'ecran annonce l'absence de capteur.
  expect(textOf(r!.root)).toContain('qibla.noSensor');

  // Une vraie mesure fait basculer sur l'indication normale.
  await act(async () => { mockListener?.({ x: 12, y: 30 }); });
  expect(textOf(r!.root)).toContain('qibla.hint');

  await act(async () => { r?.unmount(); });
});

it("libere l'abonnement au demontage", async () => {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });
  await act(async () => { r?.unmount(); });

  expect(mockRemove).toHaveBeenCalled();
});

it('sans magnetometre, aucun abonnement et pas de crash', async () => {
  mockAvailable = false;
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  expect(mockListener).toBeNull();
  expect(mockSetInterval).not.toHaveBeenCalled();
  expect(textOf(r!.root)).toContain('qibla.noSensor');
  await act(async () => { r?.unmount(); });
});
