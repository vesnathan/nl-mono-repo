import { useState, useEffect, useCallback } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
  username?: string;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthStatus {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isLoading: true,
    userId: undefined,
    username: undefined,
    refresh: async () => {},
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      const [session, user] = await Promise.all([
        fetchAuthSession(),
        getCurrentUser().catch(() => null),
      ]);

      setAuthStatus((prev) => ({
        ...prev,
        isAuthenticated: session.tokens !== undefined && user !== null,
        isLoading: false,
        userId: user?.userId,
        username: user?.username,
      }));
    } catch {
      setAuthStatus((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        userId: undefined,
        username: undefined,
      }));
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Add refresh function to auth status
  useEffect(() => {
    setAuthStatus((prev) => ({
      ...prev,
      refresh: checkAuthStatus,
    }));
  }, [checkAuthStatus]);

  return authStatus;
}
