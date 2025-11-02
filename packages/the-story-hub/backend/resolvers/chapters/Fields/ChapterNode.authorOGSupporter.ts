/**
 * Field resolver for ChapterNode.authorOGSupporter
 * Fetches the current OG supporter status from the User profile
 */
import { util, Context } from "@aws-appsync/utils";
import { ChapterNode } from "gqlTypes";

type CTX = Context<object, object, object, ChapterNode, boolean | null>;

export function request(ctx: CTX) {
  const chapter = ctx.source;
  const authorId = chapter?.authorId;

  if (!authorId) {
    return null;
  }

  console.log(`Fetching OG supporter status for chapter author: ${authorId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${authorId}`,
      SK: `PROFILE#${authorId}`,
    }),
    projection: { expression: "ogSupporter" },
  };
}

export function response(ctx: CTX): boolean | null {
  if (ctx.error) {
    console.error("Error fetching user OG supporter status:", ctx.error);
    return null;
  }

  // TODO: Remove 'as any' once proper User type is available
  const user = ctx.result as any;
  return user?.ogSupporter ?? false;
}
