import {
  util,
  AppSyncIdentityCognito,
  Context,
} from "@aws-appsync/utils";
import { SiteSettings, UpdateSiteSettingsInput } from "gqlTypes";

type CTX = Context<
  { input: UpdateSiteSettingsInput },
  object,
  object,
  object,
  SiteSettings
>;

// Site settings are stored with a single PK/SK combination
const SETTINGS_PK = "SETTINGS#SITE";
const SETTINGS_SK = "CONFIG#GLOBAL";

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Verify user is admin (this is also checked by @aws_cognito_user_pools directive)
  const cognitoGroups = identity.groups || [];
  if (!cognitoGroups.includes("SiteAdmin")) {
    return util.error(
      "Unauthorized: Only site administrators can update settings",
      "UnauthorizedException",
    );
  }

  const userId = identity.sub;
  const now = util.time.nowISO8601();

  console.log(`Updating site settings by admin user: ${userId}`);

  // Build update expression dynamically based on provided fields
  const updates: Record<string, any> = {
    updatedAt: now,
    updatedBy: userId,
  };

  if (input.grantOGBadgeToPatreonSupporters !== undefined) {
    updates.grantOGBadgeToPatreonSupporters =
      input.grantOGBadgeToPatreonSupporters;
  }

  // Future settings can be added here:
  // if (input.maintenanceMode !== undefined) {
  //   updates.maintenanceMode = input.maintenanceMode;
  // }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: SETTINGS_PK,
      SK: SETTINGS_SK,
    }),
    update: {
      expression:
        "SET " +
        Object.keys(updates)
          .map((key) => `#${key} = :${key}`)
          .join(", "),
      expressionNames: Object.keys(updates).reduce(
        (acc, key) => {
          acc[`#${key}`] = key;
          return acc;
        },
        {} as Record<string, string>,
      ),
      expressionValues: util.dynamodb.toMapValues(
        Object.keys(updates).reduce(
          (acc, key) => {
            acc[`:${key}`] = updates[key];
            return acc;
          },
          {} as Record<string, any>,
        ),
      ),
    },
  };
}

export function response(ctx: CTX): SiteSettings {
  if (ctx.error) {
    console.error("Error updating site settings:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  const settings: SiteSettings = {
    __typename: "SiteSettings",
    grantOGBadgeToPatreonSupporters:
      item.grantOGBadgeToPatreonSupporters ?? false,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy || null,
  };

  console.log("Site settings updated successfully");
  return settings;
}
