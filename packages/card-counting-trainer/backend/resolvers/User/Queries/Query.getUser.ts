import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { User, PatreonInfo, PatreonTier } from "gqlTypes";

type CTX = Context<object, object, object, object, User>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!userId) {
    return util.error("User not authenticated", "UnauthorizedException");
  }

  console.log(`Getting user for userId: ${userId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: "METADATA",
    }),
  };
}

export function response(ctx: CTX): User | null {
  if (ctx.error) {
    console.error("Error fetching user:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;

  if (!item) {
    // User doesn't exist in DB yet - return basic info from Cognito
    const identity = ctx.identity as AppSyncIdentityCognito;
    return {
      __typename: "User",
      id: identity.sub,
      email: identity.claims?.email || "",
      username: identity.username || "",
      chips: 1000, // Default starting chips
      totalChipsPurchased: 0,
      patreonInfo: null,
      earlyAdopter: false,
      createdAt: util.time.nowISO8601(),
      updatedAt: util.time.nowISO8601(),
    };
  }

  // Build PatreonInfo from DynamoDB item
  let patreonInfo: PatreonInfo | null = null;
  if (item.patreonTier) {
    patreonInfo = {
      __typename: "PatreonInfo",
      tier: item.patreonTier as PatreonTier,
      patreonUserId: item.patreonUserId || null,
      lastSynced: item.patreonLastSynced || null,
    };
  }

  const user: User = {
    __typename: "User",
    id: item.id,
    email: item.email,
    username: item.username,
    chips: item.chips || 1000,
    totalChipsPurchased: item.totalChipsPurchased || 0,
    patreonInfo,
    earlyAdopter: item.earlyAdopter || false,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  console.log("User fetched successfully");
  return user;
}
