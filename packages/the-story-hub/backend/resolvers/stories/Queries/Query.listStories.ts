import { util, Context } from "@aws-appsync/utils";
import { StoryConnection, StoryFilter } from "gqlTypes";

type CTX = Context<
  { filter?: StoryFilter | null; limit?: number | null; nextToken?: string | null },
  object,
  object,
  object,
  StoryConnection
>;

export function request(ctx: CTX) {
  const { filter, limit = 20, nextToken } = ctx.args;

  console.log("Listing stories with filter:", filter);

  // Query GSI1 for story list
  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "GSI1PK = :pk",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": "STORY_LIST",
      }),
    },
    limit,
    nextToken,
    scanIndexForward: false, // Newest first
  };
}

export function response(ctx: CTX): StoryConnection {
  if (ctx.error) {
    console.error("Error listing stories:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const { items = [], nextToken } = ctx.result;

  // Filter by genre/ageRating/featured if provided
  let filteredItems = items;
  const filter = ctx.args.filter;

  if (filter?.genre) {
    filteredItems = filteredItems.filter((item: any) =>
      item.genre?.includes(filter.genre)
    );
  }

  if (filter?.ageRating) {
    filteredItems = filteredItems.filter((item: any) =>
      item.ageRating === filter.ageRating
    );
  }

  if (filter?.featured !== undefined && filter?.featured !== null) {
    filteredItems = filteredItems.filter((item: any) =>
      item.featured === filter.featured
    );
  }

  if (filter?.minRating !== undefined && filter?.minRating !== null) {
    const minRating = filter.minRating;
    filteredItems = filteredItems.filter((item: any) =>
      item.stats?.rating >= minRating
    );
  }

  console.log(`Returning ${filteredItems.length} stories`);

  return {
    __typename: "StoryConnection",
    items: filteredItems,
    nextToken,
  };
}
