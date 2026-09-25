/**
 * Garde-fous de la demande de note sur les stores.
 *
 * Cette logique mérite des tests parce qu'elle est impossible à vérifier à la
 * main : la popup native ne s'affiche ni en Expo Go, ni sur simulateur, ni sur
 * TestFlight, ne renvoie aucun retour, et les quotas des stores (Apple ~3 par
 * an et par utilisateur) se comptent en MOIS. Une régression ici ne se verrait
 * donc qu'en production, sous la forme d'utilisateurs sollicités trop tôt ou
 * trop souvent — et d'occasions de notation gaspillées.
 */
import {
  useReviewPromptStore,
  MIN_LESSONS_BEFORE_PROMPT,
  MIN_AGE_BEFORE_PROMPT_MS,
  RETRY_AFTER_DECLINE_MS,
} from '../store/reviewPromptStore';

/** Remet le store dans l'état d'une installation neuve. */
function resetStore() {
  useReviewPromptStore.setState({
    firstSeenAt: null,
    lessonsCompleted: 0,
    lastPromptedAt: null,
    hasRated: false,
    visible: false,
  });
}

/** Place le store dans l'état « tous les garde-fous sont franchis ». */
function makeEligible() {
  useReviewPromptStore.setState({
    firstSeenAt: Date.now() - MIN_AGE_BEFORE_PROMPT_MS - 1000,
    lessonsCompleted: MIN_LESSONS_BEFORE_PROMPT,
    lastPromptedAt: null,
    hasRated: false,
  });
}

beforeEach(resetStore);

describe('canPrompt (garde-fous avant de demander une note)', () => {
  it('accepte quand ancienneté et nombre de leçons sont atteints', () => {
    makeEligible();
    expect(useReviewPromptStore.getState().canPrompt()).toBe(true);
  });

  it("refuse tant que l'app est installée depuis moins de 48 h", () => {
    makeEligible();
    // Installé il y a 47 h : le seuil d'ancienneté n'est pas franchi.
    useReviewPromptStore.setState({ firstSeenAt: Date.now() - 47 * 60 * 60 * 1000 });
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
  });

  it('refuse en dessous du nombre de leçons requis', () => {
    makeEligible();
    useReviewPromptStore.setState({ lessonsCompleted: MIN_LESSONS_BEFORE_PROMPT - 1 });
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
  });

  it("refuse si firstSeenAt n'a jamais été amorcé (pas d'ancienneté connue)", () => {
    makeEligible();
    // Sans date de première ouverture, on s'abstient au lieu de traiter l'app
    // comme installée depuis toujours.
    useReviewPromptStore.setState({ firstSeenAt: null });
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
  });

  it('ne redemande JAMAIS à quelqu’un qui a déjà noté', () => {
    makeEligible();
    useReviewPromptStore.getState().markRated();
    // Même très longtemps après, et quel que soit le nombre de leçons.
    useReviewPromptStore.setState({
      lessonsCompleted: 500,
      lastPromptedAt: Date.now() - 10 * RETRY_AFTER_DECLINE_MS,
    });
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
  });

  it('attend 120 jours avant de re-proposer après un refus', () => {
    makeEligible();
    useReviewPromptStore.getState().markDeclined();
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);

    // Un jour avant l'échéance : toujours non.
    useReviewPromptStore.setState({ lastPromptedAt: Date.now() - RETRY_AFTER_DECLINE_MS + 24 * 60 * 60 * 1000 });
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);

    // Passé le délai : on peut redemander.
    useReviewPromptStore.setState({ lastPromptedAt: Date.now() - RETRY_AFTER_DECLINE_MS - 1000 });
    expect(useReviewPromptStore.getState().canPrompt()).toBe(true);
  });

  it('bloque une 2e demande juste après une 1re restée sans réponse', () => {
    makeEligible();
    // show() horodate la demande : un dismiss sans répondre ne doit pas
    // permettre de reproposer la modale à la leçon suivante.
    useReviewPromptStore.getState().show();
    useReviewPromptStore.getState().hide();
    expect(useReviewPromptStore.getState().canPrompt()).toBe(false);
  });
});

describe('init / recordLesson', () => {
  it('amorce firstSeenAt une seule fois', () => {
    const { init } = useReviewPromptStore.getState();
    init();
    const first = useReviewPromptStore.getState().firstSeenAt;
    expect(first).not.toBeNull();

    // Un relancement de l'app ne doit pas repousser la date de référence,
    // sinon le délai de 48 h redémarrerait à chaque ouverture et la note ne
    // serait jamais demandée.
    init();
    expect(useReviewPromptStore.getState().firstSeenAt).toBe(first);
  });

  it('compte les leçons terminées cumulativement', () => {
    const { recordLesson } = useReviewPromptStore.getState();
    recordLesson();
    recordLesson();
    expect(useReviewPromptStore.getState().lessonsCompleted).toBe(2);
  });
});

describe('réponses de la pré-question', () => {
  it('« oui » ferme la modale et marque comme noté', () => {
    makeEligible();
    useReviewPromptStore.getState().show();
    useReviewPromptStore.getState().markRated();
    const s = useReviewPromptStore.getState();
    expect(s.visible).toBe(false);
    expect(s.hasRated).toBe(true);
  });

  it('« pas trop » ferme la modale sans marquer comme noté', () => {
    makeEligible();
    useReviewPromptStore.getState().show();
    useReviewPromptStore.getState().markDeclined();
    const s = useReviewPromptStore.getState();
    expect(s.visible).toBe(false);
    expect(s.hasRated).toBe(false);
  });
});
