import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { Bookmark, SaveBookmarkInput } from "gqlTypes";

type CTX = Context<
  { input: SaveBookmarkInput },
  object,
  object,
  object,
  Bookmark
>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const now = util.time.nowISO8601();

  console.log(`Saving bookmark for user ${identity.username}, story ${input.storyId}`);

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${identity.username}`,
      SK: `BOOKMARK#${input.storyId}`,
    }),
    attributeValues: util.dynamodb.toMapValues({
      userId: identity.username,
      storyId: input.storyId,
      currentNodeId: input.currentNodeId,
      breadcrumbs: input.breadcrumbs,
      lastRead: now,
    }),
  };
}

export function response(ctx: CTX): Bookmark {
  if (ctx.error) {
    console.error("Error saving bookmark:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Bookmark saved successfully");
  return ctx.result as Bookmark;
}
