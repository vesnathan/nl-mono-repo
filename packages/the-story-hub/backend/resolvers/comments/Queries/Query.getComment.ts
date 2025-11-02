/**
 * AppSync Resolver: Get Comment
 * Fetches a specific comment by ID.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const { storyId, nodeId, commentId } = ctx.args;

  console.log(`Getting comment ${commentId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}#NODE#${nodeId}`,
      SK: `COMMENT#${commentId}`,
    }),
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error getting comment:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  if (!ctx.result) {
    util.error("Comment not found", "NotFound");
  }

  return ctx.result;
}
