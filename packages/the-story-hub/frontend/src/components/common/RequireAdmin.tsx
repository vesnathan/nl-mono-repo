"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorMessage } from "./ErrorMessage";

interface Props {
  children: React.ReactNode;
}

/**
 * Component that requires the user to be a site admin
 * Shows loading state while checking, redirects to home if not admin
 */
export const RequireAdmin: React.FC<Props> = ({ children }) => {
  const { isAdmin, isLoading } = useIsAdmin();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner label="Checking admin access..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="max-w-md w-full">
          <ErrorMessage
            title="Access Denied"
            message="Admin privileges required to access this page."
            retry={() => router.push("/")}
          />
        </div>
      </div>
    );
  }

  return children;
};
