import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
import { ChapterNode, UpdateChapterInput } from "gqlTypes";

type CTX = Context<
  { input: UpdateChapterInput },
  object,
  object,
  object,
  ChapterNode
>;

export function request(ctx: CTX) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const now = util.time.nowISO8601();

  console.log(`Updating chapter ${input.nodeId} by user: ${identity.username}`);

  const updateExpression: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, any> = {};

  if (input.content) {
    updateExpression.push("#content = :content");
    expressionNames["#content"] = "content";
    expressionValues[":content"] = input.content;
  }

  if (input.branchDescription !== undefined) {
    updateExpression.push("#branchDescription = :branchDescription");
    expressionNames["#branchDescription"] = "branchDescription";
    expressionValues[":branchDescription"] = input.branchDescription;
  }

  if (updateExpression.length === 0) {
    return util.error("No fields to update", "ValidationException");
  }

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${input.storyId}`,
      SK: `CHAPTER#${input.nodeId}`,
    }),
    update: {
      expression: `SET ${updateExpression.join(", ")}`,
      expressionNames,
      expressionValues: util.dynamodb.toMapValues(expressionValues),
    },
    // Only update if within edit window and user is author
    condition: {
      expression: "editableUntil > :now AND authorId = :authorId",
      expressionValues: util.dynamodb.toMapValues({
        ":now": now,
        ":authorId": identity.username,
      }),
    },
  };
}

export function response(ctx: CTX): ChapterNode {
  if (ctx.error) {
    if (ctx.error.type === "ConditionalCheckFailedException") {
      return util.error(
        "Unauthorized: Edit window expired or you are not the author",
        "Unauthorized",
      );
    }
    console.error("Error updating chapter:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  console.log("Chapter updated successfully:", ctx.result);
  return ctx.result as ChapterNode;
}
