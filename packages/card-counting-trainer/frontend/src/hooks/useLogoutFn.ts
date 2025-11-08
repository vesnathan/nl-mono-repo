import { signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const useLogoutFn = () => {
  const router = useRouter();
  return useCallback(async () => {
    await signOut();
    router.replace("/");
  }, [router]);
};
