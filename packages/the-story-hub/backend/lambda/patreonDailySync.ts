/**
 * Patreon Daily Sync Lambda
 *
 * Runs once per day via EventBridge (CloudWatch Events) to sync all Patreon supporters
 * with the Patreon API to ensure our database is up-to-date.
 *
 * This catches cases where:
 * - Webhooks failed or were missed
 * - Payment declined (patron status changed but no webhook sent)
 * - User downgraded/upgraded between webhook deliveries
 *
 * Schedule: Every day at 3 AM UTC
 * EventBridge Rule: cron(0 3 * * ? *)
 *
 * Environment Variables:
 * - DATA_TABLE_NAME: DynamoDB table name
 * - PATREON_CREATOR_ACCESS_TOKEN: Long-lived Patreon API token (from Secrets Manager)
 * - PATREON_CAMPAIGN_ID: Your Patreon campaign ID
 */

import { EventBridgeHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { PATREON_TIER_MAPPING } from "../constants/PatreonMocks";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const secretsClient = new SecretsManagerClient({});

const TABLE_NAME = process.env.DATA_TABLE_NAME!;
const SECRETS_ARN = process.env.PATREON_SECRETS_ARN;
const USE_MOCK_DATA = process.env.USE_MOCK_PATREON_DATA === "true";

// Cache secrets for Lambda warm starts
let cachedSecrets: {
  webhookSecret: string;
  campaignId: string;
  creatorAccessToken: string;
} | null = null;

/**
 * Get Patreon secrets from Secrets Manager or use mock data
 */
async function getSecrets() {
  if (cachedSecrets) return cachedSecrets;

  if (USE_MOCK_DATA || !SECRETS_ARN) {
    console.log("Using mock Patreon secrets");
    cachedSecrets = {
      webhookSecret: "mock-secret",
      campaignId: "12345",
      creatorAccessToken: "mock-token",
    };
    return cachedSecrets;
  }

  try {
    const response = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: SECRETS_ARN }),
    );

    if (!response.SecretString) {
      throw new Error("Secret value is empty");
    }

    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets!;
  } catch (error) {
    console.error("Error fetching secrets:", error);
    throw error;
  }
}

interface PatreonMember {
  patreonUserId: string;
  tier: string;
  patronStatus: string;
  lifetimeSupportCents: number;
}

/**
 * Fetch all members from Patreon API
 * https://docs.patreon.com/#get-api-oauth2-v2-campaigns-campaign_id-members
 */
async function fetchPatreonMembers(secrets: {
  creatorAccessToken: string;
  campaignId: string;
}): Promise<PatreonMember[]> {
  if (USE_MOCK_DATA) {
    console.log("Using mock Patreon data");
    return [
      {
        patreonUserId: "12345678",
        tier: "GOLD",
        patronStatus: "active_patron",
        lifetimeSupportCents: 15000,
      },
      {
        patreonUserId: "87654321",
        tier: "SILVER",
        patronStatus: "active_patron",
        lifetimeSupportCents: 2500,
      },
    ];
  }

  const members: PatreonMember[] = [];
  let nextPageUrl: string | null =
    `https://www.patreon.com/api/oauth2/v2/campaigns/${secrets.campaignId}/members?include=currently_entitled_tiers&fields%5Bmember%5D=patron_status,lifetime_support_cents,currently_entitled_amount_cents&fields%5Btier%5D=title`;

  while (nextPageUrl) {
    const response = await fetch(nextPageUrl, {
      headers: {
        Authorization: `Bearer ${secrets.creatorAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Patreon API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Process members from this page
    for (const member of data.data || []) {
      const patreonUserId = member.relationships?.user?.data?.id;
      const patronStatus = member.attributes?.patron_status;
      const lifetimeSupportCents =
        member.attributes?.lifetime_support_cents || 0;

      // Get entitled tiers
      const entitledTiers =
        member.relationships?.currently_entitled_tiers?.data || [];
      const tier =
        entitledTiers.length > 0
          ? mapPatreonTierToInternal(entitledTiers[0].id)
          : "NONE";

      if (patreonUserId) {
        members.push({
          patreonUserId,
          tier,
          patronStatus,
          lifetimeSupportCents,
        });
      }
    }

    // Check for next page
    nextPageUrl = data.links?.next || null;
  }

  console.log(`Fetched ${members.length} members from Patreon`);
  return members;
}

/**
 * Get our internal tier enum from Patreon tier ID
 */
function mapPatreonTierToInternal(patreonTierId: string): string {
  return (
    PATREON_TIER_MAPPING[patreonTierId as keyof typeof PATREON_TIER_MAPPING] ||
    "NONE"
  );
}

/**
 * Get all users who have linked their Patreon account
 */
async function getUsersWithPatreon(): Promise<
  Array<{ userId: string; patreonUserId: string }>
> {
  // TODO: Use GSI to query users with patreonUserId attribute
  // For now, scan (not efficient for production!)
  const result = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "attribute_exists(patreonUserId)",
      ProjectionExpression: "userId, patreonUserId",
    }),
  );

  return (result.Items || []) as Array<{
    userId: string;
    patreonUserId: string;
  }>;
}

/**
 * Update user's Patreon info in DynamoDB
 */
async function updateUserPatreonInfo(
  userId: string,
  patreonData: {
    tier: string;
    patronStatus: string;
    lifetimeSupportCents: number;
  },
) {
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `USER#${userId}`,
      },
      UpdateExpression:
        "SET patreonInfo = :patreonInfo, patreonSupporter = :isSupporter, updatedAt = :now",
      ExpressionAttributeValues: {
        ":patreonInfo": {
          tier: patreonData.tier,
          patronStatus: patreonData.patronStatus,
          lifetimeSupportCents: patreonData.lifetimeSupportCents,
          lastRefreshedAt: now,
        },
        ":isSupporter": patreonData.tier !== "NONE",
        ":now": now,
      },
    }),
  );
}

export const handler: EventBridgeHandler<"Scheduled Event", any, void> = async (
  event,
) => {
  console.log("Starting Patreon daily sync", { time: event.time });

  try {
    // Get secrets
    const secrets = await getSecrets();

    // Fetch current Patreon members
    const patreonMembers = await fetchPatreonMembers(secrets);
    const patreonMemberMap = new Map(
      patreonMembers.map((m) => [m.patreonUserId, m]),
    );

    // Get all our users with linked Patreon accounts
    const usersWithPatreon = await getUsersWithPatreon();

    console.log(
      `Syncing ${usersWithPatreon.length} users with ${patreonMembers.length} Patreon members`,
    );

    let updatedCount = 0;
    let removedCount = 0;

    // Update each user
    for (const user of usersWithPatreon) {
      const patreonData = patreonMemberMap.get(user.patreonUserId);

      if (patreonData) {
        // User is still a patron - update their info
        await updateUserPatreonInfo(user.userId, {
          tier: patreonData.tier,
          patronStatus: patreonData.patronStatus,
          lifetimeSupportCents: patreonData.lifetimeSupportCents,
        });
        updatedCount++;
      } else {
        // User is no longer a patron - remove their tier
        await updateUserPatreonInfo(user.userId, {
          tier: "NONE",
          patronStatus: "former_patron",
          lifetimeSupportCents: 0,
        });
        removedCount++;
      }
    }

    console.log(
      `Sync complete: ${updatedCount} updated, ${removedCount} removed`,
    );
  } catch (error) {
    console.error("Error during Patreon sync:", error);
    throw error; // Let Lambda retry
  }
};
