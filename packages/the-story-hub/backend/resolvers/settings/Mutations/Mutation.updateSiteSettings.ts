import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
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

  if (input.googleOAuthEnabled !== undefined) {
    updates.googleOAuthEnabled = input.googleOAuthEnabled;
  }

  if (input.facebookOAuthEnabled !== undefined) {
    updates.facebookOAuthEnabled = input.facebookOAuthEnabled;
  }

  if (input.appleOAuthEnabled !== undefined) {
    updates.appleOAuthEnabled = input.appleOAuthEnabled;
  }

  if (input.adsEnabled !== undefined) {
    updates.adsEnabled = input.adsEnabled;
  }

  if (input.adsensePublisherId !== undefined) {
    updates.adsensePublisherId = input.adsensePublisherId;
  }

  if (input.adsenseVerificationCode !== undefined) {
    updates.adsenseVerificationCode = input.adsenseVerificationCode;
  }

  if (input.showAdsOnHomepage !== undefined) {
    updates.showAdsOnHomepage = input.showAdsOnHomepage;
  }

  if (input.showAdsOnStoryEnd !== undefined) {
    updates.showAdsOnStoryEnd = input.showAdsOnStoryEnd;
  }

  if (input.showAdsInFooter !== undefined) {
    updates.showAdsInFooter = input.showAdsInFooter;
  }

  if (input.homepageAdSlot !== undefined) {
    updates.homepageAdSlot = input.homepageAdSlot;
  }

  if (input.storyEndAdSlot !== undefined) {
    updates.storyEndAdSlot = input.storyEndAdSlot;
  }

  if (input.footerAdSlot !== undefined) {
    updates.footerAdSlot = input.footerAdSlot;
  }

  if (input.sentryDsn !== undefined) {
    updates.sentryDsn = input.sentryDsn;
  }

  if (input.sentryEnabled !== undefined) {
    updates.sentryEnabled = input.sentryEnabled;
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
    googleOAuthEnabled: item.googleOAuthEnabled ?? true,
    facebookOAuthEnabled: item.facebookOAuthEnabled ?? false,
    appleOAuthEnabled: item.appleOAuthEnabled ?? false,
    adsEnabled: item.adsEnabled ?? false,
    adsensePublisherId: item.adsensePublisherId || null,
    adsenseVerificationCode: item.adsenseVerificationCode || null,
    showAdsOnHomepage: item.showAdsOnHomepage ?? false,
    showAdsOnStoryEnd: item.showAdsOnStoryEnd ?? false,
    showAdsInFooter: item.showAdsInFooter ?? false,
    homepageAdSlot: item.homepageAdSlot || null,
    storyEndAdSlot: item.storyEndAdSlot || null,
    footerAdSlot: item.footerAdSlot || null,
    sentryDsn: item.sentryDsn || null,
    sentryEnabled: item.sentryEnabled ?? false,
    updatedAt: item.updatedAt,
    updatedBy: item.updatedBy || null,
  };

  console.log("Site settings updated successfully");
  return settings;
}
