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

export interface User {
  userId: string;
  username: string;
  email?: string;
  groups?: string[];
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  user?: User;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthStatus | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    try {
      const [session, cognitoUser] = await Promise.all([
        fetchAuthSession(),
        getCurrentUser().catch(() => null),
      ]);

      const isAuth = session.tokens !== undefined && cognitoUser !== null;
      setIsAuthenticated(isAuth);
      setIsLoading(false);

      if (isAuth && cognitoUser && session.tokens) {
        // Extract groups from access token payload
        const groups =
          (session.tokens.accessToken.payload["cognito:groups"] as string[]) ||
          [];
        const isAdminUser = groups.includes("admin");

        setUser({
          userId: cognitoUser.userId,
          username: cognitoUser.username,
          groups,
        });
        setIsAdmin(isAdminUser);
      } else {
        setUser(undefined);
        setIsAdmin(false);
      }
    } catch {
      setIsAuthenticated(false);
      setIsLoading(false);
      setUser(undefined);
      setIsAdmin(false);
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
      user,
      isAdmin,
      refresh: checkAuthStatus,
    }),
    [isAuthenticated, isLoading, user, isAdmin, checkAuthStatus],
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
