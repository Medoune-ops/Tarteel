// Setup global des tests : mocke les modules natifs qu'un import de store /
// i18n déclenche (AsyncStorage, expo-localization), pour que le vrai store et
// le vrai i18n se chargent en test. La langue système est fixée à "fr" — les
// dictionnaires i18n retombent de toute façon sur le français.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'fr', languageTag: 'fr-FR', regionCode: 'FR' }],
  getCalendars: () => [{ timeZone: 'Europe/Paris' }],
}));

// react-native-webview (DexPayCheckout) charge un module natif introuvable en
// test — un composant vide suffit, on ne teste jamais le rendu de la webview.
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: View };
});
