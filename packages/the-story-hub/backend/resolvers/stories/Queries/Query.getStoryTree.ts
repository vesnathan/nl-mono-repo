/**
 * AppSync Resolver: Get Story Tree
 * Returns the entire tree structure of a story with all chapters.
 * This fetches all chapters for the story and builds a tree structure.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const storyId = ctx.args.storyId;

  console.log(`Getting story tree for story ${storyId}`);

  return {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `STORY#${storyId}`,
        ":sk": "CHAPTER#",
      }),
    },
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error getting story tree:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Returning simplified tree - TODO: implement full tree building");

  // Simplified implementation - just return empty tree for now
  return {
    rootNode: null,
    totalNodes: 0,
  };
}
