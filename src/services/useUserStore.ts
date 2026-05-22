import { create } from 'zustand';
import { UserState } from '../types';

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  subscription: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setSubscription: (subscription) => set({ subscription }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
