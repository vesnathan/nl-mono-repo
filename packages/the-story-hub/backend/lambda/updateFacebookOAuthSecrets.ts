import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  SecretsManagerClient,
  PutSecretValueCommand,
  GetSecretValueCommand,
  ResourceNotFoundException,
} from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const SECRET_ARN = process.env.FACEBOOK_OAUTH_SECRETS_ARN;

if (!SECRET_ARN) {
  throw new Error("FACEBOOK_OAUTH_SECRETS_ARN environment variable is not set");
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Check if user is admin (cognito:groups in access token)
  const groups =
    event.requestContext.authorizer?.jwt?.claims?.["cognito:groups"];
  const isAdmin = groups?.includes("SiteAdmin");

  if (!isAdmin) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Admin access required" }),
    };
  }

  const method = event.requestContext.http.method;

  try {
    if (method === "GET") {
      // GET: Return masked secrets
      try {
        const getCommand = new GetSecretValueCommand({
          SecretId: SECRET_ARN,
        });
        const response = await secretsManager.send(getCommand);

        if (!response.SecretString) {
          return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Secrets not found" }),
          };
        }

        const secrets = JSON.parse(response.SecretString);

        // Mask sensitive values
        const maskedSecrets = {
          clientId: secrets.clientId || "",
          clientSecret: secrets.clientSecret
            ? `****${secrets.clientSecret.slice(-4)}`
            : "",
        };

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(maskedSecrets),
        };
      } catch (error) {
        if (error instanceof ResourceNotFoundException) {
          // Secrets don't exist yet - return empty/placeholder
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: "",
              clientSecret: "",
            }),
          };
        }
        throw error;
      }
    } else if (method === "POST") {
      // POST: Update secrets (supports partial updates)
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Request body is required" }),
        };
      }

      const updates = JSON.parse(event.body);

      if (!updates.clientId && !updates.clientSecret) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "At least one field (clientId or clientSecret) is required",
          }),
        };
      }

      // Get existing secrets to merge with updates
      let existingSecrets = { clientId: "", clientSecret: "" };
      try {
        const getCommand = new GetSecretValueCommand({
          SecretId: SECRET_ARN,
        });
        const response = await secretsManager.send(getCommand);
        if (response.SecretString) {
          existingSecrets = JSON.parse(response.SecretString);
        }
      } catch (error) {
        if (!(error instanceof ResourceNotFoundException)) {
          throw error;
        }
        // Secret doesn't exist yet, will create it below
      }

      // Merge updates with existing values
      const mergedSecrets = {
        clientId: updates.clientId || existingSecrets.clientId,
        clientSecret: updates.clientSecret || existingSecrets.clientSecret,
      };

      // Allow saving partial values (they'll be merged with existing values)
      const secretValue = JSON.stringify(mergedSecrets);

      // Update the secret (CloudFormation already created it)
      const putCommand = new PutSecretValueCommand({
        SecretId: SECRET_ARN,
        SecretString: secretValue,
      });
      await secretsManager.send(putCommand);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Secrets updated successfully" }),
      };
    } else {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }
  } catch (error) {
    console.error("Error handling Facebook OAuth secrets:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
