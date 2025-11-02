/**
 * Field resolver for Comment.authorPatreonSupporter
 * Fetches the current Patreon supporter status from the User profile
 */
import { util, Context } from "@aws-appsync/utils";

// TODO: Replace 'any' with proper Comment type once it's exported from gqlTypes
type CTX = Context<object, object, object, any, boolean | null>;

export function request(ctx: CTX) {
  const comment = ctx.source;
  const authorId = comment?.authorId;

  if (!authorId) {
    return null;
  }

  console.log(`Fetching Patreon status for comment author: ${authorId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${authorId}`,
      SK: `PROFILE#${authorId}`,
    }),
    projection: { expression: "patreonSupporter" },
  };
}

export function response(ctx: CTX): boolean | null {
  if (ctx.error) {
    console.error("Error fetching user Patreon status:", ctx.error);
    return null;
  }

  // TODO: Remove 'as any' once proper User type is available
  const user = ctx.result as any;
  return user?.patreonSupporter ?? false;
}
