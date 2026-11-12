/**
 * RÉGRESSION (Android) : la boussole de la Qibla tournait « bizarrement ».
 *
 * Trois causes distinctes, verrouillées ici :
 *  1. le cap SYSTÈME d'expo-location sur Android calcule le nord vrai par
 *     `(magnétique + déclinaison) % 360` en Kotlin : le signe suit le
 *     dividende, donc le résultat peut être NÉGATIF. expo renvoie alors
 *     `trueHeading = -1` et l'app se rabattait sur le nord magnétique —
 *     l'aiguille SAUTAIT de toute la déclinaison (~14° au Sénégal) au
 *     passage du nord ;
 *  2. le repli magnétomètre ignorait l'inclinaison : il ne donnait un cap
 *     juste que si le téléphone était à plat, penché l'aiguille partait en
 *     vrille ;
 *  3. des mesures (0,0) d'un capteur non calibré donnaient atan2(0,0) = 0,
 *     soit un faux cap « plein nord » au lieu de « pas de mesure ».
 */
import React from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Platform } from 'react-native';

let mockMagListener: ((m: { x: number; y: number; z: number }) => void) | null = null;
let mockAccListener: ((m: { x: number; y: number; z: number }) => void) | null = null;
const mockRemove = jest.fn();
const mockAccRemove = jest.fn();
const mockSetInterval = jest.fn();
let mockAvailable = true;

jest.mock('expo-sensors', () => ({
  Magnetometer: {
    isAvailableAsync: () => Promise.resolve(mockAvailable),
    setUpdateInterval: (ms: number) => mockSetInterval(ms),
    addListener: (cb: (m: { x: number; y: number; z: number }) => void) => {
      mockMagListener = cb;
      return { remove: mockRemove };
    },
  },
  Accelerometer: {
    isAvailableAsync: () => Promise.resolve(mockAvailable),
    setUpdateInterval: (ms: number) => mockSetInterval(ms),
    addListener: (cb: (m: { x: number; y: number; z: number }) => void) => {
      mockAccListener = cb;
      return { remove: mockAccRemove };
    },
  },
}));
// Cap système (Location.watchHeadingAsync) : refusé par défaut pour que les
// tests du repli magnétomètre ci-dessous restent valables.
let mockLocationGranted = false;
let mockHeadingCb: ((h: { trueHeading: number; magHeading: number; accuracy: number }) => void) | null = null;
const mockHeadingRemove = jest.fn();
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: () => Promise.resolve({ granted: mockLocationGranted }),
  watchHeadingAsync: (cb: (h: { trueHeading: number; magHeading: number; accuracy: number }) => void) => {
    mockHeadingCb = cb;
    return Promise.resolve({ remove: mockHeadingRemove });
  },
}));
jest.mock('react-native-svg', () => ({ __esModule: true, default: 'Svg', Path: 'Path' }));
jest.mock('../components/IslamicIcons', () => ({ KaabaColorIcon: () => null }));
jest.mock('../lib/i18n', () => ({
  useT: () => (k: string) => k,
}));
// Reanimated exporte des accesseurs non configurables : impossible de les
// espionner. On le remplace par un faux minimal (la boussole n'utilise que
// Animated.View, useSharedValue, useAnimatedStyle et withSpring), ce qui
// permet notamment de vérifier que l'aiguille est animée par un RESSORT.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial: number) => ({ value: initial }),
    useAnimatedStyle: (fn: () => unknown) => fn(),
    withSpring: jest.fn((value: number) => value),
    withTiming: jest.fn((value: number) => value),
    Easing: { linear: (t: number) => t },
  };
});

import QiblaCompass, { tiltedHeading, resolveSystemHeading } from '../components/QiblaCompass';
import { qiblaDirection } from '../constants/prayerTimes';
import * as Reanimated from 'react-native-reanimated';

const COLORS = { text: '#000', textSecondary: '#666', textTertiary: '#999', cardBg: '#fff' };
// Dakar.
const props = { latitude: 14.6928, longitude: -17.4467, colors: COLORS };
const QIBLA = qiblaDirection(props.latitude, props.longitude);

