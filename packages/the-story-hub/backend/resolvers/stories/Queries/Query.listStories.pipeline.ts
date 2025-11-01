import { Context } from "@aws-appsync/utils";
import { StoryConnection } from "gqlTypes";

type CTX = Context<any, object, object, object, StoryConnection>;

// Before function - passes through to first pipeline function
export function request(ctx: CTX) {
  return {};
}

// After function - formats final response and adds missing fields
export function response(ctx: CTX): StoryConnection {
  const stories = ctx.prev.result || [];
  const nextToken = ctx.stash.nextToken;

  // Map rootNodeId to rootChapterId for frontend compatibility
  // Add authorName fallback for existing stories that don't have it
  const mappedItems = stories.map((item: any) => ({
    ...item,
    rootChapterId: item.rootNodeId || item.rootChapterId,
    authorName: item.authorName || item.authorId, // Fallback to authorId if authorName not set
  }));

  console.log(`Pipeline returning ${mappedItems.length} stories`);

  return {
    __typename: "StoryConnection",
    items: mappedItems,
    nextToken,
  };
}
