import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || "";

/**
 * Facebook Data Deletion Callback
 *
 * This endpoint handles data deletion requests initiated from Facebook.
 * When a user deletes your app from their Facebook settings, Facebook calls this URL.
 *
 * Required by Facebook for apps using Facebook Login.
 * See: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const method = event.requestContext.http.method;

    // Handle GET requests (Facebook validation)
    if (method === "GET") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: "Data deletion callback endpoint is ready",
      };
    }

    // Handle POST requests (actual deletion requests)
    if (method !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Facebook sends the signed_request parameter
    const body = event.body ? JSON.parse(event.body) : {};
    const signedRequest = body.signed_request;

    if (!signedRequest) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing signed_request parameter" }),
      };
    }

    // Parse the signed request (format: signature.payload)
    const [signature, payload] = signedRequest.split(".");
    const decodedPayload = Buffer.from(payload, "base64").toString("utf-8");
    const data = JSON.parse(decodedPayload);

    const facebookUserId = data.user_id;

    if (!facebookUserId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing user_id in signed_request" }),
      };
    }

    // Find the user by Facebook ID
    // Query GSI to find user with this Facebook ID
    const queryResult = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :pk",
        FilterExpression: "contains(facebookId, :fbId)",
        ExpressionAttributeValues: {
          ":pk": "USER",
          ":fbId": facebookUserId,
        },
      })
    );

    // Log the deletion request
    const confirmationCode = `fb-del-${facebookUserId}-${Date.now()}`;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `DELETION_REQUEST#${confirmationCode}`,
          SK: "METADATA",
          confirmationCode,
          facebookUserId,
          userId: queryResult.Items?.[0]?.userId || "UNKNOWN",
          requestedAt: new Date().toISOString(),
          source: "facebook",
          status: "pending",
        },
      })
    );

    // Return confirmation to Facebook
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `https://${event.requestContext.domainName}/data-deletion/status?id=${confirmationCode}`,
        confirmation_code: confirmationCode,
      }),
    };
  } catch (error) {
    console.error("Error handling Facebook data deletion request:", error);
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
