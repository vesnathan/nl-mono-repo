import type { AppSyncIdentityCognito } from "@aws-appsync/utils";
import { CognitoUserGroup } from "../../cloudwatchlive/backend/resources/AppSync/resolvers/gqlTypes";

export const isAdminUserGroup = (identity: AppSyncIdentityCognito): boolean => {
  return (identity.groups || []).includes(CognitoUserGroup.Admin);
};

