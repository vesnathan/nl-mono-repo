"use client";

import { CWLButton } from "@/components/common/CWLButton";
import { UserGroup } from "@/graphql/gqlTypes";
import { useUserStore } from "@/stores/userStore";

export const Clients = () => {
  const user = useUserStore((state) => state.user);
  const isSuperAdminUser = user.userGroups?.includes("SuperAdmin" as UserGroup);

  // eslint-disable-next-line no-console
  console.log("isSuperAdminUser", isSuperAdminUser);
  return <CWLButton buttonText="New client" />;
};
