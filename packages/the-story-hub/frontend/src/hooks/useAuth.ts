import { useState, useEffect } from "react";
import { fetchAuthSession, getCurrentUser } from "aws-amplify/auth";

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
  username?: string;
}

export function useAuth(): AuthStatus {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    isLoading: true,
  });

  const checkAuthStatus = async () => {
    try {
      const [session, user] = await Promise.all([
        fetchAuthSession(),
        getCurrentUser().catch(() => null),
      ]);

      setAuthStatus({
        isAuthenticated: session.tokens !== undefined && user !== null,
        isLoading: false,
        userId: user?.userId,
        username: user?.username,
      });
    } catch {
      setAuthStatus({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return authStatus;
}
