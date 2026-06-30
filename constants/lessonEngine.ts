/**
 * Moteur de leçon — structure d'une session d'apprentissage.
 *
 * ⚠️ STRUCTURE MIROIR DE L'API.
 * Quand on entre dans un badge (node du parcours), le backend renverra une
 * séquence d'étapes via `GET /lessons/:id`. Ce fichier définit la FORME de
 * cette séquence. `buildSampleLesson()` n'est qu'un exemple pour faire tourner
 * le moteur en attendant l'API — il sera remplacé par le fetch.
 *
 * Une leçon = une suite d'étapes (max 25) qui ALTERNENT librement entre :
 *   - 'discovery'  : Découverte — on montre le verset (AUCUN cœur en jeu)
 *   - 'written'    : Test écrit — QCM / association (1 faute = −1 cœur)
 *
 * ⚠️ Le type 'voice' est RETIRÉ jusqu'au branchement de Whisper côté backend.
 * La dernière étape est une 'discovery' du verset intégral (écoute + répétition
 * à voix basse). Quand Whisper sera prêt, réintroduire VoiceStep ici et dans
 * buildSampleLesson(), et ajouter VoiceView dans play.tsx.
 */

export const MAX_LESSON_STEPS = 25;

export type StepType = 'discovery' | 'written';

/** Étape Découverte : présenter un verset/mot, sans évaluation. */
export interface DiscoveryStep {
  type: 'discovery';
  id: string;
  arabe: string;
  translitteration: string;
  traduction: string;
  audioUrl?: string | null;
}

/** Étape Test écrit (QCM) : choisir la bonne réponse. */
export interface WrittenStep {
  type: 'written';
  id: string;
  consigne: string;        // ex: "Que signifie ce mot ?"
  arabe: string;           // le mot/verset interrogé
  translitteration?: string;
  options: { id: string; text: string }[];
  /**
   * Id de la bonne option. ABSENT des leçons renvoyées par l'API (anti-triche :
   * le judging est server-side, cf. POST /lessons/:id/steps/:stepId/answer).
   * Présent uniquement dans buildSampleLesson() (démo locale).
   */
  bonneReponse?: string;
}

export type LessonStep = DiscoveryStep | WrittenStep;

/** Une leçon complète telle que renvoyée par l'API. */
export interface Lesson {
  id: string;
  titre: string;
  steps: LessonStep[];
}

// ─── Exemple local (à remplacer par GET /lessons/:id) ────────────────────────

/** Verset de démo : Al-Fatiha, basmala — découpé en mots. */
const DEMO = {
  versetArabe: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
  versetTranslit: "Bismi-llāhi r-raḥmāni r-raḥīm",
  versetTrad: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
  mots: [
    { arabe: 'بِسْمِ',      translit: 'Bismi',    sens: "Au nom de" },
    { arabe: 'اللَّهِ',     translit: 'Allāhi',   sens: "Allah" },
    { arabe: 'الرَّحْمَٰنِ', translit: 'Ar-Raḥmān', sens: "Le Tout Miséricordieux" },
    { arabe: 'الرَّحِيمِ',   translit: 'Ar-Raḥīm',  sens: "Le Très Miséricordieux" },
  ],
};

let _uid = 0;
const uid = (p: string) => `${p}-${_uid++}`;

function discoveryFor(mot: typeof DEMO.mots[number]): DiscoveryStep {
  return {
    type: 'discovery',
    id: uid('disc'),
    arabe: mot.arabe,
    translitteration: mot.translit,
    traduction: mot.sens,
    audioUrl: null,
  };
}

function writtenFor(mot: typeof DEMO.mots[number]): WrittenStep {
  // Distracteurs = les autres sens.
  const autres = DEMO.mots.filter((m) => m.arabe !== mot.arabe).map((m) => m.sens);
  const options = [
    { id: 'A', text: mot.sens },
    { id: 'B', text: autres[0] },
    { id: 'C', text: autres[1] ?? 'Le Guide' },
    { id: 'D', text: autres[2] ?? 'Le Créateur' },
  ];
  return {
    type: 'written',
    id: uid('writ'),
    consigne: 'Que signifie ce mot ?',
    arabe: mot.arabe,
    translitteration: mot.translit,
    options,
    bonneReponse: 'A',
  };
}

/** Découverte du verset intégral — écoute et répète à voix basse. */
function discoveryFull(): DiscoveryStep {
  return {
    type: 'discovery',
    id: uid('disc-full'),
    arabe: DEMO.versetArabe,
    translitteration: DEMO.versetTranslit,
    traduction: DEMO.versetTrad,
    audioUrl: null,
    // ⚠️ Quand Whisper sera prêt : remplacer cette étape par VoiceStep.
  };
}

/**
 * Construit une leçon d'exemple : pour chaque mot, Découverte → Test écrit,
 * puis une Découverte du verset complet (écoute + répétition à voix basse).
 * Plafonné à MAX_LESSON_STEPS.
 */
export function buildSampleLesson(): Lesson {
  _uid = 0;
  const steps: LessonStep[] = [];
  for (const mot of DEMO.mots) {
    steps.push(discoveryFor(mot));
    steps.push(writtenFor(mot));
  }
  steps.push(discoveryFull());
  return {
    id: 'demo-lesson',
    titre: 'Al-Fatiha · Basmala',
    steps: steps.slice(0, MAX_LESSON_STEPS),
  };
}
