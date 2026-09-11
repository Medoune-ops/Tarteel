/**
 * Synchronisation des widgets au démarrage de l'app.
 *
 * `syncWidgetData` n'était appelé que depuis des mutations du store (addXP,
 * setStreak, setCurrentLesson, hydrateFromBackend…). Sur un téléphone où
 * l'utilisateur pose un widget sans déclencher aucune de ces actions, les
 * SharedPreferences "<package>.widgetdata" restaient vides et le widget
 * affichait série 0 / 0 XP — alors que le store persisté, lui, avait les
 * bonnes valeurs.
 *
 * On vérifie ici que la réhydratation du store pousse l'état persisté vers le
 * pont natif, sans attendre qu'une leçon soit terminée.
 */

const mockSetWidgetData = jest.fn();

jest.mock('expo-widget', () => ({
  setWidgetData: (...args: unknown[]) => mockSetWidgetData(...args),
}), { virtual: true });

jest.mock('../lib/i18n', () => ({
  t: (key: string) => key,
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

// Les valeurs doivent venir du STOCKAGE, pas d'un setState : zustand/persist
// remplace l'état par ce qu'il relit, donc un état posé à la main avant
// rehydrate() serait écrasé par les valeurs par défaut.
const mockGetItem = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

import { useUserStore } from '../store/userStore';

/** Simule un état déjà persisté, puis rejoue la réhydratation du démarrage. */
async function rehydrateFromStorage(values: {
  streak: number;
  xp: number;
  currentLesson: number;
  reminderHour: number;
}) {
  mockGetItem.mockResolvedValueOnce(JSON.stringify({ state: values, version: 0 }));
  // rehydrate() est asynchrone (AsyncStorage) : sans await, les assertions
  // passeraient avant que le callback de persist n'ait tourné.
  await useUserStore.persist.rehydrate();
}

/** Le JSON transmis au natif, tel que le liront les widgets. */
function lastPayload(): Record<string, unknown> {
  const calls = mockSetWidgetData.mock.calls;
  return JSON.parse(calls[calls.length - 1]![0] as string);
}

describe('synchronisation des widgets au démarrage', () => {
  beforeEach(() => {
    mockSetWidgetData.mockClear();
    mockGetItem.mockReset();
  });

  it('pousse les données vers les widgets sans attendre une mutation', async () => {
    await rehydrateFromStorage({ streak: 12, xp: 840, currentLesson: 7, reminderHour: 8 });
    expect(mockSetWidgetData).toHaveBeenCalled();
  });

  it('transmet la série et les XP persistés, pas les valeurs par défaut', async () => {
    await rehydrateFromStorage({ streak: 12, xp: 840, currentLesson: 7, reminderHour: 8 });
    const data = lastPayload();
    expect(data.streak).toBe(12);
    expect(data.xp).toBe(840);
  });

  it("transmet la leçon courante et l'heure de rappel persistées", async () => {
    await rehydrateFromStorage({ streak: 3, xp: 55, currentLesson: 9, reminderHour: 21 });
    const data = lastPayload();
    expect(data.currentLesson).toBe(9);
    expect(data.reminderHour).toBe(21);
  });

  it('passe le nom de package en 2e argument (sinon écriture au mauvais endroit)', async () => {
    await rehydrateFromStorage({ streak: 1, xp: 10, currentLesson: 1, reminderHour: 19 });
    const calls = mockSetWidgetData.mock.calls;
    expect(calls[calls.length - 1]).toHaveLength(2);
    expect(calls[calls.length - 1]![1]).toBe('com.tarteel.sn');
  });
});
