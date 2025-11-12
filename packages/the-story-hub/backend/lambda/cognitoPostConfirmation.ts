import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { PostConfirmationTriggerEvent } from "aws-lambda";

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Cognito Post-Confirmation Trigger
 *
 * This Lambda is triggered after a user confirms their account (via email confirmation)
 * or after an admin creates a user. It creates the user's profile in DynamoDB.
 *
 * IMPORTANT: If this function fails, the user will still be created in Cognito,
 * but won't have a DynamoDB profile. The GraphQL queries will fail with null errors.
 */
export const handler = async (
  event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
  console.log("Post-confirmation trigger event:", JSON.stringify(event));

  if (!TABLE_NAME) {
    console.error("TABLE_NAME environment variable not set");
    throw new Error("TABLE_NAME environment variable not set");
  }

  const { userAttributes, userName } = event.request;

  // Extract user details from Cognito attributes
  const userId = userAttributes.sub; // Cognito sub is the unique user ID
  const email = userAttributes.email;

  // For OAuth sign-ins (Google, etc.), use the 'name' attribute if available
  // Otherwise fall back to given_name/family_name or generate from email
  let username: string;
  if (userAttributes.name) {
    // OAuth providers like Google provide a 'name' attribute
    username = userAttributes.name;
    console.log(`Using Google name attribute for username: ${username}`);
  } else if (userAttributes.given_name || userAttributes.family_name) {
    // Email/password signups might have given_name/family_name
    username =
      `${userAttributes.given_name || ""} ${userAttributes.family_name || ""}`.trim();
    console.log(`Using given/family name for username: ${username}`);
  } else {
    // Fallback: generate from email
    username = email.split("@")[0];
    console.log(`Using email prefix for username: ${username}`);
  }

  console.log(`Final username to be stored: "${username}"`);

  const now = new Date().toISOString();

  try {
    // Check if username already exists using GSI2
    const existingUserCheck = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI2",
        KeyConditionExpression: "GSI2PK = :usernamePK",
        ExpressionAttributeValues: {
          ":usernamePK": `USERNAME#${username}`,
        },
        ProjectionExpression: "username, userId",
        Limit: 1,
      }),
    );

    if (existingUserCheck.Items && existingUserCheck.Items.length > 0) {
      const existingUserId = existingUserCheck.Items[0].userId;
      // If it's not the same user (shouldn't happen, but safety check)
      if (existingUserId !== userId) {
        console.error(
          `Username "${username}" already exists for user ${existingUserId}`,
        );
        throw new Error(
          `Username "${username}" is already taken. Please choose a different username.`,
        );
      }
    }

    // Create user profile in DynamoDB with GraphQL-compatible field names
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `PROFILE#${userId}`,
          userId,
          username, // GraphQL field
          email, // GraphQL field
          createdAt: now, // GraphQL field
          stats: {
            // GraphQL field
            storiesCreated: 0,
            branchesContributed: 0,
            totalUpvotes: 0,
          },
          patreonSupporter: false,
          ogSupporter: false,
          // Legacy fields for backward compatibility
          userEmail: email,
          userTitle: "",
          userFirstName: userAttributes.given_name || "",
          userLastName: userAttributes.family_name || "",
          userScreenName: username,
          userPhone: "",
          privacyPolicy: true,
          termsAndConditions: true,
          userAddedById: "cognito-post-confirmation",
          userCreated: now,
          GSI1PK: `USER#${userId}`,
          GSI1SK: `USER#${userId}`,
          GSI2PK: `USERNAME#${username}`,
          GSI2SK: `USER#`,
        },
        // Don't overwrite if user already exists (safety check)
        ConditionExpression: "attribute_not_exists(PK)",
      }),
    );

    console.log(`Successfully created user profile for ${email} (${userId})`);
  } catch (error: any) {
    // If user already exists, that's fine - just log and continue
    if (error.name === "ConditionalCheckFailedException") {
      console.log(
        `User profile already exists for ${email} (${userId}) - skipping creation`,
      );
    } else {
      console.error("Error creating user profile:", error);
      // Re-throw to fail the Lambda and prevent user confirmation
      throw error;
    }
  }

  // Return the event to Cognito to continue the confirmation flow
  return event;
};
