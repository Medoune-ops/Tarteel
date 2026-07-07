/**
 * Complétion d'une leçon.
 *
 * `POST /lesson/complete` calcule l'XP, la série, les cœurs, etc. côté serveur
 * et renvoie la forme PLATE de `/me` (même contrat que GET /me). On hydrate
 * donc le store directement avec la réponse.
 *
 * ⚠️ `lessonId` est l'**id (cuid)** de la leçon renvoyé par l'API de contenu,
 * PAS un numéro de séquence. L'XP n'est créditée qu'à la première complétion
 * (rejouer renvoie l'état inchangé — anti-farm côté serveur).
 */
import { apiFetch } from './client';
import { useUserStore } from '../../store/userStore';
import type { MeResponse } from './me';
import type { Lesson } from '../../constants/lessonEngine';

/** `GET /lessons/:id` — la séquence d'étapes (réponses correctes non incluses, judging server-side). */
export async function fetchLesson(lessonId: string): Promise<Lesson> {
  const data = await apiFetch<{ lesson: Lesson }>(`/lessons/${encodeURIComponent(lessonId)}`);
  return data.lesson;
}

export interface CompleteLessonInput {
  lessonId: string;
  correctAnswers: number;
  totalAnswers: number;
  /** Durée de la leçon en millisecondes (indicatif pour l'instant). */
  durationMs?: number;
}

/** Appelle POST /lesson/complete et hydrate le store avec l'état renvoyé. */
export async function completeLesson(input: CompleteLessonInput): Promise<MeResponse> {
  const data = await apiFetch<MeResponse>('/lesson/complete', {
    method: 'POST',
    json: input,
  });
  useUserStore.getState().hydrateFromBackend(data);
  return data;
}

export interface AnswerInput {
  /** Étape écrite : id de l'option choisie. */
  optionId?: string;
  /** Étape voix : score de reconnaissance 0–100. */
  score?: number;
  transcription?: string;
  /** Étape remise en ordre : positions soumises par l'utilisateur. */
  positions?: number[];
}

/**
 * Réponse du judging serveur. La correction est **autoritaire côté serveur** ;
 * `bonneReponse` (id de la bonne option) n'est révélé qu'APRÈS la réponse, pour
 * surligner l'option correcte. Sur une faute, un cœur peut être déduit côté
 * serveur (reflété par `heartsLeft`).
 */
export interface AnswerResult {
  correct: boolean;
  bonneReponse?: string;
  heartsLeft: number;
  outOfHearts: boolean;
  unlimited: boolean;
  msUntilNextHeart: number;
}

/**
 * POST /lessons/:id/steps/:stepId/answer — soumet une réponse, le serveur juge
 * et gère les cœurs. On reflète l'état des cœurs renvoyé dans le store local
 * pour rester en phase avec la source de vérité serveur.
 */
export async function answerStep(
  lessonId: string,
  stepId: string,
  input: AnswerInput,
): Promise<AnswerResult> {
  const result = await apiFetch<AnswerResult>(
    `/lessons/${lessonId}/steps/${stepId}/answer`,
    { method: 'POST', json: input },
  );

  // Refléter l'état des cœurs serveur dans le store (sans timer local : on pose
  // l'ancre maintenant si on vient de perdre un cœur, null si plein/illimité).
  const store = useUserStore.getState();
  if (result.unlimited || result.heartsLeft >= 5) {
    store.refillHearts();
  } else {
    useUserStore.setState({
      hearts: result.heartsLeft,
      lastHeartLossAt: result.msUntilNextHeart > 0 ? Date.now() : store.lastHeartLossAt,
    });
  }

  return result;
}
