import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
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
  const givenName = userAttributes.given_name || "";
  const familyName = userAttributes.family_name || "";

  // Generate a screen name from the email (user can change this later)
  const screenName = email.split("@")[0];

  const now = new Date().toISOString();

  try {
    // Create user profile in DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `PROFILE#${userId}`,
          userId,
          userEmail: email,
          userTitle: "",
          userFirstName: givenName,
          userLastName: familyName,
          userScreenName: screenName,
          userPhone: "",
          privacyPolicy: true,
          termsAndConditions: true,
          userAddedById: "cognito-post-confirmation",
          userCreated: now,
          patreonSupporter: false,
          ogSupporter: false,
          GSI1PK: `USER#${userId}`,
          GSI1SK: `USER#${userId}`,
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
