import { util } from "@aws-appsync/utils";
import { VoteType } from "gqlTypes";

export function request(ctx: any) {
  console.log("Testing with ctx.prev.result access");

  // Access values from previous pipeline function
  const voteType = ctx.prev.result.voteType;
  const nodeId = ctx.prev.result.nodeId;
  const storyId = ctx.prev.result.storyId;

  const isUpvote = voteType === VoteType.UP;
  const expression = isUpvote
    ? "ADD stats.upvotes :inc"
    : "ADD stats.downvotes :inc";

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: `NODE#${nodeId}`,
    }),
    update: {
      expression,
      expressionValues: util.dynamodb.toMapValues({
        ":inc": 1,
      }),
    },
  };
}

export function response(ctx: any) {
  return ctx.result || {};
}
