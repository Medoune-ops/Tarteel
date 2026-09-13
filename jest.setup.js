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

// expo-audio porte désormais TOUTE la lecture du Coran (constants/audioPlayer.ts,
// derrière la façade constants/trackPlayer.ts). Son import réel échoue sous Jest :
// ExpoAudio.ts patche `AudioModule.AudioPlayer.prototype.replace` au chargement,
// or le module natif est absent ici — d'où un « Cannot read properties of
// undefined (reading 'prototype') » qui fait tomber toute la suite avant le
// premier test.
//
// Le faux lecteur ci-dessous expose la surface utilisée par audioPlayer.ts. Une
// suite qui a besoin d'un comportement particulier (LessonPlayScreen, pour le
// micro) redéclare son propre jest.mock('expo-audio'), qui l'emporte localement.
jest.mock('expo-audio', () => {
  const makePlayer = () => ({
    id: 1,
    playing: false,
    loop: false,
    currentTime: 0,
    duration: 0,
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    setPlaybackRate: jest.fn(),
    setActiveForLockScreen: jest.fn(),
    updateLockScreenMetadata: jest.fn(),
    clearLockScreenControls: jest.fn(),
    // Renvoie un abonnement inerte : audioPlayer.ts ne s'en sert que pour
    // écouter `playbackStatusUpdate`, jamais pour se désabonner.
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    remove: jest.fn(),
  });

  return {
    createAudioPlayer: jest.fn(makePlayer),
    useAudioPlayer: jest.fn(makePlayer),
    useAudioPlayerStatus: jest.fn(() => ({
      playing: false, currentTime: 0, duration: 0, didJustFinish: false, isLoaded: true,
    })),
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
    // Enregistrement micro : présent pour les écrans de leçon/révision qui
    // importent expo-audio sans définir leur propre mock.
    useAudioRecorder: jest.fn(() => ({ record: jest.fn(), stop: jest.fn(), uri: null })),
    useAudioRecorderState: jest.fn(() => ({ isRecording: false })),
    RecordingPresets: { HIGH_QUALITY: {} },
    AudioModule: { requestRecordingPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })) },
  };
});

// react-native-webview (DexPayCheckout) charge un module natif introuvable en
// test — un composant vide suffit, on ne teste jamais le rendu de la webview.
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: View };
});

// NetInfo sonde le réseau au montage ; sans module natif il plante sur
// `undefined.isInternetReachable` et fait tomber toute la suite (Tajwid,
// Hearts, Streak, Gems). On simule un appareil EN LIGNE par défaut ; un test
// qui veut l'état hors-ligne surcharge `addEventListener` localement.
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()), // renvoie l'unsubscribe
    fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
  },
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));
