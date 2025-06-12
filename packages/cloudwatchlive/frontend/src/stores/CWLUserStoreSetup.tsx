"use client";

import { Progress } from "@nextui-org/react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import to from "await-to-js";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import { ClientType } from "@/graphql/gqlTypes";
import {
  getCWLUserQueryFn,
  getCWLUserQueryKey,
} from "../graphql/queries/userQueries"; // Using the original query

type Props = PropsWithChildren & {
  userId: string;
};

export const CWLUserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();
  
  // We'll always set a default client type
  const [clientTypes, setClientTypes] = useState<ClientType[]>([ClientType.UnregisteredAttendee]);

  const queryKey = getCWLUserQueryKey(userId);

  const { data, error, isPending } = useQuery({
    retry: false,
    queryFn: () => getCWLUserQueryFn({ userId }),
    queryKey,
  });

  // Extract the user data
  const CWLUser = data?.data?.getCWLUser;

  // Try to get Cognito user to debug structure
  useEffect(() => {
    const getCognitoUserInfo = async () => {
      try {
        const [error, user] = await to(getCurrentUser());
        if (error) {
          console.error("Error fetching Cognito user:", error);
          // If Cognito user fetch fails, we can't determine groups from it.
          // The store will rely on GraphQL data or default to UnregisteredAttendee.
          return;
        }
        
        console.log('Auth User:', user); // Keep this for debugging
        if (user.signInDetails) {
          console.log('SignInDetails:', user.signInDetails); // Keep this for debugging
        }
        
        let cognitoGroupsFound = false;
        try {
          const accessTokenPayload = (user as any).signInUserSession?.accessToken?.payload;
          const attributes = (user as any).attributes;

          const possibleGroupsSources: (string[] | undefined)[] = [
            accessTokenPayload?.['cognito:groups'],
            attributes?.['cognito:groups'],
            (user as any).groups,
            (user.signInDetails as any)?.groups,
          ];
          
          const groups = possibleGroupsSources.find(g => Array.isArray(g) && g.length > 0);
          
          if (groups && groups.length > 0) {
            console.log('Found Cognito groups:', groups);
            const mappedClientTypes: ClientType[] = [];
            for (const group of groups) {
              switch (group) {
                case 'SuperAdmin':
                  mappedClientTypes.push(ClientType.SuperAdmin);
                  break;
                case 'EventCompanyAdmin':
                  mappedClientTypes.push(ClientType.EventCompanyAdmin);
                  break;
                case 'EventCompanyStaff':
                  mappedClientTypes.push(ClientType.EventCompanyStaff);
                  break;
                case 'TechCompanyAdmin':
                  mappedClientTypes.push(ClientType.TechCompanyAdmin);
                  break;
                case 'TechCompanyStaff':
                  mappedClientTypes.push(ClientType.TechCompanyStaff);
                  break;
                case 'RegisteredAttendee':
                  mappedClientTypes.push(ClientType.RegisteredAttendee);
                  break;
                // Do not map UnregisteredAttendee from Cognito groups,
                // as it's a default/fallback type.
              }
            }
            
            if (mappedClientTypes.length > 0) {
              setClientTypes(mappedClientTypes);
              cognitoGroupsFound = true; // Mark that we found and set types from Cognito
              console.log("CWLUserStoreSetup: Client types set from Cognito groups:", mappedClientTypes);
            } else {
              console.warn('Cognito groups found, but none mapped to known ClientTypes (excluding UnregisteredAttendee):', groups);
            }
          } else {
            console.warn('Cognito groups not found or empty in standard locations. Full Cognito user object logged below.');
            // Log the full user object if groups are not found, to help manual inspection
            console.log('Full Cognito user object for debugging group extraction:', user);
          }
        } catch (err) {
          console.error("Error extracting Cognito groups:", err);
        }
        
        // If Cognito groups were not found or didn't map to any specific client type,
        // the clientTypes state remains its default ([ClientType.UnregisteredAttendee]).
        // The useEffect that depends on `data` and `clientTypes` will handle further logic.
        if (!cognitoGroupsFound) {
            console.log("CWLUserStoreSetup: No definitive client types derived from Cognito groups. Will rely on GraphQL data or default.");
        }

      } catch (err) {
        console.error("Error in getCognitoUserInfo:", err);
      }
    };
    
    getCognitoUserInfo();
  }, []); // Run once on mount

  // Update user in store when GraphQL data is available or clientTypes from Cognito are processed
  useEffect(() => {
    if (data?.data?.getCWLUser) {
      let finalClientTypes: ClientType[] = [...clientTypes]; // Start with types from Cognito processing or default

      // Scenario 1: Cognito processing resulted in UnregisteredAttendee (or wasn't definitive)
      // AND GraphQL userRole is "System Administrator".
      if (
        finalClientTypes.length === 1 &&
        finalClientTypes[0] === ClientType.UnregisteredAttendee &&
        data.data.getCWLUser.userRole === "System Administrator"
      ) {
        finalClientTypes = [ClientType.SuperAdmin];
        console.log("CWLUserStoreSetup: Overriding clientType to SuperAdmin based on userRole 'System Administrator' as Cognito groups were not definitive.");
      }
      // Scenario 2: Cognito processing resulted in UnregisteredAttendee (or wasn't definitive)
      // AND GraphQL userRole is NOT "System Administrator".
      // In this case, finalClientTypes remains [ClientType.UnregisteredAttendee] or whatever Cognito derived if it wasn't empty.
      // No specific override needed here, the default or Cognito-derived (if any non-SuperAdmin) stands.
      else if (finalClientTypes.length === 1 && finalClientTypes[0] === ClientType.UnregisteredAttendee) {
        console.log("CWLUserStoreSetup: ClientType remains UnregisteredAttendee. Cognito groups were not definitive and userRole is not System Administrator.");
      }
      // Scenario 3: Cognito processing yielded specific client types.
      // We trust these, unless it's a SuperAdmin user who somehow only got UnregisteredAttendee from Cognito.
      // The first 'if' block already covers the SuperAdmin override.
      else if (!(finalClientTypes.length === 1 && finalClientTypes[0] === ClientType.UnregisteredAttendee)) {
        console.log("CWLUserStoreSetup: Using client types derived from Cognito groups:", finalClientTypes);
      }
      
      const userWithClientType = {
        ...data.data.getCWLUser,
        clientType: finalClientTypes.length > 0 ? finalClientTypes : [ClientType.UnregisteredAttendee] // Ensure clientType is never empty
      };
      
      setUser(userWithClientType);
    }
  }, [data, setUser, clientTypes]); // Rerun when GraphQL data or clientTypes (from Cognito) change

  if (isPending) {
    return (
      <Progress size="sm" isIndeterminate aria-label="Loading user data" />
    );
  }

  if (error || !CWLUser) {
    return (
      <DataFetchError
        error={error}
        errorMessage="Unable to fetch user data"
        retry={() => {
          router.replace(LOGIN_PATH);
        }}
      />
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
};
