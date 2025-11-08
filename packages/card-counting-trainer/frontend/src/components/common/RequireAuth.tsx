"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSetGlobalMessage } from "./GlobalMessage";
import { LoadingSpinner } from "./LoadingSpinner";

interface Props {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const setGlobalMessage = useSetGlobalMessage();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setGlobalMessage({
        color: "error",
        content: "Please sign in to access this page",
      });
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router, setGlobalMessage]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};
