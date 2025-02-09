import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import { ClientType } from "../../cloudwatchlive/backend/resources/AppSync/resolvers/gqlTypes";

export const isSuperAdminUserGroup = (identity: AppSyncIdentityCognito): boolean => {
  return (identity.groups || []).includes(ClientType.SuperAdmin);
};

