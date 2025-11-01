import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { User, ClientType } from "gqlTypes";

type CTX = Context<{ userId: string }, object, object, object, User>;

export function request(ctx: CTX) {
  const { userId } = ctx.args;

  if (!userId) {
    return util.error("User ID is required", "ValidationException");
  }

  console.log(`Getting user profile for userId: ${userId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
    }),
  };
}

export function response(ctx: CTX): User | null {
  if (ctx.error) {
    console.error("Error fetching user profile:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  if (!item) {
    return null;
  }

  const identity = ctx.identity as AppSyncIdentityCognito;

  // Map Cognito groups to ClientType
  const cognitoGroups = identity.groups || [];
  const clientType: ClientType[] = [];

  for (const group of cognitoGroups) {
    if (group === "SiteAdmin") {
      clientType.push(ClientType.SiteAdmin);
    } else if (group === "StoryContributor") {
      clientType.push(ClientType.StoryContributor);
    } else if (group === "Reader") {
      clientType.push(ClientType.Reader);
    }
  }

  if (clientType.length === 0) {
    clientType.push(ClientType.UnauthenticatedUser);
  }

  const user: User = {
    __typename: "User",
    userId: item.userId || ctx.args.userId,
    username: item.username,
    email: item.email,
    bio: item.bio,
    stats: item.stats,
    patreonSupporter: item.patreonSupporter || false,
    clientType,
    createdAt: item.createdAt,
  };

  console.log("User profile fetched successfully");
  return user;
}
