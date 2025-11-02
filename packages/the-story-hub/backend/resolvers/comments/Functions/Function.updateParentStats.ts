/**
 * AppSync Pipeline Function: Update Parent Comment Stats
 * Step 3 of createComment pipeline
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

export function response(ctx: Context<Args>) {
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
