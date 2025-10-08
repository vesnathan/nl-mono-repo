import type { AppSyncIdentityCognito } from "@aws-appsync/utils";

export const isSuperAdminUserGroup = (
  identity: AppSyncIdentityCognito,
): boolean => {
  return (identity.groups || []).includes("SuperAdmin");
};
