// Compiled from: /workspaces/nl-mono-repo/packages/cloudwatchlive/backend/resources/AppSync/resolvers/users/Queries/Query.getCWLUser.ts\n// Target S3 Key: resolvers/dev/Query.getCWLUser.js\nimport { util } from '@aws-appsync/utils';
import { ClientType } from 'gqlTypes';
export function request(ctx) {
    // It's good practice to cast args to the specific type
    const args = ctx.args;
    const { userId } = args;
    if (!userId) {
        // If userId is essential and missing, throw an error.
        // AppSync typically validates non-nullable args based on the GraphQL schema.
        // This explicit check can be a safeguard or for more complex validation.
        return util.error("User ID is missing in the request.", "ValidationException");
    }
    const identity = ctx.identity;
    if (identity.username !== userId) {
        return util.error("User is not allowed to retrieve data of a different user", "Unauthorized");
    }
    console.log(`Getting user data for userId: ${userId}`);
    console.log(`Identity username: ${identity.username}`);
    return {
        operation: "GetItem",
        key: util.dynamodb.toMapValues({ userId }),
    };
}
export function response(ctx) {
    console.log("Response result:", JSON.stringify(ctx.result));
    if (ctx.error) {
        console.error("Error in resolver:", ctx.error);
        // Make sure to return or throw, not just log, if you want to stop execution.
        // util.error will throw, which is appropriate here.
        return util.error(ctx.error.message, ctx.error.type);
    }
    const identity = ctx.identity;
    // Retrieve args safely, it's good practice to cast or ensure it's the correct type.
    const args = ctx.args;
    const { userId } = args;
    if (!ctx.result) {
        console.error(`User not found in DynamoDB for userId: ${userId}`);
        console.error(`Identity username: ${identity.username}`);
        console.error(`Identity groups: ${JSON.stringify(identity.groups)}`);
        return util.error(`User profile not found. Please contact support if this issue persists. UserId: ${userId}`, "UserNotFound");
    }
    // Assuming ctx.result is the raw item from DynamoDB, cast and map it.
    // The 'any' cast should be followed by a proper mapping to CWLUser structure if needed.
    // For now, we'll assume the structure matches CWLUser or is handled by direct return.
    const userFromDB = ctx.result;
    // Map Cognito groups to ClientType
    const cognitoGroups = identity.groups || [];
    console.log(`Cognito groups for user ${userId}:`, JSON.stringify(cognitoGroups));
    const clientType = [];
    for (const group of cognitoGroups) {
        switch (group) {
            case 'SuperAdmin':
                clientType.push(ClientType.SuperAdmin);
                break;
            case 'EventCompanyAdmin':
                clientType.push(ClientType.EventCompanyAdmin);
                break;
            case 'EventCompanyStaff':
                clientType.push(ClientType.EventCompanyStaff);
                break;
            case 'TechCompanyAdmin':
                clientType.push(ClientType.TechCompanyAdmin);
                break;
            case 'TechCompanyStaff':
                clientType.push(ClientType.TechCompanyStaff);
                break;
            case 'RegisteredAttendee':
                clientType.push(ClientType.RegisteredAttendee);
                break;
            case 'UnregisteredAttendee':
                clientType.push(ClientType.UnregisteredAttendee);
                break;
            default:
                console.log(`Unknown group: ${group}, not mapping to any ClientType`);
        }
    }
    if (clientType.length === 0) {
        console.log(`No groups mapped to ClientType, adding default UnregisteredAttendee`);
        clientType.push(ClientType.UnregisteredAttendee);
    }
    console.log(`Final clientType array:`, JSON.stringify(clientType));
    // Construct the final CWLUser object
    // Ensure all non-nullable fields of CWLUser are present.
    // This is a simplified mapping. A more robust solution would involve
    // explicitly creating the CWLUser object and populating its fields.
    const resolvedUser = {
        ...userFromDB, // Spread raw DB result
        userId: userFromDB.userId || userId, // Ensure userId is present
        clientType: clientType,
        // Ensure other non-nullable fields from CWLUser are present, e.g.:
        // email: userFromDB.email || "", 
        // username: userFromDB.username || "",
        // createdAt: userFromDB.createdAt || new Date().toISOString(),
        // updatedAt: userFromDB.updatedAt || new Date().toISOString(),
        // Add other fields as defined in CWLUser type from gqlTypes.ts
        // If fields are optional in DB but non-nullable in GQL, provide defaults or ensure they exist.
    };
    // Validate that resolvedUser matches the Output type (CWLUser)
    // This is more of a conceptual step here, TypeScript handles static typing.
    // At runtime, ensure the object structure is correct.
    return resolvedUser;
}
