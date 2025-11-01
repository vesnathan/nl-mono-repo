import { util, Context } from "@aws-appsync/utils";
import { Story } from "gqlTypes";

type CTX = Context<{ storyId: string }, object, object, object, Story>;

export function request(ctx: CTX) {
  const { storyId } = ctx.args;

  if (!storyId) {
    return util.error("storyId is required", "ValidationException");
  }

  console.log(`Fetching story: ${storyId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: "METADATA",
    }),
  };
}

export function response(ctx: CTX): Story | null {
  if (ctx.error) {
    console.error("Error fetching story:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  if (!item) {
    return null;
  }

  // Map rootNodeId to rootChapterId for frontend compatibility
  if (item.rootNodeId) {
    item.rootChapterId = item.rootNodeId;
  }

  // Add authorName fallback for existing stories that don't have it
  if (!item.authorName && item.authorId) {
    item.authorName = item.authorId;
  }

  console.log("Story fetched successfully:", item);
  return item as Story;
}
