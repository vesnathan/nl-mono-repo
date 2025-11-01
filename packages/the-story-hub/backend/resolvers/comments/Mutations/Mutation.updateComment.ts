/**
 * AppSync Resolver: Update Comment
 * Allows comment author to edit their comment.
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

type UpdateCommentInput = {
  commentId: string;
  storyId: string;
  nodeId: string;
  content: string;
};

type Args = {
  input: UpdateCommentInput;
};

type CTX = Context<Args, object, object, object, any>;

export function request(ctx: CTX) {
  const { commentId, storyId, nodeId, content } = ctx.args.input;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  console.log(`Updating comment ${commentId}`);

  const now = util.time.nowISO8601();

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}#NODE#${nodeId}`,
      SK: `COMMENT#${commentId}`,
    }),
    update: {
      expression: "SET content = :content, updatedAt = :updatedAt, edited = :edited",
      expressionValues: util.dynamodb.toMapValues({
        ":content": content,
        ":updatedAt": now,
        ":edited": true,
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

export function response(ctx: CTX) {
  if (ctx.error) {
    if (ctx.error.type === "DynamoDB:ConditionalCheckFailedException") {
      return util.error("You can only edit your own comments", "Unauthorized");
    }
    console.error("Error updating comment:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  return ctx.result;
}
