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

import { APIGatewayProxyHandler } from "aws-lambda";
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
 */
function isAdmin(event: any): boolean {
  const claims = event.requestContext?.authorizer?.claims;
  if (!claims) return false;

  // Check if user has SiteAdmin in their custom:clientType claim
  const clientType = claims["custom:clientType"];
  return clientType?.includes("SiteAdmin") ?? false;
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
    clientId: secrets.clientId
      ? `${secrets.clientId.substring(0, 8)}...`
      : "",
    clientSecret: secrets.clientSecret
      ? `${secrets.clientSecret.substring(0, 8)}...`
      : "",
  };
}

export const handler: APIGatewayProxyHandler = async (event) => {
  console.log("Patreon secrets update request:", {
    method: event.httpMethod,
    path: event.path,
  });

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
    if (event.httpMethod === "GET") {
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
    if (event.httpMethod === "POST") {
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
