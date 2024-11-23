"use client";

import React from "react";
import { NextRedirect } from "./NextRedirect";
import { CWLUserStoreSetup } from "@/stores/CWLUserStoreSetup";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";
import { useUserStore } from "@/stores/userStore";

interface RequireLoggedInProps {
  children: React.ReactNode;
}

const RequireLoggedIn: React.FC<RequireLoggedInProps> = ({ children }) => {
  const { userId } = useUserStore(({ user }) => user);

  if (!userId) {
    return <NextRedirect path={LOGIN_PATH} />;
  }

  return <CWLUserStoreSetup userId={userId}>{children}</CWLUserStoreSetup>;
};

export default RequireLoggedIn;
