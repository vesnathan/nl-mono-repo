"use client";

import { Progress } from "@nextui-org/react";
// no ProgressProps needed; using Progress directly
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";
import {
  getANAUserQueryFn,
  getANAUserQueryKey,
} from "../graphql/queries/userQueries";

// using @heroui Progress component directly

type Props = PropsWithChildren & {
  userId: string;
};

export const ANAUserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const queryKey = getANAUserQueryKey(userId);

  const { data, error, isPending } = useQuery({
    retry: false,
    queryFn: () => getANAUserQueryFn({ userId }),
    queryKey,
  });

  // Extract the user data
  const ANAUser = data?.data?.getANAUser;

  // Set user in store when GraphQL data is available
  // The resolver already handles Cognito group to clientType mapping
  useEffect(() => {
    if (ANAUser) {
      // Only log in development mode
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          "ANAUserStoreSetup: Setting user with clientType from GraphQL response:",
          ANAUser.clientType,
        );
      }
      setUser(ANAUser);
    }
  }, [ANAUser, setUser]);

  if (isPending) {
    return <Progress isIndeterminate aria-label="Loading user data" />;
  }

  if (error || !ANAUser) {
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
