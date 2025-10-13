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
  getAWSEUserQueryFn,
  getAWSEUserQueryKey,
} from "../graphql/queries/userQueries";

// using @heroui Progress component directly

type Props = PropsWithChildren & {
  userId: string;
};

export const AWSEUserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const queryKey = getAWSEUserQueryKey(userId);

  const { data, error, isPending } = useQuery({
    retry: false,
    queryFn: () => getAWSEUserQueryFn({ userId }),
    queryKey,
  });

  // Extract the user data
  const AWSEUser = data?.data?.getAWSEUser;

  // Set user in store when GraphQL data is available
  // The resolver already handles Cognito group to clientType mapping
  useEffect(() => {
    if (AWSEUser) {
      // Only log in development mode
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          "AWSEUserStoreSetup: Setting user with clientType from GraphQL response:",
          AWSEUser.clientType,
        );
      }
      setUser(AWSEUser);
    }
  }, [AWSEUser, setUser]);

  if (isPending) {
    return <Progress isIndeterminate aria-label="Loading user data" />;
  }

  if (error || !AWSEUser) {
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
