import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  streak: number;
  xp: number;
  hearts: number;
  level: 'debutant' | 'alphabet' | 'lent' | 'fluent';
  objectif: 'lire' | 'hifz' | 'tafsir' | 'complet';
  dailyMinutes: number;
  currentLesson: number;
  onboardingDone: boolean;
  setLevel: (v: UserState['level']) => void;
  setObjectif: (v: UserState['objectif']) => void;
  setDailyMinutes: (v: number) => void;
  completeOnboarding: () => void;
  addXP: (amount: number) => void;
  loseHeart: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      streak: 15,
      xp: 1240,
      hearts: 5,
      level: 'debutant',
      objectif: 'hifz',
      dailyMinutes: 10,
      currentLesson: 4,
      onboardingDone: false,
      setLevel: (level) => set({ level }),
      setObjectif: (objectif) => set({ objectif }),
      setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
      completeOnboarding: () => set({ onboardingDone: true }),
      addXP: (amount) => set((s) => ({ xp: s.xp + amount })),
      loseHeart: () => set((s) => ({ hearts: Math.max(0, s.hearts - 1) })),
    }),
    {
      name: 'tarteel-user',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
