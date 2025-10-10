import { authSignOut } from "shared/functions/authSignOut";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";

export const useLogoutFn = () => {
  const router = useRouter();
  return useCallback(async () => {
    await authSignOut();
    router.replace(LOGIN_PATH);
  }, [router]);
};
