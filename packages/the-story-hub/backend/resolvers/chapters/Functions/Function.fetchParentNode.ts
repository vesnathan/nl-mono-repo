/**
 * AppSync Pipeline Function: Fetch Parent Node
 * This function fetches the parent node to get storyId and chapterNumber for creating a branch.
 */

import { util, Context } from "@aws-appsync/utils";
import { CreateBranchInput, ChapterNode } from "gqlTypes";

type CTX = Context<{ input: CreateBranchInput }, object, object, object, any>;

export function request(ctx: CTX) {
  const { input } = ctx.args;

  console.log(`Fetching parent node: ${input.parentNodeId}`);

  // We need to query for the parent node
  // Since we don't know the storyId yet, we need to use GSI1 or scan
  // Better approach: Query using a pattern that works
  // For now, we'll assume we need to pass storyId in the input
  // OR we can use a Scan with filter (not ideal but works for pipeline demo)

  // Alternative: Use Query on main table if we store parent references
  // Let's query CHAPTER# prefix items to find the parent

  // Best approach: Store a reverse lookup or require storyId in input
  // For this example, let's create a query that finds the chapter

  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "SK = :sk",
      expressionValues: util.dynamodb.toMapValues({
        ":sk": `CHAPTER#${input.parentNodeId}`,
      }),
    },
    limit: 1,
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error fetching parent node:", ctx.error);
    return util.error(ctx.error.message, "ParentNodeFetchFailed");
  }

  const items = ctx.result.items || [];

  if (items.length === 0) {
    return util.error(
      `Parent node not found: ${ctx.args.input.parentNodeId}`,
      "ParentNodeNotFound",
    );
  }

  const parentNode = items[0];

  console.log("Parent node fetched successfully:", parentNode.nodeId);

  // Return the parent node data to be used by next function
  // Store it in stash for the next pipeline function to access
  return {
    storyId: parentNode.storyId,
    parentChapterNumber: parentNode.chapterNumber,
    parentNode: parentNode,
  };
}
