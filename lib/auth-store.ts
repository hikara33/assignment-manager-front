import { create } from "zustand";
import type { User } from "./types";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  ready: boolean;
  setSession: (token: string | null, user: User | null) => void;
  setReady: (ready: boolean) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  ready: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setReady: (ready) => set({ ready }),
  clear: () => set({ accessToken: null, user: null }),
}));

export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}
