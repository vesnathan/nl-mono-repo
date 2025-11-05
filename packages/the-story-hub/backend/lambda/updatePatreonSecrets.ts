/**
 * Update Patreon Secrets Lambda
 *
 * Admin-only Lambda that updates Patreon API credentials in AWS Secrets Manager.
 * This Lambda is invoked via API Gateway and requires admin authentication.
 *
 * Endpoints:
 * - POST /admin/patreon/secrets - Update Patreon secrets in Secrets Manager
 * - GET /admin/patreon/secrets - Retrieve current Patreon secrets (masked)
 *
 * Security:
 * - All values are encrypted in transit (HTTPS)
 * - Secrets Manager encrypts at rest using AWS KMS
 * - Admin-only access via Cognito authorization
 */

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({});

const SECRETS_ARN = process.env.PATREON_SECRETS_ARN!;

interface PatreonSecrets {
  creatorAccessToken: string;
  webhookSecret: string;
  campaignId: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Validate that the user is an admin by checking Cognito claims
 * API Gateway V2 HTTP API format: requestContext.authorizer.jwt.claims
 */
function isAdmin(event: any): boolean {
  console.log(
    "Authorization check - full event:",
    JSON.stringify(event, null, 2),
  );

  const claims = event.requestContext?.authorizer?.jwt?.claims;
  console.log("JWT claims:", JSON.stringify(claims, null, 2));

  if (!claims) {
    console.log(
      "No claims found in event.requestContext.authorizer.jwt.claims",
    );
    return false;
  }

  // Check if user has SiteAdmin in their cognito:groups claim
  const groups = claims["cognito:groups"];
  console.log("cognito:groups value:", groups, "type:", typeof groups);
  console.log("cognito:groups JSON:", JSON.stringify(groups));
  console.log(
    "cognito:groups charCodeAt(0):",
    groups?.toString().charCodeAt(0),
  );

  if (typeof groups === "string") {
    // API Gateway JWT authorizer passes groups as a JSON string like "[SiteAdmin]"
    // But it might also pass as actual array or comma-separated
    // Try to parse as JSON first
    try {
      const parsedGroups = JSON.parse(groups);
      console.log("JSON.parse succeeded, result:", parsedGroups);
      if (Array.isArray(parsedGroups)) {
        const hasAdmin = parsedGroups.includes("SiteAdmin");
        console.log("Parsed array groups check - hasAdmin:", hasAdmin);
        return hasAdmin;
      }
    } catch (e: any) {
      console.log("JSON.parse failed with error:", e.message);
      console.log("Trying alternative parsing strategies...");

      // Try removing brackets and splitting
      const cleanedGroups = groups.replace(/[\[\]]/g, "");
      const hasAdmin = cleanedGroups
        .split(",")
        .map((g) => g.trim())
        .includes("SiteAdmin");
      console.log("Cleaned groups check - hasAdmin:", hasAdmin);
      return hasAdmin;
    }
  }
  if (Array.isArray(groups)) {
    const hasAdmin = groups.includes("SiteAdmin");
    console.log("Array groups check - hasAdmin:", hasAdmin);
    return hasAdmin;
  }

  console.log("Groups not found or invalid format");
  return false;
}

/**
 * Mask sensitive fields for GET responses
 */
function maskSecrets(secrets: PatreonSecrets): Record<string, string> {
  return {
    creatorAccessToken: secrets.creatorAccessToken
      ? `${secrets.creatorAccessToken.substring(0, 8)}...`
      : "",
    webhookSecret: secrets.webhookSecret
      ? `${secrets.webhookSecret.substring(0, 8)}...`
      : "",
    campaignId: secrets.campaignId || "",
    clientId: secrets.clientId ? `${secrets.clientId.substring(0, 8)}...` : "",
    clientSecret: secrets.clientSecret
      ? `${secrets.clientSecret.substring(0, 8)}...`
      : "",
  };
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // API Gateway V2 HTTP API uses requestContext.http.method and rawPath
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  console.log("Patreon secrets update request:", { method, path });

  try {
    // Check admin authorization
    if (!isAdmin(event)) {
      return {
        statusCode: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Admin access required" }),
      };
    }

    // GET: Retrieve current secrets (masked)
    if (method === "GET") {
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: SECRETS_ARN }),
      );

      if (!response.SecretString) {
        throw new Error("Secret value is empty");
      }

      const secrets: PatreonSecrets = JSON.parse(response.SecretString);
      const maskedSecrets = maskSecrets(secrets);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(maskedSecrets),
      };
    }

    // POST: Update secrets
    if (method === "POST") {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ error: "Request body required" }),
        };
      }

      const updates: Partial<PatreonSecrets> = JSON.parse(event.body);

      // Validate that at least one field is provided
      if (Object.keys(updates).length === 0) {
        return {
          statusCode: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({ error: "At least one field required" }),
        };
      }

      // Get current secrets
      const getResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: SECRETS_ARN }),
      );

      if (!getResponse.SecretString) {
        throw new Error("Secret value is empty");
      }

      const currentSecrets: PatreonSecrets = JSON.parse(
        getResponse.SecretString,
      );

      // Merge updates with current secrets
      const newSecrets: PatreonSecrets = {
        ...currentSecrets,
        ...updates,
      };

      // Update Secrets Manager
      await secretsClient.send(
        new PutSecretValueCommand({
          SecretId: SECRETS_ARN,
          SecretString: JSON.stringify(newSecrets),
        }),
      );

      console.log("Patreon secrets updated successfully");

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          success: true,
          message: "Patreon secrets updated successfully",
        }),
      };
    }

    // Unsupported method
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Error updating Patreon secrets:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
