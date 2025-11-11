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
import { getUserProfileAPI } from "@/lib/api/users";
import { useUserStore } from "@/stores/userStore";

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
  const setUser = useUserStore((state) => state.setUser);

  const checkAuthStatus = useCallback(async () => {
    try {
      const [session, user] = await Promise.all([
        fetchAuthSession(),
        getCurrentUser().catch(() => null),
      ]);

      const isAuth = session.tokens !== undefined && user !== null;
      setIsAuthenticated(isAuth);
      setIsLoading(false);
      setUserId(user?.userId);
      setUsername(user?.username);

      // Fetch user profile from DynamoDB and populate userStore
      if (isAuth && user?.userId) {
        try {
          const userProfile = await getUserProfileAPI(user.userId);
          if (userProfile) {
            setUser(userProfile);
            // Update username to use the one from DynamoDB
            setUsername(userProfile.username);
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          // Fall back to Cognito username if GraphQL fetch fails
        }
      }
    } catch {
      setIsAuthenticated(false);
      setIsLoading(false);
      setUserId(undefined);
      setUsername(undefined);
    }
  }, [setUser]);

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
