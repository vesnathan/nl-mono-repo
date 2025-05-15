"use client";

import { Progress } from "@nextui-org/react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";
import { fetchAuthSession } from "@aws-amplify/auth";
import { createEmptyCWLUser } from "shared/types/CWLUserSchemas";
import { ClientType } from "@/graphql/gqlTypes";
import {
  getCWLUserQueryFn,
  getCWLUserQueryKey,
} from "../graphql/queries/userQueries";

type Props = PropsWithChildren & {
  userId: string;
};
export const CWLUserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const setUserGroups = useUserStore((state) => state.setUserGroups);
  const router = useRouter();

  const queryKey = getCWLUserQueryKey(userId);

  const { data, error, isPending } = useQuery({
    retry: false,
    queryFn: () =>
      getCWLUserQueryFn({ userId }).catch((err) => {
        console.error("GraphQL Query Error:", err);
        throw err;
      }),
    queryKey,
  });

  const CWLUser = data?.data?.getCWLUser;

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (CWLUser?.userId && CWLUser?.userEmail) {
        // Create a complete user object with all required fields by merging defaults with actual data
        const userWithDefaults = {
          ...createEmptyCWLUser(),
          ...CWLUser,
        };

        // Ensure critical fields are not overridden with empty values
        if (!userWithDefaults.userId) {
          userWithDefaults.userId = CWLUser.userId;
        }
        if (!userWithDefaults.userEmail) {
          userWithDefaults.userEmail = CWLUser.userEmail;
        }
        setUser(userWithDefaults);

        const getUserGroups = async () => {
          try {
            const userSession = await fetchAuthSession();

            const groups =
              userSession?.tokens?.idToken?.payload["cognito:groups"] ?? [];
            return groups as string[];
          } catch {
            return [] as string[];
          }
        };

        const cognitoGroups = await getUserGroups();

        const validGroups = cognitoGroups.filter(
          (group): group is ClientType => {
            return Object.values(ClientType).includes(group as ClientType);
          },
        );
        setUserGroups(validGroups);
      }
    };

    fetchUserGroups();
  }, [CWLUser, setUser, setUserGroups]);

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
