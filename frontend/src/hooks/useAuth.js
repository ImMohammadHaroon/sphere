import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { setAccessToken } from "@/lib/apiClient";
import { authApi } from "@/lib/authApi";
import { initCrossTabAuth } from "@/lib/authSync";
import { broadcastLogout } from "@/lib/authChannel";

const REFRESH_INTERVAL_MS = 13 * 60 * 1000;

export function useAuthInit() {
  const {
    isInitialized,
    setInitialized,
    setSession,
    clearSession,
    setLoading,
    accessToken,
  } = useAuthStore();

  useEffect(() => {
    initCrossTabAuth();
  }, []);

  useEffect(() => {
    if (isInitialized) return;

    async function bootstrap() {
      try {
        const result = await authApi.refresh();
        setAccessToken(result.accessToken);
        setSession(result.accessToken, result.user);
      } catch {
        clearSession();
        setAccessToken(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    }

    bootstrap();
  }, [isInitialized, setInitialized, setSession, clearSession, setLoading]);

  useEffect(() => {
    setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!isInitialized || !accessToken) return;

    const interval = setInterval(async () => {
      try {
        const result = await authApi.refresh();
        setAccessToken(result.accessToken);
        useAuthStore.getState().setSession(result.accessToken, result.user);
      } catch {
        useAuthStore.getState().clearSession();
        setAccessToken(null);
        broadcastLogout();
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isInitialized, accessToken]);
}

export function useAuth() {
  const { user, isLoading, isInitialized, accessToken } = useAuthStore();
  return {
    user,
    accessToken,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user && !!accessToken,
  };
}
