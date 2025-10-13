import React from "react";
import { AWSEUserStoreSetup } from "@/stores/awseUserStoreSetup";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
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
      renderLoggedIn={(currentUser) => (
        <AWSEUserStoreSetup userId={currentUser.username}>
          {children}
        </AWSEUserStoreSetup>
      )}
    />
  );
};
