/**
 * AppSync Pipeline Function: Create Comment Item
 * Step 2 of createComment pipeline
 */

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";

type CreateCommentInput = {
  storyId: string;
  nodeId: string;
  content: string;
  parentCommentId?: string;
};

type Args = {
  input: CreateCommentInput;
};

export function request(ctx: Context<Args>) {
  const { storyId, nodeId, content, parentCommentId } = ctx.args.input;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;
  const userName = identity.username || "Anonymous";

  // Calculate depth from parent
  const parentDepth = (ctx.stash as any).parentDepth ?? -1;
  const depth = parentDepth + 1;

  console.log(
    `Creating comment with depth ${depth} (parent depth: ${parentDepth})`,
  );

  const commentId = util.autoId();
  const now = util.time.nowISO8601();

  const comment = {
    PK: `STORY#${storyId}#NODE#${nodeId}`,
    SK: `COMMENT#${commentId}`,
    GSI1PK: parentCommentId ? `COMMENT#${parentCommentId}` : `NODE#${nodeId}`,
    GSI1SK: `CREATED#${now}`,
    commentId,
    storyId,
    nodeId,
    authorId: userId,
    authorName: userName,
    content,
    parentCommentId: parentCommentId || null,
    depth,
    createdAt: now,
    updatedAt: now,
    edited: false,
    stats: {
      upvotes: 0,
      downvotes: 0,
      replyCount: 0,
      totalReplyCount: 0,
    },
  };

  // Store new comment in stash for final step
  (ctx.stash as any).newComment = comment;

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: comment.PK,
      SK: comment.SK,
    }),
    attributeValues: util.dynamodb.toMapValues(comment),
  };
}

export function response(ctx: Context<Args>) {
  if (ctx.error) {
    console.error("Error creating comment:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Comment created successfully");
  return ctx.result;
}
