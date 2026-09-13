/**
 * Contrat de la façade audio (constants/trackPlayer.ts).
 *
 * Ce fichier verrouillait auparavant la DÉTECTION du module natif
 * react-native-track-player : deux bugs empilés faisaient afficher
 * « nécessite un development build » à un utilisateur qui avait la vraie app
 * du Play Store.
 *
 * Le moteur a depuis été remplacé par `expo-audio` (voir constants/audioPlayer.ts) :
 * RNTP 4.x, conçu pour l'ancienne architecture, ne faisait plus remonter aucun
 * événement au JS sous la New Architecture du SDK 54 — mini-lecteur invisible,
 * icône pause figée, barre de progression morte.
 *
 * Les deux bugs d'origine ne peuvent donc plus se reproduire : il n'y a plus de
 * module natif optionnel à détecter, et `expo-audio` est embarqué dans Expo Go.
 * Ce qu'on protège ici est ce qui compte désormais : que la façade expose bien
 * tout ce dont les écrans ont besoin, sous les mêmes noms qu'avant.
 *
 * C'est cette stabilité de noms qui a permis de remplacer entièrement le moteur
 * audio SANS toucher une ligne de tajwid.tsx, coran-player.tsx ni MiniPlayer.tsx.
 */

// audioDownload tire toute la couche API (et donc expo-router) : hors sujet
// ici, et coûteux à instancier.
jest.mock('../constants/audioDownload', () => ({
  localSudaisPath: (n: number) => `/tmp/${n}.mp3`,
}));

import * as facade from '../constants/trackPlayer';

describe('façade audio — surface exposée aux écrans', () => {
  it('expose les hooks consommés par le lecteur et le mini-lecteur', () => {
    // MiniPlayer.tsx et coran-player.tsx importent exactement ces trois hooks.
    expect(typeof facade.useActiveTrack).toBe('function');
    expect(typeof facade.useProgress).toBe('function');
    expect(typeof facade.useIsPlaying).toBe('function');
  });

  it('expose les contrôles de lecture attendus par les écrans', () => {
    // Chaque bouton de coran-player.tsx et de MiniPlayer.tsx appelle l'un
    // d'eux : un nom manquant casserait l'interface en silence.
    for (const nom of [
      'play', 'pause', 'skipToNext', 'skipToPrevious',
      'seekTo', 'setRate', 'setRepeatMode', 'stop',
    ]) {
      expect(typeof (facade.audioControls as Record<string, unknown>)[nom]).toBe('function');
    }
  });

  it('expose les fonctions de file et de récitateur utilisées par Tajwid', () => {
    expect(typeof facade.playSurates).toBe('function');
    expect(typeof facade.changeReciter).toBe('function');
    expect(typeof facade.refreshLocalSudaisCache).toBe('function');
    expect(typeof facade.getCurrentSourates).toBe('function');
    expect(typeof facade.getCurrentReciterId).toBe('function');
  });

  it('conserve les trois modes de répétition, avec les mêmes valeurs qu’avant', () => {
    // coran-player.tsx compare à RepeatMode.Track / RepeatMode.Queue : changer
    // ces valeurs inverserait silencieusement le bouton « boucle ».
    expect(facade.RepeatMode.Off).toBe(0);
    expect(facade.RepeatMode.Track).toBe(1);
    expect(facade.RepeatMode.Queue).toBe(2);
  });

  it('annonce l’audio disponible : plus de module natif optionnel à détecter', () => {
    // Avec expo-audio (embarqué, y compris dans Expo Go), l'écoute n'est plus
    // conditionnée à la présence d'un natif linké à part. La bannière
    // « indisponible » de tajwid.tsx ne doit donc jamais s'afficher.
    expect(facade.AUDIO_AVAILABLE).toBe(true);
    expect(facade.AUDIO_UNEXPECTEDLY_MISSING).toBe(false);
    expect(facade.AUDIO_LOAD_ERROR).toBeNull();
  });
});