function textOf(inst: ReactTestInstance | string | null | undefined): string {
  if (inst == null) return '';
  if (typeof inst === 'string') return inst;
  return (inst.children ?? []).map(textOf).join('');
}

/** L'écart en degrés affiché au centre du cadran (le dernier « n° » du texte). */
function hubDegrees(root: ReactTestInstance): number {
  const matches = textOf(root).match(/(\d+)°/g);
  if (!matches || matches.length === 0) return NaN;
  return Number(matches[matches.length - 1]!.replace('°', ''));
}

/** Cap système tel qu'expo-location le calcule sur Android (Kotlin). */
const DECLINATION = -13.7;
function expoAndroidHeading(magNorth: number) {
  // Kotlin : le signe du dividende est conservé, le résultat peut être < 0.
  const trueHeading = (magNorth + DECLINATION) % 360;
  return {
    trueHeading,
    magHeading: ((magNorth % 360) + 360) % 360,
    accuracy: 3,
  };
}

const REAL_OS = Platform.OS;
afterEach(() => { Platform.OS = REAL_OS; jest.restoreAllMocks(); });

// Le lissage du cap dépend de l'horloge : on la pilote pour que les tests
// soient déterministes (et pour que deux mesures successives soient bien
// séparées dans le temps, comme sur un vrai capteur).
let fakeNow = 1_700_000_000_000;
beforeEach(() => {
  fakeNow = 1_700_000_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => fakeNow);
  mockLocationGranted = false;
  mockHeadingCb = null;
  mockHeadingRemove.mockClear();
  mockMagListener = null;
  mockAccListener = null;
  mockAvailable = true;
  mockRemove.mockClear();
  mockAccRemove.mockClear();
  mockSetInterval.mockClear();
});

it('ne demande jamais 200 ms : a cette valeur le filtre natif bloque tout', async () => {
  Platform.OS = 'android';
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  // expo-sensors enregistre le capteur a SENSOR_DELAY_NORMAL (~200 ms) puis
  // filtre avec `ecart > updateInterval`. Demander 200 ms exige donc un ecart
  // STRICTEMENT superieur a 200 ms entre deux evenements espaces de ~200 ms :
  // la condition echoue et l'aiguille se fige (constate sur appareil).
  const asked = mockSetInterval.mock.calls[0]?.[0] as number;
  expect(asked).toBeLessThan(200);
  await act(async () => { r?.unmount(); });
});

it('garde les 120 ms sur iOS (aucune regression du rendu iPhone)', async () => {
  Platform.OS = 'ios';
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  expect(mockSetInterval).toHaveBeenCalledWith(120);
  await act(async () => { r?.unmount(); });
});

it("ignore les mesures (0,0) d'un capteur non calibre au lieu d'afficher un faux nord", async () => {
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  await act(async () => { mockAccListener?.({ x: 0, y: 0, z: 1 }); });
  await act(async () => { mockMagListener?.({ x: 0, y: 0, z: 0 }); });
  // heading reste null -> l'ecran annonce l'absence de capteur.
  expect(textOf(r!.root)).toContain('qibla.noSensor');

  // Une vraie mesure fait basculer sur l'indication normale.
  await act(async () => { mockMagListener?.({ x: 0, y: 25, z: -8 }); });
  expect(textOf(r!.root)).toContain('qibla.hint');

  await act(async () => { r?.unmount(); });
});

it("libere l'abonnement au demontage", async () => {
  Platform.OS = 'android';
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });
  await act(async () => { r?.unmount(); });

  expect(mockRemove).toHaveBeenCalled();
  expect(mockAccRemove).toHaveBeenCalled();
});

it('sans magnetometre, aucun abonnement et pas de crash', async () => {
  mockAvailable = false;
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  expect(mockMagListener).toBeNull();
  expect(mockSetInterval).not.toHaveBeenCalled();
  expect(textOf(r!.root)).toContain('qibla.noSensor');
  await act(async () => { r?.unmount(); });
});

