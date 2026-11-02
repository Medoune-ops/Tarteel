/**
 * Leçons terminées en attente de validation par le serveur.
 *
 * Une leçon est écrite sur le téléphone AVANT l'appel réseau, puis retirée une
 * fois validée. Sans réseau elle attend ici, et repart au retour de la connexion
 * ou à la prochaine ouverture de l'app. Rejouer est sans risque : POST
 * /lesson/complete ne crédite l'XP qu'à la première complétion.
 *
 * Toujours rejouées dans l'ordre : le serveur refuse une leçon si la précédente
 * n'est pas validée.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiError, isRetryableError } from './client';
import { completeLesson, type CompleteLessonInput } from './lesson';
import type { MeResponse } from './me';
import { invalidate } from './swr';
import { PENDING_COMPLETIONS_KEY } from './tokens';
import { useUserStore } from '../../store/userStore';

type Listener = (lessonId: string, data: MeResponse) => void;
const listeners = new Set<Listener>();

/** Prévient quand une leçon vient d'être validée par le serveur. */
export function onLessonSynced(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

async function readQueue(): Promise<CompleteLessonInput[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_COMPLETIONS_KEY);
    return raw ? (JSON.parse(raw) as CompleteLessonInput[]) : [];
  } catch {
    return [];
  }
}

// Les écritures passent l'une après l'autre : un ajout pendant un envoi ne doit
// pas écraser la file.
let writes: Promise<unknown> = Promise.resolve();
function updateQueue(change: (queue: CompleteLessonInput[]) => CompleteLessonInput[]): Promise<void> {
  const next = writes.then(async () => {
    const queue = change(await readQueue());
    if (queue.length > 0) await AsyncStorage.setItem(PENDING_COMPLETIONS_KEY, JSON.stringify(queue));
    else await AsyncStorage.removeItem(PENDING_COMPLETIONS_KEY);
  });
  writes = next.catch(() => {});
  return next;
}

/** Ajoute une leçon terminée ; rejouée, elle garde sa place dans la file. */
export function enqueueCompletion(input: CompleteLessonInput): Promise<void> {
  return updateQueue((queue) =>
    queue.some((q) => q.lessonId === input.lessonId)
      ? queue.map((q) => (q.lessonId === input.lessonId ? input : q))
      : [...queue, input],
  );
}

export async function hasPendingCompletion(lessonId: string): Promise<boolean> {
  return (await readQueue()).some((q) => q.lessonId === lessonId);
}

/** Le serveur pourra répondre plus tard : on garde la leçon. Sinon elle est refusée pour de bon. */
function shouldKeep(error: unknown): boolean {
  return isRetryableError(error) || (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED');
}

async function sendQueue(): Promise<void> {
  for (;;) {
    const [next] = await readQueue();
    if (!next) return;
    try {
      const data = await completeLesson(next);
      await updateQueue((queue) => queue.filter((q) => q.lessonId !== next.lessonId));
      // Parcours, classement et calendrier ont changé : vrai re-fetch au prochain
      // affichage. La clé du parcours inclut la langue (cf. parcours.tsx).
      invalidate(`sections:${useUserStore.getState().language}`);
      invalidate('league');
      invalidate(`activity:${new Date().toISOString().slice(0, 7)}`);
      listeners.forEach((listener) => listener(next.lessonId, data));
    } catch (error) {
      console.log('[lessonSync] completeLesson FAILED', error);
      if (shouldKeep(error)) return;
      await updateQueue((queue) => queue.filter((q) => q.lessonId !== next.lessonId));
    }
  }
}

let flushing: Promise<void> | null = null;
let flushAgain = false;

/** Envoie les leçons en attente. Ne lève jamais ; un seul envoi à la fois. */
export function flushCompletions(): Promise<void> {
  if (flushing) {
    flushAgain = true;
    return flushing;
  }
  flushing = (async () => {
    do {
      flushAgain = false;
      await sendQueue().catch(() => {});
    } while (flushAgain);
  })().finally(() => { flushing = null; });
  return flushing;
}
