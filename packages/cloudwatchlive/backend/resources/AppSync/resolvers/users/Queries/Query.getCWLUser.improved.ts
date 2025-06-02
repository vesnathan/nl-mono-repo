import {
  util,
  runtime,
  Context,
  AppSyncIdentityCognito,
} from "@aws-appsync/utils";
import {
  CWLUser,
  Query,
  QueryToGetCWLUserArgs,
  ClientType,
} from "../../gqlTypes";

type CTX = Context<QueryToGetCWLUserArgs>;
type Output = Query["getCWLUser"];

export function request(ctx: CTX) {
  const { userId } = ctx.args;
  if (!userId) {
    runtime.earlyReturn(undefined satisfies Output);
  }

  const identity = ctx.identity as AppSyncIdentityCognito;
  if (identity.username !== userId) {
    return util.error(
      "User is not allowed to retrieve data of a different user",
      "Unauthorized",
    );
  }

  // For JavaScript resolvers, we return the arguments to be processed in the response function
  return {
    operation: "GetItem",
    key: util.dynamodb.toMapValues({ userId }),
  };
}

export function response(ctx: CTX): Output {
  console.log('Response ctx.result:', JSON.stringify(ctx.result));
  console.log('Response ctx.error:', JSON.stringify(ctx.error));
  
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  const identity = ctx.identity as AppSyncIdentityCognito;
  const { userId } = ctx.args;

  // If no user found in DynamoDB, we need to handle this properly
  // since the schema requires a non-nullable CWLUser return type
  if (!ctx.result) {
    // Log the issue for debugging
    console.error(`User not found in DynamoDB for userId: ${userId}`);
    console.error(`Identity username: ${identity.username}`);
    console.error(`Identity groups: ${JSON.stringify(identity.groups)}`);
    
    // Return an error instead of null to satisfy GraphQL schema requirements
    util.error(
      `User profile not found. Please contact support if this issue persists. UserId: ${userId}`,
      "UserNotFound"
    );
  }

  const user = ctx.result as any;

  // Map Cognito groups to ClientType
  const cognitoGroups = identity.groups || [];
  console.log('Cognito groups:', JSON.stringify(cognitoGroups));
  
  const clientType: ClientType[] = [];

  // Map Cognito group names to ClientType enum values
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
        clientType.push(ClientType.RegisteredAtendee);
        break;
      case 'UnregisteredAttendee':
        clientType.push(ClientType.UnregisteredAttendee);
        break;
    }
  }

  // CRITICAL: Always ensure clientType has at least one value to satisfy GraphQL schema
  if (clientType.length === 0) {
    console.log('No client types mapped from groups, using default UnregisteredAttendee');
    clientType.push(ClientType.UnregisteredAttendee);
  }

  // Ensure all required non-nullable fields have values
  const userRole = user.userRole || "User";
  const userEmail = user.userEmail || identity.username || "";
  const userFirstName = user.userFirstName || "";
  const userLastName = user.userLastName || "";
  const userPhone = user.userPhone || "";
  const userTitle = user.userTitle || "";
  const organizationId = user.organizationId || "";
  const userAddedById = user.userAddedById || "";
  const userCreated = user.userCreated || new Date().toISOString();

  // Return the complete user object with all required fields populated
  // and ALWAYS include the clientType array with at least one value
  return {
    userId: userId,
    userEmail: userEmail,
    userFirstName: userFirstName,
    userLastName: userLastName,
    userPhone: userPhone,
    userTitle: userTitle,
    userRole: userRole,
    organizationId: organizationId,
    userAddedById: userAddedById,
    userCreated: userCreated,
    privacyPolicy: user.privacyPolicy || false,
    termsAndConditions: user.termsAndConditions || false,
    clientType: clientType, // This will never be null or empty
  } as CWLUser;
}
