import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Bookmark } from "gqlTypes";

type CTX = Context<{ storyId: string }, object, object, object, Bookmark>;

export function request(ctx: CTX) {
  const { storyId } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  if (!storyId) {
    return util.error("storyId is required", "ValidationException");
  }

  console.log(
    `Getting bookmark for user ${identity.username}, story ${storyId}`,
  );

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${identity.username}`,
      SK: `BOOKMARK#${storyId}`,
    }),
  };
}

export function response(ctx: CTX): Bookmark | null {
  if (ctx.error) {
    console.error("Error fetching bookmark:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  if (!item) {
    return null;
  }

  console.log("Bookmark fetched successfully");
  return item as Bookmark;
}
