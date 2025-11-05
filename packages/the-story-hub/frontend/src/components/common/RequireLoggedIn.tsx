"use client";

import { FC, ReactNode, useState } from "react";
import to from "await-to-js";
import { AuthUser, getCurrentUser } from "aws-amplify/auth";
import { LoadingSpinner } from "./LoadingSpinner";
import { useEffectOnce } from "../../hooks/useEffectOnce";

type Props = {
  renderNotLoggedIn?: () => ReactNode;
  renderLoggedIn: (currentUser: AuthUser) => ReactNode;
};

export const RequireLoggedIn: FC<Props> = ({
  renderLoggedIn,
  renderNotLoggedIn,
}) => {
  const [checked, setIsChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffectOnce(() => {
    const checkCurrentUser = async () => {
      const [getCurrentUserError, getCurrentUserResult] =
        await to(getCurrentUser());
      setIsChecked(true);
      if (!getCurrentUserError) {
        setCurrentUser(getCurrentUserResult);
      }
    };
    checkCurrentUser();
  });

  if (!checked) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner label="Checking authentication..." />
      </div>
    );
  }

  if (!currentUser) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{renderNotLoggedIn?.() ?? null}</>;
  }

  return <>{renderLoggedIn(currentUser)}</>;
};
