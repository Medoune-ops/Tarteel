import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChallengeSeenState {
  /** Défis dont la célébration de victoire a déjà été montrée (par id). */
  seen: Record<string, boolean>;
  hasSeen: (challengeId: string) => boolean;
  markSeen: (challengeId: string) => void;
}

/** Célébrations de victoire de défi déjà affichées — une fois par défi, jamais
 *  rejouées après fermeture de l'app (persisté). */
export const useChallengeSeenStore = create<ChallengeSeenState>()(
  persist(
    (set, get) => ({
      seen: {},
      hasSeen: (challengeId) => get().seen[challengeId] === true,
      markSeen: (challengeId) =>
        set((s) => (s.seen[challengeId] ? s : { seen: { ...s.seen, [challengeId]: true } })),
    }),
    {
      name: 'tarteel-challenge-seen',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);