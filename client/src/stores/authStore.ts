import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  isAdmin: boolean;
  email?: string | null;
  sessionId: string | null;
};

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;

  setAuthenticated: (user: AuthUser) => void;
  clear: () => void;
  bootstrap: (baseUrl: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isBootstrapping: true,

      setAuthenticated: (user) =>
        set({ user, isAuthenticated: true, isBootstrapping: false }),

      clear: () => set({ user: null, isAuthenticated: false }),

      bootstrap: async (baseUrl) => {
        // Optimistic: if we have persisted auth, render immediately,
        // but validate once in the background.
        set({ isBootstrapping: true });

        console.log("🚀 Bootstrap: Starting with baseUrl:", baseUrl);
        console.log("🍪 Bootstrap: Document.cookie:", document.cookie);

        try {
          const url = `${baseUrl}/sentinel/me`;
          console.log("🌐 Bootstrap: Fetching:", url);
          
          const response = await fetch(url, {
            method: "GET",
            credentials: "include",
          });

          console.log("📡 Bootstrap: Response status:", response.status);
          console.log("📡 Bootstrap: Response headers:", Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            console.log("❌ Bootstrap: Not authenticated, clearing state");
            set({ user: null, isAuthenticated: false, isBootstrapping: false });
            return;
          }

          const data = await response.json();
          console.log("✅ Bootstrap: Authenticated, user data:", data);
          set({
            user: { id: data.user.id, isAdmin: data.user.isAdmin, email: data.user.email, sessionId: data.session.id },
            isAuthenticated: true,
            isBootstrapping: false,
          });
        } catch (error) {
          console.error("🔥 Bootstrap: Network error:", error);
          // Network errors: keep whatever we had persisted and stop bootstrapping.
          // API calls will still enforce auth server-side.
          set({ isBootstrapping: false });
        }
      },
    }),
    {
      name: "mbthcrm_auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
