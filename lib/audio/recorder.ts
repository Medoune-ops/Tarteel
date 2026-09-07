/**
 * Enregistrement micro — helpers autour d'expo-audio (SDK 54).
 *
 * Les écrans utilisent le hook `useAudioRecorder(RecordingPresets.HIGH_QUALITY)`
 * d'expo-audio directement ; ce module centralise ce qui est partagé :
 *
 *  - la demande de permission micro (avec message si refusée) ;
 *  - la bascule du mode audio : iOS exige `allowsRecording: true` pour
 *    enregistrer, mais ce mode baisse le volume de lecture — il faut donc
 *    le désactiver dès qu'on a fini (sinon les récitations audio de l'app
 *    deviennent quasi inaudibles).
 */
import { AudioModule, setAudioModeAsync } from 'expo-audio';

/** Demande (si besoin) la permission micro. true si accordée. */
export async function ensureMicPermission(): Promise<boolean> {
  try {
    const status = await AudioModule.requestRecordingPermissionsAsync();
    return status.granted;
  } catch (e) {
    // Un refus utilisateur normal renvoie granted:false SANS lever — arriver
    // ici signale un vrai problème (module natif, permission mal déclarée…).
    console.error('[audio] requestRecordingPermissionsAsync a échoué :', e);
    return false;
  }
}

/** À appeler AVANT recorder.record() — active la session d'enregistrement. */
export async function enterRecordingMode(): Promise<void> {
  try {
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  } catch (e) {
    // best-effort : sur web/simulateur le mode peut être indisponible.
    // Sur un vrai appareil, un échec ici veut dire que l'enregistrement va
    // suivre sans le bon mode — d'où la trace, pour ne pas le découvrir
    // seulement via « ça n'enregistre rien ».
    console.warn('[audio] enterRecordingMode a échoué :', e);
  }
}

/** À appeler APRÈS l'enregistrement — rétablit le mode lecture normal. */
export async function exitRecordingMode(): Promise<void> {
  try {
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
  } catch (e) {
    // best-effort — mais un échec ici laisse le volume de lecture bas
    // (voir le commentaire en tête de fichier), d'où la trace.
    console.warn('[audio] exitRecordingMode a échoué :', e);
  }
}
