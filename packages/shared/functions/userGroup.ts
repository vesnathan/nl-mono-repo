import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import { UserGroup } from "../../cloudwatchlive/backend/resources/AppSync/resolvers/gqlTypes";

export const isSuperAdminUserGroup = (identity: AppSyncIdentityCognito): boolean => {
  return (identity.groups || []).includes(UserGroup.SuperAdmin);
};

