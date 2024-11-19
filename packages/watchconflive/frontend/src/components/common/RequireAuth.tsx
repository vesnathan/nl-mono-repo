"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/userStore";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth = ({ children }: RequireAuthProps) => {
  const { userId } = useUserStore(({ user }) => user);
  const router = useRouter();

  useEffect(() => {
    if (!userId) {
      router.replace(LOGIN_PATH);
    }
  }, [userId, router]);

  if (!userId) {
    return null; // Render nothing while redirecting
  }

  return <>{children}</>;
};

export default RequireAuth;
