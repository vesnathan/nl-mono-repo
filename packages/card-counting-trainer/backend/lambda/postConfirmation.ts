import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { PostConfirmationTriggerEvent } from "aws-lambda";

const dynamodb = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
});

const TABLE_NAME = process.env.TABLE_NAME;

/**
 * Cognito PostConfirmation Trigger
 * Automatically creates a user record in DynamoDB when a user signs up via OAuth or confirms their account
 */
export const handler = async (
  event: PostConfirmationTriggerEvent,
): Promise<PostConfirmationTriggerEvent> => {
  console.log("PostConfirmation trigger event:", JSON.stringify(event));

  if (!TABLE_NAME) {
    console.error("TABLE_NAME environment variable not set");
    throw new Error("TABLE_NAME environment variable not set");
  }

  const { userPoolId, userName, request } = event;
  const { userAttributes } = request;

  const userId = userAttributes.sub;
  const email = userAttributes.email || "";
  const username = userName; // This could be email or a custom username

  try {
    // Create user record in DynamoDB
    const putCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: { S: `USER#${userId}` },
        SK: { S: `USER#${userId}` },
        email: { S: email },
        username: { S: username },
        chips: { N: "10000" }, // Starting chips
        totalChipsPurchased: { N: "0" },
        earlyAdopter: { BOOL: false },
        createdAt: { S: new Date().toISOString() },
        updatedAt: { S: new Date().toISOString() },
      },
      // Use ConditionExpression to prevent overwriting existing users
      ConditionExpression: "attribute_not_exists(PK)",
    });

    await dynamodb.send(putCommand);
    console.log(`User ${userId} successfully created in DynamoDB`);
  } catch (error: any) {
    // If user already exists, that's okay - just log it
    if (error.name === "ConditionalCheckFailedException") {
      console.log(`User ${userId} already exists in DynamoDB - skipping creation`);
    } else {
      console.error("Error creating user in DynamoDB:", error);
      // Don't throw - we don't want to block user signup if DynamoDB fails
      // The user can still authenticate, and we can create the record later
    }
  }

  // Must return the event for Cognito to continue
  return event;
};
