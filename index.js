// Point d'entrée de l'app. On enregistre le service de lecture RNTP (contrôles
// écran verrouillé / arrière-plan) AVANT de démarrer expo-router.
// ⚠️ react-native-track-player est un module natif → nécessite un development
// build (npx expo run:android / eas build). Indisponible dans Expo Go.
//
// L'enregistrement est protégé : si le module natif n'est pas disponible
// (Expo Go, incompatibilité), l'app démarre quand même — seule l'écoute audio
// du Coran sera indisponible, le reste fonctionne normalement.
try {
  const TrackPlayer = require('react-native-track-player').default;
  TrackPlayer.registerPlaybackService(() => require('./playbackService').default);
} catch (e) {
  console.warn('[audio] react-native-track-player indisponible (dev build requis) :', e?.message);
}

require('expo-router/entry');
