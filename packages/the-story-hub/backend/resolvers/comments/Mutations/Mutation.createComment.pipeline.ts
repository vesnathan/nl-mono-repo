/**
 * AppSync Pipeline Resolver: Create Comment
 * Pipeline steps:
 * 1. Fetch parent comment (if parentCommentId provided)
 * 2. Create the new comment with correct depth
 * 3. Update parent stats (if parent exists)
 * 4. Increment story totalComments stat
 */

import { Context } from "@aws-appsync/utils";

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

// Before function - passes through to first pipeline function
export function request(ctx: CTX) {
  return {};
}

// After function - returns the created comment
export function response(ctx: CTX) {
  // The new comment is stored in stash by the last function
  const comment = (ctx.stash as any).newComment;

  console.log(`Pipeline returning created comment: ${comment.commentId}`);

  return comment;
}
