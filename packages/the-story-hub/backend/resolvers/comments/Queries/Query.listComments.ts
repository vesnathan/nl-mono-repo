/**
 * AppSync Resolver: List Comments
 * Lists top-level comments for a specific story node/chapter.
 * Supports sorting and pagination.
 *
 * IMPORTANT NOTES FOR APPSYNC RESOLVERS:
 * - Must import { util, Context } from "@aws-appsync/utils"
 * - Use util.autoId() for IDs, NOT uuid
 * - Use util.time.nowISO8601() for timestamps, NOT new Date().toISOString()
 * - Return types must match GraphQL schema exactly
 * - Response function must return the expected type or call util.error()
 * - No spread operators, Array.sort(), or other ES6+ features that aren't supported
 */

import { util, Context } from "@aws-appsync/utils";

type Args = {
  storyId: string;
  nodeId: string;
  sortBy?: string;
  limit?: number;
  nextToken?: string;
};

type CommentConnection = {
  items: any[];
  nextToken: string | null;
  total: number;
};

type CTX = Context<Args, object, object, object, CommentConnection>;

export function request(ctx: CTX) {
  const { storyId, nodeId, sortBy, limit, nextToken } = ctx.args;
  const maxLimit = limit || 20;
  const sort = sortBy || "NEWEST";

  console.log(`Listing comments for story ${storyId}, node ${nodeId}, sortBy: ${sort}`);

  // Determine sort order
  let scanIndexForward = false; // Default: newest first
  if (sort === "OLDEST") {
    scanIndexForward = true;
  }

  const requestObj: any = {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `STORY#${storyId}#NODE#${nodeId}`,
        ":sk": "COMMENT#",
      }),
    },
    filter: {
      expression: "attribute_not_exists(parentCommentId)",
    },
    limit: maxLimit,
    scanIndexForward,
  };

  if (nextToken) {
    requestObj.nextToken = nextToken;
  }

  return requestObj;
}

export function response(ctx: CTX): CommentConnection {
  if (ctx.error) {
    console.error("Error listing comments:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result.items || [];
  console.log(`Found ${items.length} top-level comments`);

  return {
    items: items,
    nextToken: ctx.result.nextToken || null,
    total: items.length,
  };
}
