import { util, Context, AppSyncIdentityCognito } from "@aws-appsync/utils";
// 'gqlTypes' is a module alias mapped in tsconfig.json to ../frontend/src/types/gqlTypes.ts
// This allows the resolver compiler to resolve GraphQL generated types during build
import { AWSEUserInput, AWSEUser } from "gqlTypes";

// Define Input type for the resolver
type CreateAWSEUserMutationVariables = {
  input: AWSEUserInput;
};

// Define Output type for the resolver - it's AWSEUser as per schema
type Output = AWSEUser;

// Define CTX for the response function context
type CTX = Context<
  CreateAWSEUserMutationVariables,
  object,
  object,
  object,
  Output
>;

export function request(ctx: Context<CreateAWSEUserMutationVariables>) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Only SuperAdmins can create new users
  if (!identity.groups?.includes("SuperAdmin")) {
    util.error(
      "Unauthorized: Only SuperAdmins can create users.",
      "Unauthorized",
    );
  }

  // Get the Cognito sub from the previous pipeline function (CreateCognitoUserFunction)
  const cognitoSub = ctx.prev.result.cognitoSub;
  const userCreated = ctx.prev.result.userCreated;

  if (!cognitoSub) {
    util.error("Failed to get Cognito sub from previous step", "InternalError");
  }

  // Extract sendWelcomeEmail and remove it from the item (it's not stored in DB)
  const { sendWelcomeEmail, ...userInputWithoutEmail } = input;

  // Store sendWelcomeEmail in stash for the pipeline resolver to use
  ctx.stash.sendWelcomeEmail = sendWelcomeEmail || false;
  ctx.stash.input = input;

  const newUserItem = {
    userId: cognitoSub, // DynamoDB table uses 'userId' as primary key (Cognito sub)
    ...userInputWithoutEmail,
    userAddedById: identity.username, // The SuperAdmin creating this user
    userCreated: userCreated,
    privacyPolicy: false, // Default value, can be updated by user later
    termsAndConditions: false, // Default value, can be updated by user later
    userProfilePicture: {
      Bucket: "",
      Key: "",
    }, // Default empty S3 object
  };

  return {
    operation: "PutItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${cognitoSub}`,
      SK: `PROFILE#${cognitoSub}`,
    }),
    attributeValues: util.dynamodb.toMapValues({
      PK: `USER#${cognitoSub}`,
      SK: `PROFILE#${cognitoSub}`,
      ...newUserItem,
    }),
    condition: {
      expression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
    },
  };
}

export function response(ctx: CTX): Output {
  if (ctx.error) {
    console.error("Error in resolver:", ctx.error);
    // Handle specific DynamoDB errors if necessary, e.g., ConditionalCheckFailedException
    if (ctx.error.type === "DynamoDB:ConditionalCheckFailedException") {
      util.error(
        "A user with this ID already exists.",
        "ConditionalCheckFailedException",
      );
    }
    return util.error(ctx.error.message, ctx.error.type);
  }
  console.log("User creation successful, result:", JSON.stringify(ctx.result));
  // The result of PutItem is the item itself if successful and no error occurred.
  // However, AppSync typically returns the `attributeValues` passed in the request for PutItem.
  // We need to construct the AWSEUser object that matches the GraphQL schema.

  // The ctx.result from a PutItem operation is usually the item that was put.
  // If you used `returnValues: 'ALL_OLD'` or similar, it might be different.
  // Assuming ctx.result directly contains the newly created user's attributes.
  const createdUser = ctx.result as any;

  // The clientType will be populated by Query.getAWSEUser based on Cognito groups
  // For the mutation response, return an empty array
  return {
    __typename: "AWSEUser",
    userId: createdUser.userId,
    userEmail: createdUser.userEmail,
    userTitle: createdUser.userTitle,
    userFirstName: createdUser.userFirstName,
    userLastName: createdUser.userLastName,
    userPhone: createdUser.userPhone,
    privacyPolicy: createdUser.privacyPolicy,
    termsAndConditions: createdUser.termsAndConditions,
    userAddedById: createdUser.userAddedById,
    userCreated: createdUser.userCreated,
    clientType: [],
    userProfilePicture: createdUser.userProfilePicture || {
      Bucket: "",
      Key: "",
    },
  };
}
