"use client";

import { Progress } from "@nextui-org/react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import {
  getCWLUserQueryFn,
  getCWLUserQueryKey,
} from "@/graphQL/queries/userQueries";
import { useUserStore } from "@/stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { DataFetchError } from "@/components/common/DataFetchError";
import { useRouter } from "next/navigation";
import { FC, PropsWithChildren, useEffect } from "react";

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

  const CWLUser = data?.data.getCWLUser;
  useEffect(() => {
    if (CWLUser) {
      setUser(CWLUser);
    }
  }, [CWLUser, setUser]);

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
