"use client";

import { Progress } from "@nextui-org/react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";
import { fetchAuthSession } from "@aws-amplify/auth";
import {
  getCWLUserQueryFn,
  getCWLUserQueryKey,
} from "../graphql/queries/userQueries";
import { ClientType } from "@/graphql/gqlTypes";

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
    queryFn: () => getCWLUserQueryFn({ userId }),
    queryKey,
  });

  const CWLUser = data?.data?.getCWLUser;

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (CWLUser) {
        setUser({
          ...CWLUser,
          userRole: (CWLUser as any).userRole || "",
          clientType: (CWLUser as any).clientType || []
        });

        const getUserGroups = async () => {
          try {
            const userSession = await fetchAuthSession();
            return (
              userSession?.tokens?.idToken?.payload["cognito:groups"] ?? []
            );
          } catch {
            return [];
          }
        };
        const userGroups = await getUserGroups();
        // Convert string[] to ClientType[]
        setUserGroups(userGroups as ClientType[]);
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
