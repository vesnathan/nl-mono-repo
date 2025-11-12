/**
 * AppSync Pipeline Function: Fetch Parent Node
 * This function fetches the parent node to get storyId and chapterNumber for creating a branch.
 */

import { util, Context } from "@aws-appsync/utils";
import { CreateBranchInput, ChapterNode } from "gqlTypes";

type CTX = Context<{ input: CreateBranchInput }, object, object, object, any>;

export function request(ctx: CTX) {
  const { input } = ctx.args;

  console.log(`Fetching parent node: ${input.parentNodeId} from story: ${input.storyId}`);

  // Use GetItem with the storyId from input
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${input.storyId}`,
      SK: `NODE#${input.parentNodeId}`,
    }),
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error fetching parent node:", ctx.error);
    return util.error(ctx.error.message, "ParentNodeFetchFailed");
  }

  const parentNode = ctx.result;

  if (!parentNode || !parentNode.nodeId) {
    return util.error(
      `Parent node not found: ${ctx.args.input.parentNodeId}`,
      "ParentNodeNotFound",
    );
  }

  console.log("Parent node fetched successfully:", parentNode.nodeId);

  // Return the parent node data to be used by next function
  // Store it in stash for the next pipeline function to access
  return {
    storyId: parentNode.storyId,
    parentChapterNumber: parentNode.chapterNumber,
    parentNode: parentNode,
  };
}
