/**
 * Cache DISQUE pour le contenu quasi-immuable (AsyncStorage).
 *
 * À ne pas confondre avec `swr.ts`, qui est un cache MÉMOIRE : celui-ci meurt
 * à la fermeture de l'app. C'est exactement ce qui rendait le mode hors-ligne
 * du Tajwid inutilisable — les 114 récitations étaient bien sur le disque,
 * mais l'écran refusait de s'ouvrir parce que la liste des sourates, elle,
 * n'avait pas survécu au redémarrage.
 *
 * ⚠️ Réservé aux données qui ne dépendent PAS de l'utilisateur et ne changent
 * quasiment jamais (liste des 114 sourates). Surtout pas pour la progression,
 * les cœurs ou les ligues : servir de telles données périmées après un
 * redémarrage donnerait un état faux, alors qu'un simple refetch les corrige.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'tarteel.cache.';

/**
 * Clé du catalogue des 114 sourates. Partagée par les écrans Tajwid et
 * Lecture libre : c'est le même contenu immuable, autant qu'une seule visite
 * en ligne serve aux deux.
 */
export const SOURATES_CACHE_KEY = 'sourates:all';

/** Lit une valeur du cache disque, ou null (absente / illisible). */
export async function readPersisted<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // JSON corrompu ou stockage indisponible : on se comporte comme si le
    // cache était vide, jamais d'erreur remontée à l'écran.
    return null;
  }
}

/** Écrit une valeur dans le cache disque. Best-effort : n'échoue jamais. */
export async function writePersisted(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Disque plein / quota : le cache est un confort, pas une garantie.
  }
}
