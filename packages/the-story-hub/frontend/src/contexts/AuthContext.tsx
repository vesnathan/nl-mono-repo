"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
  username?: string;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthStatus | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [username, setUsername] = useState<string | undefined>(undefined);

  const checkAuthStatus = useCallback(async () => {
    try {
      const [session, user] = await Promise.all([
        fetchAuthSession(),
        getCurrentUser().catch(() => null),
      ]);

      setIsAuthenticated(session.tokens !== undefined && user !== null);
      setIsLoading(false);
      setUserId(user?.userId);
      setUsername(user?.username);
    } catch {
      setIsAuthenticated(false);
      setIsLoading(false);
      setUserId(undefined);
      setUsername(undefined);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Memoize the context value to prevent unnecessary re-renders
  const authStatus = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      userId,
      username,
      refresh: checkAuthStatus,
    }),
    [isAuthenticated, isLoading, userId, username, checkAuthStatus],
  );

  return (
    <AuthContext.Provider value={authStatus}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthStatus {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
