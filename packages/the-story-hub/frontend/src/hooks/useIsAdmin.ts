import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { getUserProfileAPI } from "@/lib/api/users";
import { ClientType } from "@/types/gqlTypes";

export interface AdminStatus {
  isAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook to check if the current user is a site admin
 */
export function useIsAdmin(): AdminStatus {
  const [adminStatus, setAdminStatus] = useState<AdminStatus>({
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get auth session
        const session = await fetchAuthSession();

        if (!session.tokens) {
          setAdminStatus({ isAdmin: false, isLoading: false });
          return;
        }

        // Check Cognito groups from token
        const groups = session.tokens.accessToken.payload["cognito:groups"] as string[] | undefined;
        const isCognitoAdmin = groups?.includes("SiteAdmin") ?? false;

        // Also check user profile for clientType
        const userId = session.tokens.idToken?.payload.sub as string | undefined;
        if (userId) {
          try {
            const userProfile = await getUserProfileAPI(userId);
            const isProfileAdmin = userProfile?.clientType.includes(ClientType.SiteAdmin) ?? false;

            setAdminStatus({
              isAdmin: isCognitoAdmin || isProfileAdmin,
              isLoading: false,
            });
          } catch (error) {
            // If profile fetch fails, fall back to Cognito groups only
            console.error("Failed to fetch user profile:", error);
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
        setAdminStatus({ isAdmin: false, isLoading: false });
      }
    };

    checkAdminStatus();
  }, []);

  return adminStatus;
}
