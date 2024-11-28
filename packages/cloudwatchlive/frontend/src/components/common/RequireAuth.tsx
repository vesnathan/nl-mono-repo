import React from "react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { CWLUserStoreSetup } from "@/stores/CWLUserStoreSetup";
import { RequireLoggedIn } from "./RequireLoggedIn";
import { NextRedirect } from "./NextRedirect";

interface Props {
  children: React.ReactNode;
}
export const RequireAuth: React.FC<Props> = ({ children }) => {
  return (
    <RequireLoggedIn
      renderNotLoggedIn={() => {
        return <NextRedirect path={LOGIN_PATH} />;
      }}
      renderLoggedIn={({ userId }) => (
        <CWLUserStoreSetup userId={userId}>{children}</CWLUserStoreSetup>
      )}
    />
  );
};
