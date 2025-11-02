/**
 * AppSync Resolver: Vote on Comment
 * Allows users to upvote or downvote comments.
 * Uses pipeline resolver to track user votes and update stats.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const { storyId, nodeId, commentId, voteType } = ctx.args;
  const userId = ctx.identity.sub;

  console.log(`User ${userId} voting ${voteType} on comment ${commentId}`);

  // Store vote type in stash for pipeline functions
  ctx.stash.voteType = voteType;
  ctx.stash.userId = userId;
  ctx.stash.storyId = storyId;
  ctx.stash.nodeId = nodeId;
  ctx.stash.commentId = commentId;

  // First, get the current comment to check existing vote
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
    console.error("Error voting on comment:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  if (!ctx.result) {
    util.error("Comment not found", "NotFound");
  }

  return ctx.result;
}
