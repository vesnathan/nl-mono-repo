/**
 * AppSync Pipeline Resolver: Create Comment
 * Pipeline steps:
 * 1. Fetch parent comment (if parentCommentId provided)
 * 2. Create the new comment with correct depth
 * 3. Update parent stats (if parent exists)
 * 4. Increment story totalComments stat
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

// Step 1: Fetch parent comment
export function fetchParentRequest(ctx: Context<Args>) {
  const { storyId, nodeId, parentCommentId } = ctx.args.input;

  // If no parent, skip this step
  if (!parentCommentId) {
    return {
      operation: "GetItem",
      key: util.dynamodb.toMapValues({
        PK: "SKIP",
        SK: "SKIP",
      }),
    };
  }

  console.log(`Fetching parent comment: ${parentCommentId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}#NODE#${nodeId}`,
      SK: `COMMENT#${parentCommentId}`,
    }),
  };
}

export function fetchParentResponse(ctx: Context<Args>) {
  if (ctx.error) {
    console.error("Error fetching parent comment:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  // Store parent in stash for next step
  const parent = ctx.result as any;
  if (parent && parent.commentId) {
    console.log(`Found parent with depth: ${parent.depth}`);
    (ctx.stash as any).parentDepth = parent.depth;
  } else {
    console.log("No parent comment found or creating top-level comment");
    (ctx.stash as any).parentDepth = -1; // Will result in depth 0
  }

  return parent;
}

// Step 2: Create the comment
export function createCommentRequest(ctx: Context<Args>) {
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

  // Store new comment in stash for potential parent update
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

export function createCommentResponse(ctx: Context<Args>) {
  if (ctx.error) {
    console.error("Error creating comment:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Comment created successfully");
  return ctx.result;
}

// Step 3: Update parent stats (increment replyCount and totalReplyCount)
export function updateParentStatsRequest(ctx: Context<Args>) {
  const { storyId, nodeId, parentCommentId } = ctx.args.input;

  // If no parent, skip this step
  if (!parentCommentId) {
    return {
      operation: "GetItem",
      key: util.dynamodb.toMapValues({
        PK: "SKIP",
        SK: "SKIP",
      }),
    };
  }

  console.log(`Updating parent stats for: ${parentCommentId}`);

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}#NODE#${nodeId}`,
      SK: `COMMENT#${parentCommentId}`,
    }),
    update: {
      expression:
        "ADD #stats.#replyCount :one, #stats.#totalReplyCount :one SET #updatedAt = :now",
      expressionNames: {
        "#stats": "stats",
        "#replyCount": "replyCount",
        "#totalReplyCount": "totalReplyCount",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":one": 1,
        ":now": util.time.nowISO8601(),
      }),
    },
  };
}

export function updateParentStatsResponse(ctx: Context<Args>) {
  if (ctx.error) {
    console.error("Error updating parent stats:", ctx.error);
    // Don't fail the whole operation, just log the error
    console.error("Continuing despite parent stats update failure");
  } else {
    console.log("Parent stats updated successfully");
  }

  // Continue to next step
  return ctx.result;
}

// Step 4: Increment story totalComments stat
export function incrementStoryCommentsRequest(ctx: Context<Args>) {
  const { storyId } = ctx.args.input;

  console.log(`Incrementing totalComments for story: ${storyId}`);

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: "METADATA",
    }),
    update: {
      expression: "ADD #stats.#totalComments :one SET #updatedAt = :now",
      expressionNames: {
        "#stats": "stats",
        "#totalComments": "totalComments",
        "#updatedAt": "updatedAt",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":one": 1,
        ":now": util.time.nowISO8601(),
      }),
    },
  };
}

export function incrementStoryCommentsResponse(ctx: Context<Args>) {
  if (ctx.error) {
    console.error("Error incrementing story totalComments:", ctx.error);
    // Don't fail the whole operation, just log the error
    console.error("Continuing despite story stats update failure");
  } else {
    console.log("Story totalComments incremented successfully");
  }

  // Return the newly created comment from stash
  return (ctx.stash as any).newComment;
}