it('avec la localisation autorisée, suit le cap SYSTÈME (calibré, nord vrai) et pas le magnétomètre brut', async () => {
  mockLocationGranted = true;
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  expect(mockHeadingCb).not.toBeNull();
  expect(mockMagListener).toBeNull();

  // Téléphone pointé pile vers la Qibla -> aligné.
  await act(async () => { mockHeadingCb?.({ trueHeading: QIBLA, magHeading: QIBLA + 3, accuracy: 3 }); });
  expect(textOf(r!.root)).toContain('qibla.aligned');

  await act(async () => { r?.unmount(); });
  expect(mockHeadingRemove).toHaveBeenCalled();
});

it('boussole mal calibrée : demande de faire un 8', async () => {
  mockLocationGranted = true;
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  await act(async () => { mockHeadingCb?.({ trueHeading: (QIBLA + 90) % 360, magHeading: 0, accuracy: 1 }); });
  expect(textOf(r!.root)).toContain('qibla.calibrate');
  await act(async () => { r?.unmount(); });
});

// ── Cap système : la déclinaison d'Android ne doit plus casser l'aiguille ──

it('resolveSystemHeading : le cap reste continu quand expo renvoie trueHeading négatif (Android)', () => {
  // expo Android : trueHeading = (mag + déclinaison) % 360, signe Kotlin.
  // Quand le résultat est négatif, on ne doit PAS retomber sur le nord
  // magnétique : on applique la déclinaison apprise au nord magnétique.
  let declination: number | null = null;
  let previous: number | null = null;

  for (let mag = 340; mag <= 380; mag += 1) {
    const { trueHeading, magHeading } = expoAndroidHeading(mag);
    const resolved = resolveSystemHeading(magHeading, trueHeading, declination);
    declination = resolved.declination;
    expect(resolved.value).not.toBeNull();

    if (previous != null) {
      // Le cap affiché ne doit jamais reculer : c'était le saut de ~14°.
      const delta = ((resolved.value! - previous) % 360 + 540) % 360 - 180;
      expect(delta).toBeGreaterThan(0);
      expect(delta).toBeLessThan(2);
    }
    previous = resolved.value;
  }
});

it('resolveSystemHeading : sans déclinaison connue, on utilise le nord vrai fourni', () => {
  const resolved = resolveSystemHeading(10, 5, null);
  expect(resolved.value).toBe(5);
  expect(resolved.declination).toBe(-5);
});

it("l'aiguille ne recule pas au passage du nord (cap système Android)", async () => {
  mockLocationGranted = true;
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  const seen: number[] = [];
  for (let mag = 340; mag <= 380; mag += 1) {
    fakeNow += 200;
    await act(async () => { mockHeadingCb?.(expoAndroidHeading(mag)); });
    seen.push(hubDegrees(r!.root));
  }

  // L'écart à la Qibla doit diminuer régulièrement (le cap tourne vers la
  // Qibla) : un saut de 14° à l'envers le ferait remonter d'un coup.
  for (let i = 1; i < seen.length; i += 1) {
    expect(seen[i]!).toBeLessThanOrEqual(seen[i - 1]! + 0.6);
  }

  await act(async () => { r?.unmount(); });
});

it("l'aiguille suit le cap avec un RESSORT sur ANDROID (le timing relancé à chaque mesure la faisait trembler)", async () => {
  Platform.OS = 'android';
  mockLocationGranted = true;
  const spring = jest.mocked(Reanimated.withSpring);
  const timing = jest.mocked(Reanimated.withTiming);
  spring.mockClear();
  timing.mockClear();
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  // Deux mesures successives : l'aiguille doit être animée par un ressort.
  // Un `withTiming` relancé à chaque mesure repart de vitesse nulle et fait
  // trembler l'aiguille ; le ressort conserve la vitesse (Reanimated :
  // previousAnimation?.velocity).
  fakeNow += 200;
  await act(async () => { mockHeadingCb?.({ trueHeading: 10, magHeading: 10, accuracy: 3 }); });
  fakeNow += 200;
  await act(async () => { mockHeadingCb?.({ trueHeading: 12, magHeading: 12, accuracy: 3 }); });

  expect(spring).toHaveBeenCalled();
  expect(timing).not.toHaveBeenCalled();
  expect(spring.mock.calls[0]![1]).toMatchObject({ dampingRatio: 1 });

  await act(async () => { r?.unmount(); });
});

