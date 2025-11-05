import { util, Context } from "@aws-appsync/utils";
import { SiteSettings } from "gqlTypes";

type CTX = Context<object, object, object, object, SiteSettings>;

// Site settings are stored with a single PK/SK combination
const SETTINGS_PK = "SETTINGS#SITE";
const SETTINGS_SK = "CONFIG#GLOBAL";

export function request(ctx: CTX) {
  console.log("Getting site settings");

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: SETTINGS_PK,
      SK: SETTINGS_SK,
    }),
  };
}

export function response(ctx: CTX): SiteSettings {
  if (ctx.error) {
    console.error("Error fetching site settings:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  // Return defaults if no settings exist yet
  if (!item) {
    console.log("No site settings found, returning defaults");
    const defaultSettings: SiteSettings = {
      __typename: "SiteSettings",
      grantOGBadgeToPatreonSupporters: false,
      updatedAt: util.time.nowISO8601(),
      updatedBy: null,
    };
    return defaultSettings;
  }

  const settings: SiteSettings = {
    __typename: "SiteSettings",
    grantOGBadgeToPatreonSupporters:
      item.grantOGBadgeToPatreonSupporters ?? false,
    updatedAt: item.updatedAt || util.time.nowISO8601(),
    updatedBy: item.updatedBy || null,
  };

  console.log("Site settings fetched successfully");
  return settings;
}
