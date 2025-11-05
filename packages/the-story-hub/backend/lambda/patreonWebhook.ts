/**
 * Patreon Webhook Handler
 *
 * Handles webhook events from Patreon when members:
 * - Create a new membership (members:create)
 * - Update their membership tier (members:update)
 * - Delete their membership (members:delete)
 *
 * This Lambda is triggered by API Gateway endpoint: POST /webhooks/patreon
 *
 * Setup:
 * 1. Configure webhook in Patreon Creator Portal: https://www.patreon.com/portal/registration/register-webhooks
 * 2. Set webhook URL to: https://api.the-story-hub.com/webhooks/patreon
 * 3. Add webhook secret to Secrets Manager: patreon/webhook-secret
 * 4. Subscribe to events: members:create, members:update, members:delete
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import * as crypto from "crypto";
import {
  PATREON_TIER_MAPPING,
  extractPatreonTier,
} from "../constants/PatreonMocks";

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

/**
 * Verify Patreon webhook signature
 * https://docs.patreon.com/#webhooks
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hash = crypto.createHmac("md5", secret).update(payload).digest("hex");
  return hash === signature;
}

/**
 * Extract Patreon user ID from webhook payload
 */
function getPatreonUserId(webhookData: any): string | null {
  return webhookData.data?.relationships?.user?.data?.id || null;
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
 * Find user by Patreon ID in our database
 * In production, you'd store patreonUserId in the User item
 */
async function findUserByPatreonId(
  patreonUserId: string,
): Promise<string | null> {
  // TODO: Implement actual user lookup by patreonUserId
  // For now, return mock userId
  // In real implementation:
  // 1. Query GSI on patreonUserId field
  // 2. Return the userId if found
  console.log(`Looking up user with Patreon ID: ${patreonUserId}`);
  return null; // Return null to skip update in dev
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

  console.log(`Updated Patreon info for user ${userId}:`, patreonData);
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Patreon webhook received:", {
    headers: event.headers,
    bodyLength: event.body?.length,
  });

  try {
    // Get secrets
    const secrets = await getSecrets();

    // Verify webhook signature
    const signature = event.headers["x-patreon-signature"] || "";
    const payload = event.body || "";

    if (!verifyWebhookSignature(payload, signature, secrets.webhookSecret)) {
      console.error("Invalid webhook signature");
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid signature" }),
      };
    }

    const webhookData = JSON.parse(payload);
    const eventType = event.headers["x-patreon-event"] || "";

    console.log(`Processing event: ${eventType}`);

    // Extract Patreon user ID
    const patreonUserId = getPatreonUserId(webhookData);
    if (!patreonUserId) {
      console.error("No Patreon user ID in webhook payload");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing user ID" }),
      };
    }

    // Find our internal user ID
    const userId = await findUserByPatreonId(patreonUserId);
    if (!userId) {
      console.log(`No user found for Patreon ID: ${patreonUserId}`);
      // This is OK - user might not have linked their account yet
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "User not linked" }),
      };
    }

    // Handle different event types
    switch (eventType) {
      case "members:create":
      case "members:update": {
        // Extract tier and patron status
        const member = webhookData.data;
        const patronStatus = member.attributes?.patron_status || "unknown";
        const lifetimeSupportCents =
          member.attributes?.lifetime_support_cents || 0;

        // Get entitled tiers
        const entitledTiers =
          member.relationships?.currently_entitled_tiers?.data || [];
        const tier =
          entitledTiers.length > 0
            ? mapPatreonTierToInternal(entitledTiers[0].id)
            : "NONE";

        await updateUserPatreonInfo(userId, {
          tier,
          patronStatus,
          lifetimeSupportCents,
        });

        console.log(`Updated user ${userId} to tier ${tier}`);
        break;
      }

      case "members:delete": {
        // User canceled their membership
        await updateUserPatreonInfo(userId, {
          tier: "NONE",
          patronStatus: "former_patron",
          lifetimeSupportCents:
            webhookData.data.attributes?.lifetime_support_cents || 0,
        });

        console.log(`User ${userId} canceled Patreon membership`);
        break;
      }

      default:
        console.log(`Unknown event type: ${eventType}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing webhook:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
