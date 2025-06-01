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
          return;
        }
        
        // Log the user object to debug - we'll use this to understand structure
        console.log('Auth User:', user);
        if (user.signInDetails) {
          console.log('SignInDetails:', user.signInDetails);
        }
        
        // Extract groups from Cognito user if available
        // This is a placeholder that needs to be completed once the Cognito structure is understood
        try {
          // Different possible locations for groups in Cognito user object
          const possibleGroupsLocations = [
            // TypeScript doesn't know these properties exist, but they might be in the runtime object
            (user as any).groups,
            (user.signInDetails as any)?.groups,
            (user as any).attributes?.['cognito:groups'],
            // Add other potential locations based on console log inspection
          ];
          
          // Find the first non-empty groups array
          const groups = possibleGroupsLocations.find(g => Array.isArray(g) && g.length > 0);
          
          if (groups && groups.length > 0) {
            console.log('Found Cognito groups:', groups);
            
            // Map Cognito groups to ClientType enum values
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
                  mappedClientTypes.push(ClientType.RegisteredAtendee);
                  break;
                case 'UnregisteredAttendee':
                  mappedClientTypes.push(ClientType.UnregisteredAttendee);
                  break;
              }
            }
            
            // If we found valid client types, update the state
            if (mappedClientTypes.length > 0) {
              setClientTypes(mappedClientTypes);
              return;
            }
          }
        } catch (err) {
          console.error("Error extracting Cognito groups:", err);
        }
        
        // If we couldn't extract groups or there were none, keep the default
        // UnregisteredAttendee as the fallback
      } catch (err) {
        console.error("Error in getCognitoUserInfo:", err);
      }
    };
    
    getCognitoUserInfo();
  }, []);

  // Update user in store when GraphQL data is available
  useEffect(() => {
    if (data?.data?.getCWLUser) {
      // Add the clientType to the CWLUser data
      const userWithClientType = {
        ...data.data.getCWLUser,
        clientType: clientTypes  // Add the clientType from our state
      };
      
      setUser(userWithClientType);
    }
  }, [data, setUser, clientTypes]);

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
