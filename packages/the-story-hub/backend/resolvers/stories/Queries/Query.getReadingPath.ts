/**
 * AppSync Resolver: Get Reading Path
 * Returns the full path of chapters from the root to the target node.
 * Takes a nodePath array (list of nodeIds in order) and fetches all chapters.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const storyId = ctx.args.storyId;
  const nodePath = ctx.args.nodePath;

  console.log(
    `Getting reading path for story ${storyId}, path length: ${nodePath.length}`,
  );

  // Query all chapters for this story, then filter in response
  return {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `STORY#${storyId}`,
        ":sk": "NODE#",
      }),
    },
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error getting reading path:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  const allChapters = ctx.result.items || [];
  console.log(`Retrieved ${allChapters.length} total chapters`);

  // Simplified: just return all chapters for now
  // TODO: Add filtering and sorting logic
  return allChapters;
}
