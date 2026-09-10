/**
 * Pont app -> widgets (utils/widgetData.ts).
 *
 * C'est ici qu'était le bug qui laissait les widgets Android à zéro : l'appel
 * visait `NativeModules.ExpoWidget.setItem`, un module et une fonction
 * inexistants. L'optional chaining avalait l'échec, l'app croyait écrire, et
 * rien n'arrivait jamais aux widgets — sans le moindre signal.
 *
 * Ces tests verrouillent le contrat : la bonne fonction est appelée, avec le
 * bon nombre d'arguments selon la plateforme, et le JSON transporte bien les
 * champs que lisent les widgets natifs (WidgetData.swift / TarteelWidgetBase.kt).
 */

const mockSetWidgetData = jest.fn();

jest.mock('expo-widget', () => ({
  setWidgetData: (...args: unknown[]) => mockSetWidgetData(...args),
}), { virtual: true });

jest.mock('../lib/i18n', () => ({
  t: (key: string) => key,
}));

let mockPlatform = 'android';
jest.mock('react-native', () => ({
  get Platform() { return { OS: mockPlatform }; },
}));

import { syncWidgetData } from '../utils/widgetData';

const params = { streak: 7, xp: 320, currentLesson: 4, reminderHour: 21 };

/** Récupère l'objet transmis au natif, tel que le liront les widgets. */
function payloadOf(call: unknown[]): Record<string, unknown> {
  return JSON.parse(call[0] as string);
}

describe('syncWidgetData (pont app -> widgets)', () => {
  beforeEach(() => {
    mockSetWidgetData.mockClear();
    mockPlatform = 'android';
  });

  it('appelle bien le module natif (et non un module inexistant)', () => {
    syncWidgetData(params);
    expect(mockSetWidgetData).toHaveBeenCalledTimes(1);
  });

  it('transmet le streak et les XP réels, pas des zéros', () => {
    syncWidgetData(params);
    const data = payloadOf(mockSetWidgetData.mock.calls[0]!);
    expect(data.streak).toBe(7);
    expect(data.xp).toBe(320);
  });

  it("transmet l'heure de rappel affichée par le widget Rappel", () => {
    syncWidgetData(params);
    const data = payloadOf(mockSetWidgetData.mock.calls[0]!);
    expect(data.reminderHour).toBe(21);
  });

  it('fournit les 7 jours de la semaine attendus par les widgets', () => {
    syncWidgetData(params);
    const data = payloadOf(mockSetWidgetData.mock.calls[0]!);
    expect(Array.isArray(data.activeDays)).toBe(true);
    expect(data.activeDays).toHaveLength(7);
  });

  it('passe le nom de package en 2e argument sur Android', () => {
    // Le module Android écrit dans "<package>.widgetdata" : sans ce 2e
    // argument, il écrirait au mauvais endroit et les widgets liraient du vide.
    syncWidgetData(params);
    expect(mockSetWidgetData.mock.calls[0]).toHaveLength(2);
    expect(mockSetWidgetData.mock.calls[0]![1]).toBe('com.tarteel.sn');
  });

  it('n’envoie que le JSON sur iOS (App Group fixé côté Swift)', () => {
    mockPlatform = 'ios';
    syncWidgetData(params);
    expect(mockSetWidgetData.mock.calls[0]).toHaveLength(1);
  });

  it('ne tente rien sur le web (pas de widgets)', () => {
    mockPlatform = 'web';
    syncWidgetData(params);
    expect(mockSetWidgetData).not.toHaveBeenCalled();
  });

  it('inclut tous les champs que lisent les widgets natifs', () => {
    syncWidgetData(params);
    const data = payloadOf(mockSetWidgetData.mock.calls[0]!);
    // Doit rester aligné avec WidgetData.swift et TarteelWidgetBase.kt :
    // un champ manquant fait retomber le widget sur sa valeur par défaut.
    for (const champ of [
      'streak', 'xp', 'currentLesson', 'lessonProgress',
      'lessonSection', 'activeDays', 'motivationMsg', 'reminderHour',
    ]) {
      expect(data).toHaveProperty(champ);
    }
  });
});
