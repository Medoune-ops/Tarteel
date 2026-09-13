/**
 * Façade du lecteur audio du Coran.
 *
 * ⚠️ CE FICHIER NE CONTIENT PLUS DE LOGIQUE. L'implémentation réelle vit
 * désormais dans :
 *   - `constants/audioPlayer.ts` — le lecteur, bâti sur `expo-audio`
 *   - `hooks/useAudio.ts`        — les hooks React
 *
 * Pourquoi cette façade existe
 * ----------------------------
 * Quatre écrans importent depuis `constants/trackPlayer` :
 * tajwid.tsx, coran-player.tsx, MiniPlayer.tsx et le store de téléchargement.
 * En gardant ce module comme point d'entrée, le remplacement complet du moteur
 * audio n'a demandé AUCUNE modification dans ces écrans.
 *
 * Pourquoi le moteur a changé
 * ---------------------------
 * react-native-track-player 4.x est conçu pour l'ANCIENNE architecture React
 * Native. Sous la New Architecture (bridgeless, défaut du SDK 54), son service
 * Android récupère le contexte React par un chemin qui rend `null`, et un `?.`
 * faisait disparaître chaque événement en silence.
 *
 * Constaté sur appareil (Galaxy A17, build 22, adb logcat) : le son sortait et
 * la session média publiait bien PLAYING/PAUSED au système, mais ZÉRO événement
 * n'atteignait le JS sur 19 214 lignes de logs. D'où, côté interface :
 *   - `useActiveTrack()` restait undefined → mini-lecteur jamais affiché
 *     (MiniPlayer fait `if (!track) return null`) ;
 *   - `useIsPlaying()` ne basculait pas → icône figée sur play alors que le son
 *     s'arrêtait bien ;
 *   - `useProgress()` ne recevait rien → barre morte, temps à 0:00.
 *
 * Six correctifs successifs sur RNTP (émetteur JS, addListener natif, ReactHost)
 * ont échoué. `expo-audio` est maintenu par Expo, donc compatible New
 * Architecture par construction, et il était DÉJÀ présent et fonctionnel dans
 * l'app (sons d'interface, enregistrement micro).
 */

// ── Lecteur (constants/audioPlayer.ts) ──────────────────────────────────────
export {
  AUDIO_AVAILABLE,
  AUDIO_UNEXPECTEDLY_MISSING,
  AUDIO_LOAD_ERROR,
  RepeatMode,
  audioControls,
  playSurates,
  changeReciter,
  refreshLocalSudaisCache,
  getCurrentSourates,
  getCurrentReciterId,
  getCurrentIndex,
} from './audioPlayer';

export type { SourateLite, ActiveTrack } from './audioPlayer';

// ── Hooks React (hooks/useAudio.ts) ─────────────────────────────────────────
export { useActiveTrack, useProgress, useIsPlaying } from '../hooks/useAudio';

/**
 * Conservé pour compatibilité : plusieurs écrans testent `IS_EXPO_GO` pour
 * distinguer une limitation d'environnement d'un vrai bug. `expo-audio` étant
 * embarqué dans Expo Go, l'écoute y fonctionne désormais — la distinction n'a
 * plus d'effet sur l'audio, mais l'export reste pour ne pas casser les appels.
 */
export { IS_EXPO_GO } from './audioEnvironment';
