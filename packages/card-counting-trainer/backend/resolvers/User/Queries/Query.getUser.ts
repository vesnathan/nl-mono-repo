import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { User } from "gqlTypes";

type CTX = Context<object, object, object, object, User>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException",
    );
  }

  console.log(`Getting user for userId: ${userId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `USER#${userId}`,
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
    return null;
  }

  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  const user: User = {
    __typename: "User",
    id: userId,
    email: item.email || "",
    username: item.username || "",
    chips: item.chips || 0,
    totalChipsPurchased: item.totalChipsPurchased || 0,
    patreonInfo: item.patreonInfo || null,
    earlyAdopter: item.earlyAdopter || false,
    createdAt: item.createdAt || util.time.nowISO8601(),
    updatedAt: item.updatedAt || util.time.nowISO8601(),
  };

  console.log("User fetched successfully");
  return user;
}
