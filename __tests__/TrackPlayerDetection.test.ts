/**
 * RÉGRESSION (Android, build Play Store) : l'écran Tajwid affichait
 * « nécessite un development build » alors que l'utilisateur avait la vraie
 * app. Deux bugs empilés, verrouillés ici :
 *
 *  1. IS_EXPO_GO lisait `appOwnership` (déprécié SDK 50+), qui peut remonter
 *     'expo' dans un build standalone → mauvais message affiché.
 *  2. AUDIO_AVAILABLE testait `RNTP.default != null`, or l'entrée JS de RNTP
 *     est un namespace de modules JS toujours présent, même sans natif →
 *     l'audio était annoncé disponible puis crashait au premier appel.
 */

// Le module lit son environnement AU CHARGEMENT : chaque cas doit donc
// réinitialiser le registre avant de le require.
function loadWith(opts: {
  executionEnvironment: string;
  appOwnership: string | null;
  nativePresent: boolean;
}) {
  let mod: typeof import('../constants/trackPlayer');
  jest.isolateModules(() => {
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
      default: {
        executionEnvironment: opts.executionEnvironment,
        appOwnership: opts.appOwnership,
      },
    }));
    // On garde le vrai `react-native` (des dependances transitives en ont
    // besoin) et on ne remplace que NativeModules, seul point qui nous
    // interesse ici.
    jest.doMock('react-native', () => {
      const actual = jest.requireActual('react-native');
      // Proxy plutot que spread : l'index de react-native expose ses exports
      // via des getters PARESSEUX (FlatList, DevMenu...). Un `...actual` les
      // evalue tous d'un coup, ce qui plante hors runtime natif. Le proxy ne
      // detourne que NativeModules et laisse le reste intact.
      return new Proxy(actual, {
        get: (target, prop, receiver) =>
          prop === 'NativeModules'
            ? (opts.nativePresent ? { TrackPlayerModule: {} } : {})
            : Reflect.get(target, prop, receiver),
      });
    });
    // audioDownload tire toute la couche API (et donc expo-router) : hors
    // sujet pour ce test, et couteux a instancier.
    jest.doMock('../constants/audioDownload', () => ({
      localSudaisPath: (n: number) => `/tmp/${n}.mp3`,
    }));
    mod = require('../constants/trackPlayer');
  });
  return mod!;
}

it("un build standalone Android n'est jamais pris pour Expo Go, meme si appOwnership ment", () => {
  // Le cas exact du bug : appOwnership dit 'expo' alors qu'on est standalone.
  const m = loadWith({
    executionEnvironment: 'standalone',
    appOwnership: 'expo',
    nativePresent: false,
  });

  expect(m.IS_EXPO_GO).toBe(false);
  // Donc l'ecran affiche « c'est casse chez nous », pas « installe un dev build ».
  expect(m.AUDIO_UNEXPECTEDLY_MISSING).toBe(true);
});

it('le natif absent est detecte meme quand le module JS se charge sans erreur', () => {
  const m = loadWith({
    executionEnvironment: 'standalone',
    appOwnership: null,
    nativePresent: false,
  });

  expect(m.AUDIO_AVAILABLE).toBe(false);
  // La cause doit etre exploitable a distance, pas un null muet : c'est elle
  // que l'ecran affiche entre parentheses sous le message d'erreur.
  expect(m.AUDIO_LOAD_ERROR).toBeTruthy();
});

it('un build standalone avec le natif linke annonce bien l audio disponible', () => {
  const m = loadWith({
    executionEnvironment: 'standalone',
    appOwnership: null,
    nativePresent: true,
  });

  expect(m.AUDIO_AVAILABLE).toBe(true);
  expect(m.AUDIO_UNEXPECTEDLY_MISSING).toBe(false);
  expect(m.AUDIO_LOAD_ERROR).toBeNull();
});

it('dans Expo Go, le natif absent reste une limitation normale', () => {
  const m = loadWith({
    executionEnvironment: 'storeClient',
    appOwnership: 'expo',
    nativePresent: false,
  });

  expect(m.IS_EXPO_GO).toBe(true);
  expect(m.AUDIO_AVAILABLE).toBe(false);
  // Ici « development build » est le bon message : pas d'alerte bug.
  expect(m.AUDIO_UNEXPECTEDLY_MISSING).toBe(false);
});
