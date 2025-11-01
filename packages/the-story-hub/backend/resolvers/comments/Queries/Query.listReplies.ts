/**
 * AppSync Resolver: List Replies
 * Lists all direct replies to a specific comment.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const { storyId, nodeId, parentCommentId, limit, nextToken } = ctx.args;
  const maxLimit = limit || 20;

  console.log(`Listing replies for comment ${parentCommentId}`);

  return {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `STORY#${storyId}#NODE#${nodeId}`,
        ":sk": "COMMENT#",
      }),
    },
    filter: {
      expression: "parentCommentId = :parentCommentId",
      expressionValues: util.dynamodb.toMapValues({
        ":parentCommentId": parentCommentId,
      }),
    },
    limit: maxLimit,
    nextToken: nextToken,
    scanIndexForward: true, // Oldest first for replies
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error listing replies:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result.items || [];
  console.log(`Found ${items.length} replies`);

  return {
    items,
    nextToken: ctx.result.nextToken,
    total: items.length,
  };
}
