/**
 * Leçon en cours, gardée sur le téléphone : une coupure réseau ou une fermeture
 * de l'app ne fait plus repartir de la première étape.
 *
 * On garde aussi une copie de la leçon, pour la rouvrir sans réseau. Elle ne
 * contient pas les réponses (judging serveur) : les découvertes et associations
 * marchent hors-ligne, les étapes notées attendent le retour du réseau.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lesson } from '../constants/lessonEngine';
import { LESSON_RESUME_KEY } from './api/tokens';

/**
 * Au-delà, la leçon repart de zéro. Doit rester sous les 7 jours de conservation
 * des verdicts côté serveur, pour qu'un renvoi retrouve toujours le sien.
 */
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export interface LessonResume {
  lesson: Lesson;
  attemptId: string;
  index: number;
  correctCount: number;
  elapsedMs: number;
  savedAt: number;
}

/** La leçon en cours si c'est bien celle-ci et qu'elle est encore valable. */
export async function readLessonResume(lessonId: string): Promise<LessonResume | null> {
  try {
    const raw = await AsyncStorage.getItem(LESSON_RESUME_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as LessonResume;
    if (saved.lesson?.id !== lessonId) return null;
    if (Date.now() - saved.savedAt > MAX_AGE_MS) return null;
    if (!(saved.index >= 0 && saved.index < (saved.lesson.steps?.length ?? 0))) return null;
    return saved;
  } catch {
    return null;
  }
}

/** Best-effort : un stockage indisponible ne doit jamais bloquer la leçon. */
export async function saveLessonResume(resume: Omit<LessonResume, 'savedAt'>): Promise<void> {
  try {
    await AsyncStorage.setItem(LESSON_RESUME_KEY, JSON.stringify({ ...resume, savedAt: Date.now() }));
  } catch {
    /* la leçon continue, seule la reprise est perdue */
  }
}

export async function clearLessonResume(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LESSON_RESUME_KEY);
  } catch {
    /* expirera seule */
  }
}

/** La leçon n'a pas changé : l'étape gardée désigne toujours la même question. */
export function sameSteps(a: Lesson, b: Lesson): boolean {
  const ids = (l: Lesson) => (l.steps ?? []).map((s) => s.id).join(',');
  return ids(a) === ids(b);
}

export function newAttemptId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Clé d'idempotence d'une réponse (header Idempotency-Key). Stable pour une même
 * réponse dans une même tentative : la renvoyer rejoue le verdict sans recoûter
 * de cœur. Une autre réponse donne une autre clé, donc un nouveau jugement.
 */
export function answerKey(attemptId: string, answer: string): string {
  let hash = 5381;
  for (let i = 0; i < answer.length; i++) {
    hash = ((hash * 33) ^ answer.charCodeAt(i)) >>> 0;
  }
  return `${attemptId}-${hash.toString(36)}`;
}
