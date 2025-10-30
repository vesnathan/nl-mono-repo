/**
 * AppSync Pipeline Function: Check Existing Vote
 * This function checks if the user has already voted on this chapter.
 */

import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { VoteType } from "gqlTypes";

type CTX = Context<
  { nodeId: string; voteType: VoteType },
  object,
  object,
  object,
  any
>;

export function request(ctx: CTX) {
  const { nodeId } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  console.log(`Checking if user ${identity.username} has already voted on chapter ${nodeId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${identity.username}`,
      SK: `VOTE#${nodeId}`,
    }),
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error checking existing vote:", ctx.error);
    return util.error(ctx.error.message, "VoteCheckFailed");
  }

  const existingVote = ctx.result;

  if (existingVote) {
    // User has already voted
    return util.error(
      "You have already voted on this chapter",
      "DuplicateVote"
    );
  }

  console.log("No existing vote found, proceeding");

  // Return empty result to continue pipeline
  return {
    canVote: true,
  };
}
