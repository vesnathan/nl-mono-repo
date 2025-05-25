import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { AppSyncIdentityCognito, AppSyncResolverEvent } from "aws-lambda";
import { getProcessEnv } from "../../getProcessEnv";

export async function handler(event: AppSyncResolverEvent<any>) {
  const { cwlUserTableArn } = getProcessEnv();
  if (!cwlUserTableArn) {
    throw new Error("Missing required environment variable: cwlUserTableArn. - addUserToGroup");
  }

  const addedBy = (event.identity as AppSyncIdentityCognito).sub;

  console.log("Logged-in user's UUID:", addedBy);
  
  const input = JSON.parse(event.prev?.result.body);
  console.log("input - createCWLUser", input);
  const {
    userEmail,
    userId,
    userTitle,
    userFirstName,
    userLastName,
    userPhone,
    userRole,
    organizationId,
  } = input.input;

  if (!userId || !userEmail) {
    throw new Error("Missing required user details. - createCWLUser");
  }

  const client = new DynamoDBClient({});

  const item: any = {
    userEmail: { S: userEmail },
    userTitle: { S: userTitle },
    userFirstName: { S: userFirstName },
    userLastName: { S: userLastName },
    userPhone: { S: userPhone },
    userRole: { S: userRole },
    organizationId: { S: organizationId },

    createdAt: { S: new Date().toISOString() },
    userAddedById: { S: addedBy },
    privacyPolicy: { BOOL: false },
    termsAndConditions: { BOOL: false },
  };

  const params = new PutItemCommand({
    TableName: cwlUserTableArn,
    Item: item,
  });

  try {
    await client.send(params);
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "User record created successfully in DynamoDB.",
      }),
    };
  } catch (error) {
    console.error("Error saving user to database: - createCWLUser", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error. - createCWLUser" }),
    };
  }
}
