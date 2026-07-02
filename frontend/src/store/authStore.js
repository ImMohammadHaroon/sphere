import { create } from "zustand";

const AUTH_FLAG_KEY = "authState";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isInitialized: false,

  setSession: (accessToken, user) => {
    localStorage.setItem(AUTH_FLAG_KEY, "active");
    set({ accessToken, user, isLoading: false });
  },

  setUser: (user) => set({ user }),

  clearSession: () => {
    localStorage.removeItem(AUTH_FLAG_KEY);
    set({ user: null, accessToken: null, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
}));

export { AUTH_FLAG_KEY };
