import { util, Context } from "@aws-appsync/utils";
import { ChapterNode } from "gqlTypes";

type CTX = Context<
  { storyId: string; nodeId: string },
  object,
  object,
  object,
  ChapterNode
>;

export function request(ctx: CTX) {
  const { storyId, nodeId } = ctx.args;

  if (!storyId || !nodeId) {
    return util.error("storyId and nodeId are required", "ValidationException");
  }

  console.log(`Fetching chapter: ${nodeId} from story: ${storyId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `STORY#${storyId}`,
      SK: `CHAPTER#${nodeId}`,
    }),
  };
}

export function response(ctx: CTX): ChapterNode | null {
  if (ctx.error) {
    console.error("Error fetching chapter:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result;

  if (!item) {
    return null;
  }

  console.log("Chapter fetched successfully:", item);
  return item as ChapterNode;
}
