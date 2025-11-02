/**
 * AppSync Pipeline Resolver: Vote On Chapter
 * This is a PIPELINE resolver that orchestrates:
 * 1. Function.checkExistingVote - Check if user already voted
 * 2. Function.recordVote - Record the vote
 * 3. Function.incrementVoteCount - Update chapter stats
 *
 * The pipeline is configured in CloudFormation appsync.yaml
 */

import { Context } from "@aws-appsync/utils";
import { ChapterNode, VoteType } from "gqlTypes";

type CTX = Context<
  { nodeId: string; voteType: VoteType; storyId?: string },
  object,
  object,
  object,
  ChapterNode
> & { prev: { result: ChapterNode } };

// Pipeline resolver passthrough - no operation needed
export function request(ctx: CTX) {
  return {};
}

// Return the final result from the last pipeline function
export function response(ctx: CTX): ChapterNode {
  return ctx.prev.result as ChapterNode;
}
