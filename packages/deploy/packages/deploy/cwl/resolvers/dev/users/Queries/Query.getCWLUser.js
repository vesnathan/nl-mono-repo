// Compiled from: /workspaces/nl-mono-repo/packages/cloudwatchlive/backend/resources/AppSync/resolvers/users/Queries/Query.getCWLUser.ts\n// Target S3 Key: resolvers/dev/Query.getCWLUser.js\n// ../../../../tmp/nl_resolver_build_dev_1750116311530/__temp_individual_resolver_builds__/Query.getCWLUser.ts
import { util } from "@aws-appsync/utils";
function request(ctx) {
  const args = ctx.args;
  const { userId } = args;
  if (!userId) {
    return util.error(
      "User ID is missing in the request.",
      "ValidationException"
    );
  }
  const identity = ctx.identity;
  if (identity.username !== userId) {
    return util.error(
      "User is not allowed to retrieve data of a different user",
      "Unauthorized"
    );
  }
  console.log(`Getting user data for userId: ${userId}`);
  console.log(`Identity username: ${identity.username}`);
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ userId })
  };
}
function response(ctx) {
  console.log("Response result:", JSON.stringify(ctx.result));
  if (ctx.error) {
    console.error("Error in resolver:", ctx.error);
    return util.error(ctx.error.message, ctx.error.type);
  }
  const identity = ctx.identity;
  const args = ctx.args;
  const { userId } = args;
  if (!ctx.result) {
    console.error(`User not found in DynamoDB for userId: ${userId}`);
    console.error(`Identity username: ${identity.username}`);
    console.error(`Identity groups: ${JSON.stringify(identity.groups)}`);
    return util.error(
      `User profile not found. Please contact support if this issue persists. UserId: ${userId}`,
      "UserNotFound"
    );
  }
  const userFromDB = ctx.result;
  const cognitoGroups = identity.groups || [];
  console.log(`Cognito groups for user ${userId}:`, JSON.stringify(cognitoGroups));
  const clientType = [];
  for (const group of cognitoGroups) {
    switch (group) {
      case "SuperAdmin":
        clientType.push("SuperAdmin" /* SuperAdmin */);
        break;
      case "EventCompanyAdmin":
        clientType.push("EventCompanyAdmin" /* EventCompanyAdmin */);
        break;
      case "EventCompanyStaff":
        clientType.push("EventCompanyStaff" /* EventCompanyStaff */);
        break;
      case "TechCompanyAdmin":
        clientType.push("TechCompanyAdmin" /* TechCompanyAdmin */);
        break;
      case "TechCompanyStaff":
        clientType.push("TechCompanyStaff" /* TechCompanyStaff */);
        break;
      case "RegisteredAttendee":
        clientType.push("RegisteredAttendee" /* RegisteredAttendee */);
        break;
      case "UnregisteredAttendee":
        clientType.push("UnregisteredAttendee" /* UnregisteredAttendee */);
        break;
      default:
        console.log(`Unknown group: ${group}, not mapping to any ClientType`);
    }
  }
  if (clientType.length === 0) {
    console.log(`No groups mapped to ClientType, adding default UnregisteredAttendee`);
    clientType.push("UnregisteredAttendee" /* UnregisteredAttendee */);
  }
  console.log(`Final clientType array:`, JSON.stringify(clientType));
  const resolvedUser = {
    ...userFromDB,
    // Spread raw DB result
    userId: userFromDB.userId || userId,
    // Ensure userId is present
    clientType
    // Ensure other non-nullable fields from CWLUser are present, e.g.:
    // email: userFromDB.email || "", 
    // username: userFromDB.username || "",
    // createdAt: userFromDB.createdAt || new Date().toISOString(),
    // updatedAt: userFromDB.updatedAt || new Date().toISOString(),
    // Add other fields as defined in CWLUser type from gqlTypes.ts
    // If fields are optional in DB but non-nullable in GQL, provide defaults or ensure they exist.
  };
  return resolvedUser;
}
export {
  request,
  response
};
