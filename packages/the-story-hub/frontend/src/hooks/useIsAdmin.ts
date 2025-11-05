import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getUserProfileAPI } from "@/lib/api/users";
import { ClientType } from "@/types/gqlTypes";
import { Hub } from "aws-amplify/utils";

export interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook to check if the current user is a site admin
 * Re-checks whenever auth state changes (sign in, sign out, token refresh)
 */
export function useIsAdmin(): AdminStatus {
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    isLoading: true,
  });
  const [authChangeCounter, setAuthChangeCounter] = useState(0);

  // Listen to Amplify auth events
  useEffect(() => {
    const hubListener = Hub.listen("auth", (data) => {
      const { event } = data.payload;
      // Re-check admin status on these auth events
      if (
        event === "signedIn" ||
        event === "signedOut" ||
        event === "tokenRefresh"
      ) {
        setAuthChangeCounter((prev) => prev + 1);
      }
    });

    return () => hubListener();
  }, []);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        // Get auth session
        const session = await fetchAuthSession({ forceRefresh: false });

        if (!isMounted) return;

        if (!session.tokens) {
          setAdminStatus({ isAdmin: false, isLoading: false });
          return;
        }

        // Check Cognito groups from token
        const groups = session.tokens.accessToken.payload["cognito:groups"] as
          | string[]
          | undefined;
        const isCognitoAdmin = groups?.includes("SiteAdmin") ?? false;

        // Also check user profile for clientType
        const userId = session.tokens.idToken?.payload.sub as
          | string
          | undefined;
        if (userId) {
          try {
            const userProfile = await getUserProfileAPI(userId);
            if (!isMounted) return;

            const isProfileAdmin =
              userProfile?.clientType.includes(ClientType.SiteAdmin) ?? false;

            setAdminStatus({
              isAdmin: isCognitoAdmin || isProfileAdmin,
              isLoading: false,
            });
          } catch (error) {
            // If profile fetch fails, fall back to Cognito groups only
            console.error("Failed to fetch user profile:", error);
            if (!isMounted) return;

            setAdminStatus({
              isAdmin: isCognitoAdmin,
              isLoading: false,
            });
          }
        } else {
          setAdminStatus({
            isAdmin: isCognitoAdmin,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
        if (!isMounted) return;

        setAdminStatus({ isAdmin: false, isLoading: false });
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [authChangeCounter]);

  return adminStatus;
}
