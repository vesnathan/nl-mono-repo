/**
 * Pipeline function to fetch user profile for badge fields
 * This can be reused across multiple resolvers
 */
import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";

type CTX = Context<any, any, any, object, any>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.username;

  console.log(`Fetching user profile for: ${userId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
    }),
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error fetching user profile:", ctx.error);
    // Don't fail the whole operation, just set defaults
    ctx.stash.userBadges = {
      patreonSupporter: false,
      ogSupporter: false,
      screenName: (ctx.identity as AppSyncIdentityCognito).username,
    };
    return ctx.stash.userBadges;
  }

  const user = ctx.result;

  // Store badge fields and screen name in stash for next function
  ctx.stash.userBadges = {
    patreonSupporter: user?.patreonSupporter ?? false,
    ogSupporter: user?.ogSupporter ?? false,
    screenName: user?.userScreenName ?? (ctx.identity as AppSyncIdentityCognito).username,
  };

  console.log("User badges fetched:", ctx.stash.userBadges);

  return ctx.stash.userBadges;
}
