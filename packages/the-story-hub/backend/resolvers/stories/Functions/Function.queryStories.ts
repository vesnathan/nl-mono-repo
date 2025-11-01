import { util, Context } from "@aws-appsync/utils";
import { StoryFilter } from "gqlTypes";

type CTX = Context<
  {
    filter?: StoryFilter | null;
    limit?: number | null;
    nextToken?: string | null;
  },
  object,
  object,
  object,
  any
>;

export function request(ctx: CTX) {
  const { filter, limit = 20, nextToken } = ctx.args;

  console.log("Querying stories with filter:", filter);

  // Query GSI1 for story list
  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "GSI1PK = :pk",
      expressionValues: util.dynamodb.toMapValues({
        ":pk": "STORY",
      }),
    },
    limit,
    nextToken,
    scanIndexForward: false, // Newest first
  };
}

export function response(ctx: CTX) {
  if (ctx.error) {
    console.error("Error querying stories:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const { items = [], nextToken } = ctx.result;

  // Filter by genre/ageRating/featured if provided
  let filteredItems = items;
  const filter = ctx.args.filter;

  if (filter?.genre) {
    filteredItems = filteredItems.filter((item: any) =>
      item.genre?.includes(filter.genre),
    );
  }

  if (filter?.ageRating) {
    filteredItems = filteredItems.filter(
      (item: any) => item.ageRating === filter.ageRating,
    );
  }

  if (filter?.featured !== undefined && filter?.featured !== null) {
    filteredItems = filteredItems.filter(
      (item: any) => item.featured === filter.featured,
    );
  }

  if (filter?.minRating !== undefined && filter?.minRating !== null) {
    const minRating = filter.minRating;
    filteredItems = filteredItems.filter(
      (item: any) => item.stats?.rating >= minRating,
    );
  }

  // Map ageRating values to match GraphQL enum (replace hyphens with underscores)
  const mappedItems = filteredItems.map((item: any) => {
    if (item.ageRating && item.ageRating.includes("-")) {
      return {
        ...item,
        ageRating: item.ageRating.split("-").join("_"),
      };
    }
    return item;
  });

  console.log(`Queried ${mappedItems.length} stories`);

  // Store stories and nextToken in stash for next function
  ctx.stash.stories = mappedItems;
  ctx.stash.nextToken = nextToken;

  return mappedItems;
}
