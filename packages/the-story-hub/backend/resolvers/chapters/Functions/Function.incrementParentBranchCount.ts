/**
 * AppSync Pipeline Function: Increment Parent Branch Count
 * This function increments the childBranches stat on the parent chapter node
 * after a new branch has been created.
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  // Get data from previous pipeline function (createBranchItem)
  const storyId = ctx.prev.result.storyId;
  const parentNodeId = ctx.prev.result.parentNodeId;

  console.log(`Incrementing branch count for parent: ${parentNodeId}`);

  // Use parentNodeId or "ROOT" if null
  const targetNodeId = parentNodeId || "ROOT";

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: `CHAPTER#${targetNodeId}`,
    }),
    update: {
      expression: "ADD stats.childBranches :inc",
      expressionValues: util.dynamodb.toMapValues({
        ":inc": 1,
      }),
    },
  };
}

export function response(ctx: any) {
  // Return the branch data from previous step
  return ctx.prev.result;
}
