import { util, Context } from "@aws-appsync/utils";
import { LeaderboardEntry, LeaderboardType } from "gqlTypes";

type CTX = Context<{ type: LeaderboardType; limit?: number }, object, object, object, LeaderboardEntry[]>;

export function request(ctx: CTX) {
  const type = ctx.args.type;
  const limit = ctx.args.limit || 10;

  console.log(`Getting leaderboard for type: ${type}, limit: ${limit}`);

  // Query using GSI1 where we store leaderboard data
  // GSI1PK=LEADERBOARD#{type}, GSI1SK will be sorted by score
  return {
    operation: "Query",
    index: "GSI1",
    query: {
      expression: "#GSI1PK = :leaderboardType",
      expressionNames: {
        "#GSI1PK": "GSI1PK",
      },
      expressionValues: util.dynamodb.toMapValues({
        ":leaderboardType": `LEADERBOARD#${type}`,
      }),
    },
    scanIndexForward: false, // Descending order (highest scores first)
    limit,
  };
}

export function response(ctx: CTX): LeaderboardEntry[] {
  if (ctx.error) {
    console.error("Error fetching leaderboard:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const items = ctx.result.items as any[];

  if (!items || items.length === 0) {
    return [];
  }

  const entries: LeaderboardEntry[] = items.map((item, index) => ({
    __typename: "LeaderboardEntry",
    userId: item.userId || "",
    username: item.username || "Anonymous",
    chips: item.chips || 0,
    winRate: item.winRate || 0,
    handsPlayed: item.handsPlayed || 0,
    rank: index + 1,
  }));

  console.log(`Leaderboard fetched: ${entries.length} entries`);
  return entries;
}
