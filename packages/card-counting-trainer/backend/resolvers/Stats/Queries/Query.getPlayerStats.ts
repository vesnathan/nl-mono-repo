import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { PlayerStats } from "gqlTypes";

type CTX = Context<object, object, object, object, PlayerStats>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException",
    );
  }

  console.log(`Getting player stats for userId: ${userId}`);

  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `STATS#CURRENT`,
    }),
  };
}

export function response(ctx: CTX): PlayerStats {
  if (ctx.error) {
    console.error("Error fetching player stats:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  // If no stats exist, return default stats
  if (!item) {
    const now = util.time.nowISO8601();
    return {
      __typename: "PlayerStats",
      userId,
      chips: 1000, // Default starting chips
      totalHandsPlayed: 0,
      handsWon: 0,
      handsLost: 0,
      handsPushed: 0,
      blackjacksHit: 0,
      totalWagered: 0,
      totalWon: 0,
      winRate: 0,
      bestChipCount: 1000,
      worstChipCount: 1000,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLoseStreak: 0,
      lastPlayed: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  const stats: PlayerStats = {
    __typename: "PlayerStats",
    userId,
    chips: item.chips || 0,
    totalHandsPlayed: item.totalHandsPlayed || 0,
    handsWon: item.handsWon || 0,
    handsLost: item.handsLost || 0,
    handsPushed: item.handsPushed || 0,
    blackjacksHit: item.blackjacksHit || 0,
    totalWagered: item.totalWagered || 0,
    totalWon: item.totalWon || 0,
    winRate: item.winRate || 0,
    bestChipCount: item.bestChipCount || 0,
    worstChipCount: item.worstChipCount || 0,
    currentStreak: item.currentStreak || 0,
    longestWinStreak: item.longestWinStreak || 0,
    longestLoseStreak: item.longestLoseStreak || 0,
    lastPlayed: item.lastPlayed || util.time.nowISO8601(),
    createdAt: item.createdAt || util.time.nowISO8601(),
    updatedAt: item.updatedAt || util.time.nowISO8601(),
  };

  console.log("Player stats fetched successfully");
  return stats;
}
