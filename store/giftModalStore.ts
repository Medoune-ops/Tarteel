import { create } from 'zustand';

/** Ce qu'un admin peut offrir depuis le back-office — voir adminUsers.service.ts (backend). */
export type GiftKind = 'hearts' | 'gems' | 'premium';

interface GiftModalState {
  visible: boolean;
  kind: GiftKind | null;
  amount: number | null;
  /** Incrémenté à chaque cadeau : force Confetti à se redéclencher même si le kind/amount est identique au précédent. */
  burstKey: number;
  show: (kind: GiftKind, amount: number) => void;
  hide: () => void;
}

/**
 * État global de la modale "cadeau admin" (cœurs/gemmes/premium offerts depuis
 * le back-office). Déclenchée par le listener de notification push dans
 * app/(app)/_layout.tsx, affichée par components/GiftModal.tsx monté une fois
 * au même niveau — visible peu importe l'écran sur lequel se trouve l'utilisateur.
 */
export const useGiftModalStore = create<GiftModalState>((set, get) => ({
  visible: false,
  kind: null,
  amount: null,
  burstKey: 0,
  show: (kind, amount) => set({ visible: true, kind, amount, burstKey: get().burstKey + 1 }),
  hide: () => set({ visible: false }),
}));
