/**
 * AppSync Pipeline Function: Record Vote
 * This function records the user's vote in DynamoDB.
 */

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { VoteType } from "gqlTypes";

type CTX = Context<
  { nodeId: string; voteType: VoteType; storyId?: string },
  object,
  any,
  object,
  any
>;

export function request(ctx: CTX) {
  const { nodeId, voteType, storyId } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const now = util.time.nowISO8601();

  console.log(`Recording ${voteType} vote from user ${identity.username} on chapter ${nodeId}`);

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${identity.username}`,
      SK: `VOTE#${nodeId}`,
    }),
    attributeValues: util.dynamodb.toMapValues({
      userId: identity.username,
      nodeId,
      storyId: storyId || "UNKNOWN",
      voteType,
      votedAt: now,
    }),
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error recording vote:", ctx.error);
    return util.error(ctx.error.message, "VoteRecordFailed");
  }

  console.log("Vote recorded successfully");

  // Return the vote type so next function can increment the right counter
  return {
    voteType: ctx.args.voteType,
    nodeId: ctx.args.nodeId,
    storyId: ctx.args.storyId,
  };
}
