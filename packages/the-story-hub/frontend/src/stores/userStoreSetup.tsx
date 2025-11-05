"use client";

import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";
import { getUserProfileAPI } from "@/lib/api/users";

type Props = PropsWithChildren & {
  userId: string;
};

export const UserStoreSetup: FC<Props> = ({ userId, children }) => {
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  const { data, error, isPending } = useQuery({
    retry: false,
    queryKey: ["user", userId],
    queryFn: () => getUserProfileAPI(userId),
  });

  // Extract the user data - API returns the user directly
  const User = data;

  // Set user in store when GraphQL data is available
  // The resolver already handles Cognito group to clientType mapping
  useEffect(() => {
    if (User) {
      // Only log in development mode
      // eslint-disable-next-line no-console
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(
          "UserStoreSetup: Setting user with clientType from GraphQL response:",
          User.clientType,
        );
      }
      setUser(User);
    }
  }, [User, setUser]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner label="Loading user data..." />
      </div>
    );
  }

  if (error || !User) {
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
