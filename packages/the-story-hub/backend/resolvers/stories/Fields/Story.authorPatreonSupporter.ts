/**
 * Field resolver for Story.authorPatreonSupporter
 * Fetches the current Patreon supporter status from the User profile
 */
import { util, Context } from "@aws-appsync/utils";
import { Story } from "gqlTypes";

type CTX = Context<object, object, object, Story, boolean | null>;

export function request(ctx: CTX) {
  const story = ctx.source;
  const authorId = story?.authorId;

  if (!authorId) {
    return null;
  }

  console.log(`Fetching Patreon status for author: ${authorId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${authorId}`,
      SK: `PROFILE#${authorId}`,
    }),
    // Only fetch the fields we need for performance
    projection: { expression: "patreonSupporter" },
  };
}

export function response(ctx: CTX): boolean | null {
  if (ctx.error) {
    console.error("Error fetching user Patreon status:", ctx.error);
    // Return null/false rather than failing the whole query
    return null;
  }

  // TODO: Remove 'as any' once proper User type is available
  const user = ctx.result as any;
  return user?.patreonSupporter ?? false;
}
