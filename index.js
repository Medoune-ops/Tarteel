// Point d'entrée de l'app. On enregistre le service de lecture RNTP (contrôles
// écran verrouillé / arrière-plan) AVANT de démarrer expo-router.
// ⚠️ react-native-track-player est un module natif → nécessite un development
// build (npx expo run:android / eas build). Indisponible dans Expo Go.
const TrackPlayer = require('react-native-track-player').default;
TrackPlayer.registerPlaybackService(() => require('./playbackService').default);

require('expo-router/entry');
