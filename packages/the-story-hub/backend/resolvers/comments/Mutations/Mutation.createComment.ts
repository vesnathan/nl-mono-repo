/**
 * AppSync Resolver: Create Comment
 * Creates a new comment or reply on a chapter/branch.
 *
 * IMPORTANT NOTES FOR APPSYNC RESOLVERS:
 * - Must import { util, Context } from "@aws-appsync/utils"
 * - Use util.autoId() for IDs, NOT uuid
 * - Use util.time.nowISO8601() for timestamps, NOT new Date().toISOString()
 * - Return types must match GraphQL schema exactly
 * - Response function must return the expected type or call util.error()
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

type CTX = Context<Args, object, object, object, any>;

export function request(ctx: CTX) {
  const { storyId, nodeId, content, parentCommentId } = ctx.args.input;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;
  const userName = identity.username || "Anonymous";

  console.log(`Creating comment for story ${storyId}, node ${nodeId}`);

  // Calculate depth based on parent
  let depth = 0;
  if (parentCommentId) {
    depth = 1; // Simple depth for now, can be enhanced later
  }

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

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: comment.PK,
      SK: comment.SK,
    }),
    attributeValues: util.dynamodb.toMapValues(comment),
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error creating comment:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Comment created successfully");
  return ctx.result;
}
