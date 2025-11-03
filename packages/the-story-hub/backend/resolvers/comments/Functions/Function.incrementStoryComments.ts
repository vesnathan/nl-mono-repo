/**
 * AppSync Pipeline Function: Increment Story totalComments
 * Step 4 of createComment pipeline
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

export function response(ctx: Context<Args>) {
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
