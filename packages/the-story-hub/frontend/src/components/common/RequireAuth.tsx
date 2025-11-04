"use client";

import React from "react";
import { UserStoreSetup } from "@/stores/userStoreSetup";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { RequireLoggedIn } from "./RequireLoggedIn";
import { NextRedirect } from "./NextRedirect";
import { useSetGlobalMessage } from "./GlobalMessage";

interface Props {
  children: React.ReactNode;
}
export const RequireAuth: React.FC<Props> = ({ children }) => {
  const [showRedirect, setShowRedirect] = React.useState(false);
  const setGlobalMessage = useSetGlobalMessage();

  React.useEffect(() => {
    if (showRedirect) {
      setGlobalMessage({
        color: "error",
        content: "Please sign in to access this page",
      });
    }
  }, [showRedirect, setGlobalMessage]);

  return (
    <RequireLoggedIn
      renderNotLoggedIn={() => {
        setShowRedirect(true);
        return <NextRedirect path={LOGIN_PATH} />;
      }}
      renderLoggedIn={(currentUser) => (
        <UserStoreSetup userId={currentUser.username}>
          {children}
        </UserStoreSetup>
      )}
    />
  );
};
