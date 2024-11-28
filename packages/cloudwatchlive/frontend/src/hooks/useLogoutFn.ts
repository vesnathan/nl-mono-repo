import { cwlAuthSignOut } from "shared/functions/cwlAuthSignOut";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { LOGIN_PATH } from "@/constants/layout/navigation/navigation";

export const useLogoutFn = () => {
  const router = useRouter();
  return useCallback(async () => {
    await cwlAuthSignOut();
    router.replace(LOGIN_PATH);
  }, [router]);
};
