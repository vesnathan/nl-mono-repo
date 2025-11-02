/**
 * AppSync Pipeline Function: Fetch Parent Comment
 * Step 1 of createComment pipeline
 */

import { util, Context } from "@aws-appsync/utils";

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

export function response(ctx: Context<Args>) {
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
