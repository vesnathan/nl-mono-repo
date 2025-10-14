import { util, AppSyncIdentityCognito, Context } from "@aws-appsync/utils";
// 'gqlTypes' is a module alias mapped in tsconfig.json to ../frontend/src/types/gqlTypes.ts
// This allows the resolver compiler to resolve GraphQL generated types during build
import { User, ClientType, GetUserQueryVariables } from "gqlTypes";
// Import ClientTypes constants from the single source of truth
import {
  CLIENT_TYPES,
  isValidClientType,
} from "../../../constants/ClientTypes";

// Use GetUserQueryVariables from shared frontend-generated types

// Define Output type for the resolver - it's UserType as per schema for a successful response
type Output = User;

// Define CTX for the response function context
// Args, Result, PrevResult, Source, Info
type CTX = Context<GetUserQueryVariables, object, object, object, Output>;

export function request(ctx: Context<GetUserQueryVariables>) {
  // It's good practice to cast args to the specific type
  const args = ctx.args as GetUserQueryVariables;
  const { userId } = args;

  if (!userId) {
    // If userId is essential and missing, throw an error.
    // AppSync typically validates non-nullable args based on the GraphQL schema.
    // This explicit check can be a safeguard or for more complex validation.
    return util.error(
      "User ID is missing in the request.",
      "ValidationException",
    );
  }

  const identity = ctx.identity as AppSyncIdentityCognito;
  if (identity.username !== userId) {
    return util.error(
      "User is not allowed to retrieve data of a different user",
      "Unauthorized",
    );
  }

  console.log(`Getting user data for userId: ${userId}`);
  console.log(`Identity username: ${identity.username}`);
  // DynamoDB DataTable uses a single-table PK/SK schema.
  // Use PK = USER#<userId> and SK = PROFILE#<userId> when querying.
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({
      PK: `USER#${userId}`,
      SK: `PROFILE#${userId}`,
    }),
  };
}

export function response(ctx: CTX): Output {
  console.log("Response result:", JSON.stringify(ctx.result));

  if (ctx.error) {
    console.error("Error in resolver:", ctx.error);
    // Make sure to return or throw, not just log, if you want to stop execution.
    // util.error will throw, which is appropriate here.
    return util.error(ctx.error.message, ctx.error.type);
  }

  const identity = ctx.identity as AppSyncIdentityCognito;
  // Retrieve args safely, it's good practice to cast or ensure it's the correct type.
  const args = ctx.args as GetUserQueryVariables;
  const { userId } = args;

  // Extract the returned item from ctx.result. For GetItem, AWS may return
  // { Item: { ... } } or the raw item, depending on runtime.
  const item = (ctx.result && ((ctx.result as any).Item || ctx.result)) as any;

  if (!item) {
    console.error(`User not found in DynamoDB for userId: ${userId}`);
    console.error(`Identity username: ${identity.username}`);
    console.error(`Identity groups: ${JSON.stringify(identity.groups)}`);

    return util.error(
      `User profile not found. Please contact support if this issue persists. UserId: ${userId}`,
      "UserNotFound",
    );
  }

  const userFromDB = item;

  // Map Cognito groups to ClientType using single source of truth
  const cognitoGroups = identity.groups || [];
  console.log(
    `Cognito groups for user ${userId}:`,
    JSON.stringify(cognitoGroups),
  );

  const clientType: ClientType[] = [];

  for (const group of cognitoGroups) {
    if (isValidClientType(group)) {
      // Map the valid group name to the corresponding ClientType enum value
      clientType.push(ClientType[group as keyof typeof ClientType]);
      console.log(`Mapped group "${group}" to ClientType.${group}`);
    } else {
      console.log(`Unknown group: ${group}, not mapping to any ClientType`);
    }
  }

  if (clientType.length === 0) {
    console.log(
      `No groups mapped to ClientType, adding default UnauthenticatedUser`,
    );
    clientType.push(ClientType.UnauthenticatedUser);
  }

  console.log(`Final clientType array:`, JSON.stringify(clientType));

  // Construct the final UserType object
  // Ensure all non-nullable fields of UserType are present.
  const resolvedUser: User = {
    ...userFromDB, // Spread raw DB result
    userId: userFromDB.userId || userId, // Ensure userId is present
    clientType: clientType,
  };

  return resolvedUser;
}
