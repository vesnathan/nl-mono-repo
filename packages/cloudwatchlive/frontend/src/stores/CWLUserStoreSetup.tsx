"use client";

import { Progress } from "@nextui-org/react";
import type { ProgressProps } from "@nextui-org/progress";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";
import {
  getCWLUserQueryFn,
  getCWLUserQueryKey,
} from "../graphql/queries/userQueries";

const ProgressAny = Progress as unknown as React.ComponentType<ProgressProps>;

type Props = PropsWithChildren & {
  userId: string;
};

export const CWLUserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const queryKey = getCWLUserQueryKey(userId);

  const { data, error, isPending } = useQuery({
    retry: false,
    queryFn: () => getCWLUserQueryFn({ userId }),
    queryKey,
  });

  // Extract the user data
  const CWLUser = data?.data?.getCWLUser;

  // Set user in store when GraphQL data is available
  // The resolver already handles Cognito group to clientType mapping
  useEffect(() => {
    if (CWLUser) {
      // Only log in development mode
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          "CWLUserStoreSetup: Setting user with clientType from GraphQL response:",
          CWLUser.clientType,
        );
      }
      setUser(CWLUser);
    }
  }, [CWLUser, setUser]);

  if (isPending) {
    return (
      <ProgressAny size="sm" isIndeterminate aria-label="Loading user data" />
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
