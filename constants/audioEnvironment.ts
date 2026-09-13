/**
 * Détection de l'environnement d'exécution, isolée ici pour rester importable
 * sans tirer tout le lecteur audio.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * true dans Expo Go.
 *
 * ⚠️ On lit `executionEnvironment` et NON `appOwnership` : ce dernier est
 * déprécié depuis le SDK 50 et n'est pas fiable sur un build standalone
 * Android, où il peut encore remonter 'expo'. L'app se croyait alors dans
 * Expo Go et affichait « installe un development build » à un utilisateur qui
 * avait déjà la vraie app du Play Store — message faux, qui masquait le vrai
 * problème.
 */
export const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
