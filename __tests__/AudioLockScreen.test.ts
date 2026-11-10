/**
 * Contrat de la carte média de l'écran verrouillé (constants/audioPlayer.ts).
 *
 * Pourquoi ces tests
 * ------------------
 * La barre de progression de l'écran verrouillé n'est PAS dessinée par l'app :
 * iOS (MPNowPlayingInfoCenter) et Android (MediaSession) la fabriquent à partir
 * de la position/durée publiées par le lecteur natif. Tout ce que le JS doit
 * faire, c'est :
 *   1. activer la session média une seule fois (`setActiveForLockScreen`) ;
 *   2. la rafraîchir au changement de sourate (`updateLockScreenMetadata`).
 *
 * Le piège corrigé ici : rappeler `setActiveForLockScreen` à chaque sourate
 * détruit puis reconstruit la session (Android) et repart d'un Now Playing vide
 * (iOS) — la carte clignote, voire disparaît si la reconstruction échoue.
 */

// audioDownload tire toute la couche API (donc expo-router) : hors sujet ici.
jest.mock('../constants/audioDownload', () => ({
  localSudaisPath: (n: number) => `/tmp/${n}.mp3`,
}));

const SOURATES = [
  { numero: 1, nom: 'Al-Fatiha', nomArabe: 'الفاتحة' },
  { numero: 2, nom: 'Al-Baqara', nomArabe: 'البقرة' },
];
const RECITER = { id: 'basit', nom: 'Abdul Basit', baseUrl: 'https://example.test/basit/' };

/**
 * Recharge le lecteur à neuf : son état (file, index, session active) vit au
 * niveau module, il ne doit donc pas fuiter d'un test à l'autre.
 */
function setup() {
  jest.resetModules();
  const expoAudio = require('expo-audio') as {
    createAudioPlayer: jest.Mock;
  };
  const audio = require('../constants/audioPlayer') as typeof import('../constants/audioPlayer');
  return {
    audio,
    player: () => expoAudio.createAudioPlayer.mock.results[0]!.value,
  };
}

describe('écran verrouillé — publication de la session média', () => {
  it('active la session UNE seule fois, puis ne met à jour que les métadonnées', async () => {
    const { audio, player } = setup();

    await audio.playSurates(SOURATES, RECITER, 0);
    const p = player();

    expect(p.setActiveForLockScreen).toHaveBeenCalledTimes(1);
    expect(p.setActiveForLockScreen).toHaveBeenCalledWith(
      true,
      { title: '1. Al-Fatiha', artist: 'Abdul Basit', albumTitle: 'Coran' },
      { showSeekForward: true, showSeekBackward: true },
    );

    // Sourate suivante : surtout NE PAS reconstruire la session.
    audio.audioControls.skipToNext();

    expect(p.setActiveForLockScreen).toHaveBeenCalledTimes(1);
    expect(p.updateLockScreenMetadata).toHaveBeenCalledWith({
      title: '2. Al-Baqara',
      artist: 'Abdul Basit',
      albumTitle: 'Coran',
    });
  });

  it('réactive la session après un arrêt complet', async () => {
    const { audio, player } = setup();

    await audio.playSurates(SOURATES, RECITER, 0);
    const p = player();

    audio.audioControls.stop();
    expect(p.clearLockScreenControls).toHaveBeenCalledTimes(1);

    // Après stop(), la session a été détruite : la lecture suivante doit la
    // recréer, sinon l'écran verrouillé resterait vide pour de bon.
    await audio.playSurates(SOURATES, RECITER, 1);
    expect(p.setActiveForLockScreen).toHaveBeenCalledTimes(2);
  });
});
