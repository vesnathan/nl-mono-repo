import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
import { UpdateStatsInput, PlayerStats } from "gqlTypes";

type CTX = Context<{ input: UpdateStatsInput }, object, object, object, PlayerStats>;

export function request(ctx: CTX) {
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  if (!userId) {
    return util.error(
      "Unauthorized: No user ID found",
      "UnauthorizedException",
    );
  }

  const input = ctx.args.input;
  const now = util.time.nowISO8601();

  console.log(`Updating player stats for userId: ${userId}`, JSON.stringify(input));

  // Build update expression dynamically based on what fields are provided
  const updates: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Track hands
  if (input.handsWon !== undefined && input.handsWon > 0) {
    updates.push("#handsWon = if_not_exists(#handsWon, :zero) + :handsWon");
    updates.push("#totalHandsPlayed = if_not_exists(#totalHandsPlayed, :zero) + :handsWon");
    expressionAttributeNames["#handsWon"] = "handsWon";
    expressionAttributeNames["#totalHandsPlayed"] = "totalHandsPlayed";
    expressionAttributeValues[":handsWon"] = input.handsWon;
  }

  if (input.handsLost !== undefined && input.handsLost > 0) {
    updates.push("#handsLost = if_not_exists(#handsLost, :zero) + :handsLost");
    updates.push("#totalHandsPlayed = if_not_exists(#totalHandsPlayed, :zero) + :handsLost");
    expressionAttributeNames["#handsLost"] = "handsLost";
    expressionAttributeNames["#totalHandsPlayed"] = "totalHandsPlayed";
    expressionAttributeValues[":handsLost"] = input.handsLost;
  }

  if (input.handsPushed !== undefined && input.handsPushed > 0) {
    updates.push("#handsPushed = if_not_exists(#handsPushed, :zero) + :handsPushed");
    updates.push("#totalHandsPlayed = if_not_exists(#totalHandsPlayed, :zero) + :handsPushed");
    expressionAttributeNames["#handsPushed"] = "handsPushed";
    expressionAttributeNames["#totalHandsPlayed"] = "totalHandsPlayed";
    expressionAttributeValues[":handsPushed"] = input.handsPushed;
  }

  if (input.blackjacksHit !== undefined && input.blackjacksHit > 0) {
    updates.push("#blackjacksHit = if_not_exists(#blackjacksHit, :zero) + :blackjacksHit");
    expressionAttributeNames["#blackjacksHit"] = "blackjacksHit";
    expressionAttributeValues[":blackjacksHit"] = input.blackjacksHit;
  }

  if (input.wagered !== undefined && input.wagered > 0) {
    updates.push("#totalWagered = if_not_exists(#totalWagered, :zero) + :wagered");
    expressionAttributeNames["#totalWagered"] = "totalWagered";
    expressionAttributeValues[":wagered"] = input.wagered;
  }

  if (input.won !== undefined && input.won > 0) {
    updates.push("#totalWon = if_not_exists(#totalWon, :zero) + :won");
    expressionAttributeNames["#totalWon"] = "totalWon";
    expressionAttributeValues[":won"] = input.won;
  }

  if (input.newChipCount !== undefined) {
    updates.push("#chips = :chips");
    expressionAttributeNames["#chips"] = "chips";
    expressionAttributeValues[":chips"] = input.newChipCount;
  }

  // Always update timestamps
  updates.push("#updatedAt = :updatedAt");
  updates.push("#lastPlayed = :now");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeNames["#lastPlayed"] = "lastPlayed";
  expressionAttributeValues[":updatedAt"] = now;
  expressionAttributeValues[":now"] = now;
  expressionAttributeValues[":zero"] = 0;

  const updateExpression = `SET ${updates.join(", ")}`;

  return {
    operation: "UpdateItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `STATS#CURRENT`,
    }),
    update: {
      expression: updateExpression,
      expressionNames: expressionAttributeNames,
      expressionValues: util.dynamodb.toMapValues(expressionAttributeValues),
    },
  };
}

export function response(ctx: CTX): PlayerStats {
  if (ctx.error) {
    console.error("Error updating player stats:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }

  const item = ctx.result as any;
  const identity = ctx.identity as AppSyncIdentityCognito;
  const userId = identity.sub;

  // Calculate win rate
  const totalHandsPlayed = item.totalHandsPlayed || 0;
  const handsWon = item.handsWon || 0;
  const winRate = totalHandsPlayed > 0 ? handsWon / totalHandsPlayed : 0;

  const stats: PlayerStats = {
    __typename: "PlayerStats",
    userId,
    chips: item.chips || 0,
    totalHandsPlayed,
    handsWon,
    handsLost: item.handsLost || 0,
    handsPushed: item.handsPushed || 0,
    blackjacksHit: item.blackjacksHit || 0,
    totalWagered: item.totalWagered || 0,
    totalWon: item.totalWon || 0,
    winRate,
    bestChipCount: item.bestChipCount || 0,
    worstChipCount: item.worstChipCount || 0,
    currentStreak: item.currentStreak || 0,
    longestWinStreak: item.longestWinStreak || 0,
    longestLoseStreak: item.longestLoseStreak || 0,
    lastPlayed: item.lastPlayed || util.time.nowISO8601(),
    createdAt: item.createdAt || util.time.nowISO8601(),
    updatedAt: item.updatedAt || util.time.nowISO8601(),
  };

  console.log("Player stats updated successfully");
  return stats;
}
