/**
 * AppSync Resolver: Delete Comment
 * Allows comment author to delete their comment.
 * Note: This will soft-delete by marking as deleted, preserving thread structure.
 *
 * IMPORTANT NOTES FOR APPSYNC RESOLVERS:
 * - Must import { util, Context } from "@aws-appsync/utils"
 * - Use util.autoId() for IDs, NOT uuid
 * - Use util.time.nowISO8601() for timestamps, NOT new Date().toISOString()
 * - Return types must match GraphQL schema exactly
 * - Response function must return the expected type or call util.error()
 * - Cannot duplicate expressionValues keys between update and condition
 */

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";

type DeleteCommentInput = {
  commentId: string;
  storyId: string;
  nodeId: string;
};

type Args = {
  input: DeleteCommentInput;
};

type DeleteCommentResponse = {
  success: boolean;
  message: string;
};

type CTX = Context<Args, object, object, object, DeleteCommentResponse>;

export function request(ctx: CTX) {
  const { commentId, storyId, nodeId } = ctx.args.input;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  console.log(`Deleting comment ${commentId}`);

  const now = util.time.nowISO8601();

  // Soft delete: mark as deleted but keep structure for replies
  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}#NODE#${nodeId}`,
      SK: `COMMENT#${commentId}`,
    }),
    update: {
      expression: "SET content = :deleted, updatedAt = :updatedAt, #deleted = :true",
      expressionNames: {
        "#deleted": "deleted",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":deleted": "[deleted]",
        ":updatedAt": now,
        ":true": true,
      }),
    },
    condition: {
      expression: "authorId = :userId",
      expressionValues: util.dynamodb.toMapValues({
        ":userId": userId,
      }),
    },
  };
}

export function response(ctx: CTX): DeleteCommentResponse {
  if (ctx.error) {
    if (ctx.error.type === "DynamoDB:ConditionalCheckFailedException") {
      return util.error("You can only delete your own comments", "Unauthorized");
    }
    console.error("Error deleting comment:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  return {
    success: true,
    message: "Comment deleted successfully",
  };
}