it("iOS n'est PAS touché : on garde le timing d'origine et pas d'accéléromètre", async () => {
  Platform.OS = 'ios';
  const spring = jest.mocked(Reanimated.withSpring);
  const timing = jest.mocked(Reanimated.withTiming);
  spring.mockClear();
  timing.mockClear();

  // Repli magnétomètre (pas de permission de localisation) : iOS ne doit
  // pas s'abonner à l'accéléromètre et garder l'animation d'origine.
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  await act(async () => { mockMagListener?.({ x: 0, y: 25, z: -8 }); });
  // Une seconde mesure : c'est elle qui déclenche l'animation.
  fakeNow += 200;
  await act(async () => { mockMagListener?.({ x: 1, y: 25, z: -8 }); });

  expect(mockAccListener).toBeNull();
  expect(spring).not.toHaveBeenCalled();
  expect(timing).toHaveBeenCalled();

  await act(async () => { r?.unmount(); });
});

// ── Repli magnétomètre : l'inclinaison doit être compensée ──

describe('tiltedHeading', () => {
  it('cap correct quand le téléphone est à plat', () => {
    // À plat, écran vers le haut, haut de l'écran vers le nord.
    expect(tiltedHeading({ x: 0, y: 25, z: -8 }, { x: 0, y: 0, z: 1 }, false)).toBeCloseTo(0, 1);
    // Haut de l'écran vers l'est.
    expect(tiltedHeading({ x: -25, y: 0, z: -8 }, { x: 0, y: 0, z: 1 }, false)).toBeCloseTo(90, 1);
  });

  it('cap correct quand le téléphone est penché de 45°', () => {
    // Haut de l'écran à 45° du nord, incliné de 45° vers le haut.
    expect(
      tiltedHeading({ x: -17.68, y: 6.84, z: -18.16 }, { x: 0, y: 0.707, z: 0.707 }, false),
    ).toBeCloseTo(45, 1);
  });

  it('corrige la convention de l\'accéléromètre iOS (z = -1 à plat)', () => {
    expect(tiltedHeading({ x: 0, y: 25, z: -8 }, { x: 0, y: 0, z: -1 }, true)).toBeCloseTo(0, 1);
  });

  it('refuse un téléphone tenu vertical : le cap ne serait que du bruit', () => {
    // Haut de l'écran vers le zénith.
    expect(tiltedHeading({ x: 0, y: -8, z: -25 }, { x: 0, y: 1, z: 0 }, false)).toBeNull();
  });
});

it('le repli magnétomètre suit le cap même quand le téléphone est penché', async () => {
  Platform.OS = 'android';
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  // Téléphone penché de 45°, haut de l'écran à 45° du nord : le cap vaut 45°.
  await act(async () => { mockAccListener?.({ x: 0, y: 0.707, z: 0.707 }); });
  await act(async () => { mockMagListener?.({ x: -17.68, y: 6.84, z: -18.16 }); });

  const diff = Math.abs(Math.round(((45 - QIBLA) % 360 + 540) % 360 - 180));
  expect(hubDegrees(r!.root)).toBe(diff);

  await act(async () => { r?.unmount(); });
});

it('téléphone vertical : on gèle l\'aiguille et on demande de le poser à plat', async () => {
  Platform.OS = 'android';
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  await act(async () => { mockAccListener?.({ x: 0, y: 1, z: 0 }); });
  await act(async () => { mockMagListener?.({ x: 0, y: -8, z: -25 }); });

  expect(textOf(r!.root)).toContain('qibla.tooTilted');

  await act(async () => { r?.unmount(); });
});

it('si le cap système reste muet, on bascule sur le magnétomètre plutôt que de figer l\'aiguille', async () => {
  Platform.OS = 'android';
  jest.useFakeTimers();
  mockLocationGranted = true;
  let r: TestRenderer.ReactTestRenderer | undefined;
  await act(async () => { r = TestRenderer.create(<QiblaCompass {...props} />); });

  // Le cap système n'émet rien (capteur de champ qui ne répond pas).
  expect(mockMagListener).toBeNull();

  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(mockMagListener).not.toBeNull();

  await act(async () => { r?.unmount(); });
  jest.useRealTimers();
});
