/**
 * AppSync Resolver: List Branches
 * Lists all child branches of a given chapter node.
 * Returns chapters that have this node as their parent.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  const storyId = ctx.args.storyId;
  const nodeId = ctx.args.nodeId;

  console.log(`Listing branches for story ${storyId}, node ${nodeId}`);

  return {
    operation: "Query",
    query: {
      expression: "PK = :pk AND begins_with(SK, :sk)",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": `STORY#${storyId}`,
        ":sk": "NODE#",
      }),
    },
    filter: {
      expression: "parentNodeId = :parentNodeId",
      expressionValues: util.dynamodb.toMapValues({
        ":parentNodeId": nodeId,
      }),
    },
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error listing branches:", ctx.error);
    util.error(ctx.error.message, ctx.error.type);
  }

  const branches = ctx.result.items || [];
  console.log(`Found ${branches.length} branches`);

  return branches;
}
