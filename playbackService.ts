/**
 * Service de lecture react-native-track-player : traite les commandes distantes
 * (écran verrouillé, notification, casque Bluetooth). Enregistré au démarrage
 * dans index.js via TrackPlayer.registerPlaybackService.
 */
import TrackPlayer, { Event } from 'react-native-track-player';

export default async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => { TrackPlayer.skipToNext().catch(() => {}); });
  TrackPlayer.addEventListener(Event.RemotePrevious, () => { TrackPlayer.skipToPrevious().catch(() => {}); });
  TrackPlayer.addEventListener(Event.RemoteStop, () => { TrackPlayer.stop(); });
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => { TrackPlayer.seekTo(e.position); });
}
