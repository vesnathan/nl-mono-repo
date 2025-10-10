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
  getAWSBUserQueryFn,
  getAWSBUserQueryKey,
} from "../graphql/queries/userQueries";

// using @heroui Progress component directly

type Props = PropsWithChildren & {
  userId: string;
};

export const AWSBUserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const queryKey = getAWSBUserQueryKey(userId);

  const { data, error, isPending } = useQuery({
    retry: false,
    queryFn: () => getAWSBUserQueryFn({ userId }),
    queryKey,
  });

  // Extract the user data
  const AWSBUser = data?.data?.getAWSBUser;

  // Set user in store when GraphQL data is available
  // The resolver already handles Cognito group to clientType mapping
  useEffect(() => {
    if (AWSBUser) {
      // Only log in development mode
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          "AWSBUserStoreSetup: Setting user with clientType from GraphQL response:",
          AWSBUser.clientType,
        );
      }
      setUser(AWSBUser);
    }
  }, [AWSBUser, setUser]);

  if (isPending) {
    return <Progress isIndeterminate aria-label="Loading user data" />;
  }

  if (error || !AWSBUser) {
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
