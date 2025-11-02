/**
 * AppSync Pipeline Resolver: Create Branch
 * This is a PIPELINE resolver that orchestrates:
 * 1. Function.fetchParentNode - Get parent node data
 * 2. Function.createBranchItem - Create the branch node
 * 3. Function.incrementParentBranchCount - Update parent stats
 *
 * The pipeline is configured in CloudFormation appsync.yaml
 */

import { Context } from "@aws-appsync/utils";
import { ChapterNode, CreateBranchInput } from "gqlTypes";

type CTX = Context<
  { input: CreateBranchInput },
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
