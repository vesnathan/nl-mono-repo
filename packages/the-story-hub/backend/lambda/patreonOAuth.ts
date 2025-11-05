/**
 * Patreon OAuth Handler
 *
 * Handles OAuth 2.0 flow for linking Patreon accounts to user accounts.
 *
 * Endpoints:
 * - GET /auth/patreon - Initiates OAuth flow, redirects to Patreon
 * - GET /auth/patreon/callback - Handles callback from Patreon, exchanges code for token
 *
 * Flow:
 * 1. User clicks "Connect Patreon" in frontend
 * 2. Frontend calls /auth/patreon with userId in query param
 * 3. Lambda redirects to Patreon OAuth page
 * 4. User authorizes on Patreon
 * 5. Patreon redirects back to /auth/patreon/callback with code
 * 6. Lambda exchanges code for access token
 * 7. Lambda fetches user's Patreon identity
 * 8. Lambda updates DynamoDB with patreonUserId and tier info
 * 9. Lambda redirects back to frontend with success/error
 */

import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { extractPatreonTier } from "../constants/PatreonMocks";

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const secretsClient = new SecretsManagerClient({});

const TABLE_NAME = process.env.DATA_TABLE_NAME!;
const SECRETS_ARN = process.env.PATREON_SECRETS_ARN;
const USE_MOCK_DATA = process.env.USE_MOCK_PATREON_DATA === "true";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const OAUTH_CALLBACK_URL =
  process.env.PATREON_OAUTH_CALLBACK_URL ||
  "https://api.the-story-hub.com/auth/patreon/callback";

// Cache secrets for Lambda warm starts
let cachedSecrets: {
  webhookSecret: string;
  campaignId: string;
  creatorAccessToken: string;
  clientId?: string;
  clientSecret?: string;
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
      clientId: "mock-client-id",
      clientSecret: "mock-client-secret",
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
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch("https://www.patreon.com/api/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: OAUTH_CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user's Patreon identity and membership info
 */
async function fetchPatreonIdentity(accessToken: string) {
  const response = await fetch(
    "https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.currently_entitled_tiers&fields[member]=patron_status,lifetime_support_cents,currently_entitled_amount_cents&fields[tier]=title",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Patreon identity: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update user's Patreon info in DynamoDB
 */
async function linkPatreonToUser(
  userId: string,
  patreonData: {
    patreonUserId: string;
    tier: string;
    patronStatus: string;
    lifetimeSupportCents: number;
    patreonCreatorUrl?: string;
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
        "SET patreonUserId = :patreonUserId, patreonInfo = :patreonInfo, patreonSupporter = :isSupporter, patreonCreatorUrl = :creatorUrl, updatedAt = :now",
      ExpressionAttributeValues: {
        ":patreonUserId": patreonData.patreonUserId,
        ":patreonInfo": {
          tier: patreonData.tier,
          patronStatus: patreonData.patronStatus,
          lifetimeSupportCents: patreonData.lifetimeSupportCents,
          lastRefreshedAt: now,
        },
        ":isSupporter": patreonData.tier !== "NONE",
        ":creatorUrl": patreonData.patreonCreatorUrl || null,
        ":now": now,
      },
    }),
  );

  console.log(`Linked Patreon account for user ${userId}:`, {
    patreonUserId: patreonData.patreonUserId,
    tier: patreonData.tier,
  });
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Patreon OAuth request:", {
    path: event.path,
    method: event.httpMethod,
  });

  const secrets = await getSecrets();

  try {
    // Handle mock data flow
    if (USE_MOCK_DATA) {
      console.log("Using mock OAuth flow");
      const userId = event.queryStringParameters?.userId || "mock-user-123";

      // Simulate successful OAuth
      await linkPatreonToUser(userId, {
        patreonUserId: "mock-patreon-12345",
        tier: "GOLD",
        patronStatus: "active_patron",
        lifetimeSupportCents: 15000,
        patreonCreatorUrl: "https://patreon.com/mock-creator",
      });

      return {
        statusCode: 302,
        headers: {
          Location: `${FRONTEND_URL}/settings?patreon=success`,
        },
        body: "",
      };
    }

    // Route 1: Initiate OAuth flow - redirect to Patreon
    if (event.path === "/auth/patreon" && event.httpMethod === "GET") {
      const userId = event.queryStringParameters?.userId;

      if (!userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Missing userId parameter" }),
        };
      }

      // Build Patreon authorization URL
      const authUrl = new URL("https://www.patreon.com/oauth2/authorize");
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("client_id", secrets.clientId!);
      authUrl.searchParams.set("redirect_uri", OAUTH_CALLBACK_URL);
      authUrl.searchParams.set(
        "scope",
        "identity identity[email] identity.memberships",
      );
      authUrl.searchParams.set("state", userId); // Pass userId as state for callback

      console.log("Redirecting to Patreon OAuth:", authUrl.toString());

      return {
        statusCode: 302,
        headers: {
          Location: authUrl.toString(),
        },
        body: "",
      };
    }

    // Route 2: Handle OAuth callback from Patreon
    if (event.path === "/auth/patreon/callback" && event.httpMethod === "GET") {
      const code = event.queryStringParameters?.code;
      const userId = event.queryStringParameters?.state; // userId from initial request

      if (!code || !userId) {
        console.error("Missing code or state in callback");
        return {
          statusCode: 302,
          headers: {
            Location: `${FRONTEND_URL}/settings?patreon=error&message=missing_params`,
          },
          body: "",
        };
      }

      // Exchange code for access token
      const tokenData = await exchangeCodeForToken(
        code,
        secrets.clientId!,
        secrets.clientSecret!,
      );

      // Fetch user's Patreon identity and membership
      const identityData = await fetchPatreonIdentity(tokenData.access_token);

      // Extract Patreon user ID
      const patreonUserId = identityData.data.id;

      // Extract tier from memberships
      const tier = extractPatreonTier(identityData);

      // Extract patron status
      const memberships = identityData.included?.filter(
        (item: any) => item.type === "member",
      );
      const membership = memberships?.[0];
      const patronStatus =
        membership?.attributes?.patron_status || "former_patron";
      const lifetimeSupportCents =
        membership?.attributes?.lifetime_support_cents || 0;

      // Get Patreon creator URL from user data (if they're a creator)
      const patreonCreatorUrl = identityData.data.attributes?.url || null;

      // Link Patreon account to user
      await linkPatreonToUser(userId, {
        patreonUserId,
        tier,
        patronStatus,
        lifetimeSupportCents,
        patreonCreatorUrl,
      });

      // Redirect back to frontend with success
      return {
        statusCode: 302,
        headers: {
          Location: `${FRONTEND_URL}/settings?patreon=success&tier=${tier}`,
        },
        body: "",
      };
    }

    // Unknown route
    return {
      statusCode: 404,
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("Error in OAuth flow:", error);
    return {
      statusCode: 302,
      headers: {
        Location: `${FRONTEND_URL}/settings?patreon=error&message=${encodeURIComponent(String(error))}`,
      },
      body: "",
    };
  }
};
