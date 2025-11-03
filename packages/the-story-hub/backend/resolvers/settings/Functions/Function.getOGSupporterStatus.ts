/**
 * Function to determine if a user should display the OG Supporter badge
 * This checks both the user's ogSupporter field AND the site setting
 * to grant OG badges to Patreon supporters
 */
import { Context } from "@aws-appsync/utils";

type CTX = Context<
  { userId: string },
  object,
  object,
  object,
  { ogSupporter: boolean; patreonSupporter: boolean; siteSettingEnabled: boolean }
>;

// Site settings are stored with a single PK/SK combination
const SETTINGS_PK = "SETTINGS#SITE";
const SETTINGS_SK = "CONFIG#GLOBAL";

export function request(ctx: CTX) {
  const { userId } = ctx.stash;

  console.log(`Fetching OG supporter status for user: ${userId}`);

  // Batch request to fetch both user profile and site settings
  return {
    operation: "BatchGetItem",
    tables: {
      [ctx.env.TABLE_NAME]: {
        keys: [
          {
            PK: { S: `USER#${userId}` },
            SK: { S: `PROFILE#${userId}` },
          },
          {
            PK: { S: SETTINGS_PK },
            SK: { S: SETTINGS_SK },
          },
        ],
        consistentRead: false,
      },
    },
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error fetching OG supporter data:", ctx.error);
    return {
      ogSupporter: false,
      patreonSupporter: false,
      siteSettingEnabled: false,
    };
  }

  const items = ctx.result.data[ctx.env.TABLE_NAME] || [];

  // Parse user profile
  const userProfile = items.find((item: any) => item.PK?.startsWith("USER#"));
  const ogSupporter = userProfile?.ogSupporter ?? false;
  const patreonSupporter = userProfile?.patreonSupporter ?? false;

  // Parse site settings
  const siteSettings = items.find((item: any) => item.PK === SETTINGS_PK);
  const siteSettingEnabled =
    siteSettings?.grantOGBadgeToPatreonSupporters ?? false;

  // User gets OG badge if:
  // 1. They have ogSupporter=true, OR
  // 2. They have patreonSupporter=true AND site setting is enabled
  const shouldShowOGBadge =
    ogSupporter || (patreonSupporter && siteSettingEnabled);

  console.log(
    `OG Badge determination: ogSupporter=${ogSupporter}, patreonSupporter=${patreonSupporter}, siteSettingEnabled=${siteSettingEnabled}, result=${shouldShowOGBadge}`,
  );

  return {
    ogSupporter,
    patreonSupporter,
    siteSettingEnabled,
    shouldShowOGBadge,
  };
}
