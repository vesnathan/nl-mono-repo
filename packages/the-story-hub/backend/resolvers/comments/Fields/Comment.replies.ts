/**
 * AppSync Field Resolver: Comment.replies
 * Resolves the nested replies field for a Comment.
 * This is automatically called by AppSync when the replies field is requested.
 *
 * IMPORTANT: This resolver queries for direct children only (depth = parent.depth + 1).
 * Nested replies within replies are handled recursively by AppSync calling this
 * resolver again for each child comment.
 */

import { util, Context } from "@aws-appsync/utils";

type Comment = {
  commentId: string;
  storyId: string;
  nodeId: string;
  depth: number;
  stats?: {
    replyCount?: number;
  };
};

type CTX = Context<object, object, Comment, object, Comment[]>;

export function request(ctx: CTX) {
  // TODO: Fix type - ctx.source should be properly typed as Comment
  const parent = ctx.source as any;
  const { commentId, storyId, nodeId } = parent || {};

  console.log(
    `Resolving replies for comment ${commentId}, depth: ${parent?.depth}`,
  );

  // Query for direct replies to this comment
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
        ":parentCommentId": commentId,
      }),
    },
    limit: 20, // Fetch up to 20 replies per comment
    scanIndexForward: true, // Oldest first for replies
  };
}

export function response(ctx: CTX): Comment[] {
  if (ctx.error) {
    console.error("Error fetching replies:", ctx.error);
    return [];
  }

  // TODO: Fix type - ctx.result should have proper type
  const items = (ctx.result as any).items || [];
  // TODO: Fix type - ctx.source should be properly typed as Comment
  console.log(
    `Fetched ${items.length} replies for comment ${(ctx.source as any)?.commentId}`,
  );

  return items;
}
