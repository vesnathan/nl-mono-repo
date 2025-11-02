/**
 * Shared utility functions for fetching user badge fields
 * (patreonSupporter and ogSupporter) from user profiles
 */

export interface UserBadgeFields {
  patreonSupporter: boolean;
  ogSupporter: boolean;
}

/**
 * Returns a DynamoDB GetItem request to fetch user badge fields
 * @param userId The user ID to fetch badges for
 */
export function getUserBadgeFieldsRequest(userId: string) {
  return {
    operation: "GetItem" as const,
    key: {
      PK: { S: `USER#${userId}` },
      SK: { S: `PROFILE#${userId}` },
    },
    projection: "patreonSupporter, ogSupporter",
  };
}

/**
 * Extracts badge fields from a user profile item
 * @param userItem The DynamoDB user profile item
 * @returns Badge fields with defaults
 */
export function extractUserBadgeFields(userItem: any): UserBadgeFields {
  return {
    patreonSupporter: userItem?.patreonSupporter ?? false,
    ogSupporter: userItem?.ogSupporter ?? false,
  };
}

/**
 * Creates a BatchGetItem request for multiple user IDs
 * Useful for list queries that need badges for multiple authors
 * @param userIds Array of user IDs to fetch
 * @param tableName The DynamoDB table name
 */
export function batchGetUserBadgeFieldsRequest(userIds: string[], tableName: string) {
  const keys = userIds.map((userId) => ({
    PK: { S: `USER#${userId}` },
    SK: { S: `PROFILE#${userId}` },
  }));

  return {
    operation: "BatchGetItem" as const,
    tables: {
      [tableName]: {
        keys,
        projection: "userId, patreonSupporter, ogSupporter",
      },
    },
  };
}

/**
 * Processes BatchGetItem response to create a userId -> badge fields map
 * @param batchResult The BatchGetItem result
 * @param tableName The table name used in the batch request
 */
export function processBatchUserBadges(
  batchResult: any,
  tableName: string
): Record<string, UserBadgeFields> {
  const userBadges: Record<string, UserBadgeFields> = {};

  const items = batchResult?.data?.[tableName] || [];

  for (const item of items) {
    if (item.userId) {
      userBadges[item.userId] = {
        patreonSupporter: item.patreonSupporter ?? false,
        ogSupporter: item.ogSupporter ?? false,
      };
    }
  }

  return userBadges;
}
