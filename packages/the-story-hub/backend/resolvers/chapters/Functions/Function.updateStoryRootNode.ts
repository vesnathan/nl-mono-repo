/**
 * AppSync Pipeline Function: Update Story Root Node
 * This function updates the story's rootNodeId if this is the first chapter (chapter 1).
 */

import { util } from "@aws-appsync/utils";

export function request(ctx: any) {
  // Get data from previous pipeline function
  const { chapter, isFirstChapter } = ctx.prev.result;

  // Only update if this is the first chapter
  if (!isFirstChapter) {
    console.log("Not the first chapter, skipping story update");
    return {};
  }

  console.log(
    `Updating story ${chapter.storyId} with rootNodeId: ${chapter.nodeId}`,
  );

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${chapter.storyId}`,
      SK: "METADATA",
    }),
    update: {
      expression: "SET rootNodeId = :rootNodeId",
      expressionValues: util.dynamodb.toMapValues({
        ":rootNodeId": chapter.nodeId,
      }),
    },
  };
}

export function response(ctx: any) {
  if (ctx.error) {
    console.error("Error updating story rootNodeId:", ctx.error);
    // Don't fail the whole operation if this update fails
    console.log("Continuing despite error");
  }

  // Return the chapter from previous step
  return ctx.prev.result.chapter;
}
