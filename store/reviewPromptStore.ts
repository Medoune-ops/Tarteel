import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Nombre de leçons terminées avant de pouvoir proposer la notation. */
export const MIN_LESSONS_BEFORE_PROMPT = 5;
/** Délai minimum depuis la première ouverture de l'app (48 h). */
export const MIN_AGE_BEFORE_PROMPT_MS = 48 * 60 * 60 * 1000;
/** Délai avant de re-proposer à quelqu'un qui a répondu « pas trop » (120 j). */
export const RETRY_AFTER_DECLINE_MS = 120 * 24 * 60 * 60 * 1000;

interface ReviewPromptState {
  /** Timestamp (ms) de la première ouverture — base du délai des 48 h. */
  firstSeenAt: number | null;
  /** Leçons terminées depuis l'installation (compteur local, jamais remis à 0). */
  lessonsCompleted: number;
  /** Timestamp de la dernière fois que la pré-question a été affichée. */
  lastPromptedAt: number | null;
  /** true dès que l'utilisateur a répondu « oui » → on ne redemande plus jamais. */
  hasRated: boolean;
  /** Visibilité de la modale de pré-question. */
  visible: boolean;

  /** À appeler au lancement : amorce `firstSeenAt` une seule fois. */
  init: () => void;
  /** +1 leçon terminée. */
  recordLesson: () => void;
  /** Tous les garde-fous sont-ils réunis pour proposer la notation ? */
  canPrompt: () => boolean;
  /** Ouvre la pré-question (suppose `canPrompt()` déjà vérifié). */
  show: () => void;
  /** Ferme la modale sans rien décider (retour arrière / dismiss). */
  hide: () => void;
  /** L'utilisateur a répondu « oui » → plus jamais de pré-question. */
  markRated: () => void;
  /** L'utilisateur a répondu « pas trop » → on retente dans 120 jours. */
  markDeclined: () => void;
}

/**
 * État de la demande de note sur les stores, avec le pattern « pré-question » :
 * on affiche d'abord NOTRE modale (« Tu aimes Tarteel ? »), et on n'appelle
 * l'API native de notation que si la réponse est positive. Les utilisateurs
 * mécontents sont redirigés vers le support — ça évite de gaspiller les quotas
 * natifs (Apple ~3 popups/an/utilisateur, sans aucun retour sur l'affichage
 * réel) sur quelqu'un qui mettrait une mauvaise note.
 *
 * Persisté à part du store utilisateur (`tarteel-user`) parce que ces
 * compteurs concernent l'INSTALLATION, pas le compte : ils doivent survivre à
 * un logout (qui fait `set({ ...initialState })`), sinon se déconnecter
 * remettrait les garde-fous à zéro et l'app pourrait redemander une note.
 */
export const useReviewPromptStore = create<ReviewPromptState>()(
  persist(
    (set, get) => ({
      firstSeenAt: null,
      lessonsCompleted: 0,
      lastPromptedAt: null,
      hasRated: false,
      visible: false,

      init: () => {
        if (get().firstSeenAt == null) set({ firstSeenAt: Date.now() });
      },

      recordLesson: () => set((s) => ({ lessonsCompleted: s.lessonsCompleted + 1 })),

      canPrompt: () => {
        const { hasRated, firstSeenAt, lessonsCompleted, lastPromptedAt } = get();
        if (hasRated) return false;
        if (lessonsCompleted < MIN_LESSONS_BEFORE_PROMPT) return false;
        // firstSeenAt est amorcé par init() au lancement ; s'il manque encore,
        // on s'abstient plutôt que de traiter l'app comme installée depuis toujours.
        if (firstSeenAt == null) return false;
        if (Date.now() - firstSeenAt < MIN_AGE_BEFORE_PROMPT_MS) return false;
        if (lastPromptedAt != null && Date.now() - lastPromptedAt < RETRY_AFTER_DECLINE_MS) return false;
        return true;
      },

      show: () => set({ visible: true, lastPromptedAt: Date.now() }),
      hide: () => set({ visible: false }),
      markRated: () => set({ visible: false, hasRated: true }),
      markDeclined: () => set({ visible: false, lastPromptedAt: Date.now() }),
    }),
    {
      name: 'tarteel-review-prompt',
      storage: createJSONStorage(() => AsyncStorage),
      // `visible` est de l'état d'affichage : le persister rouvrirait la modale
      // au lancement suivant, hors de tout moment de réussite.
      partialize: ({ visible, ...rest }) => rest,
    }
  )
);
