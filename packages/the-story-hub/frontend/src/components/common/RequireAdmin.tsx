"use client";

import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LoadingSpinner } from "./LoadingSpinner";

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

  // Redirect to home if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner label="Checking admin access..." />
      </div>
    );
  }

  if (!isAdmin) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner label="Redirecting..." />
      </div>
    );
  }

  return children;
};
