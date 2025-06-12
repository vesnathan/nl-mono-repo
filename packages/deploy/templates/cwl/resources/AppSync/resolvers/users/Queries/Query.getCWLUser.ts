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

  console.log('Request ctx.arguments:', JSON.stringify(ctx.args));
  const dynamoKey = util.dynamodb.toMapValues({ userId });
  console.log('DynamoDB key:', JSON.stringify(dynamoKey));
  
  return {
    operation: "GetItem",
    key: dynamoKey,
  };
}

export function response(ctx: CTX): Output {
  console.log('Response ctx.result:', JSON.stringify(ctx.result));
  console.log('Response ctx.error:', JSON.stringify(ctx.error));
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  if (!ctx.result) {
    return undefined;
  }

  const user = ctx.result as any;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Map Cognito groups to ClientType
  const cognitoGroups = identity.groups || [];
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
        clientType.push(ClientType.RegisteredAttendee);
        break;
      case 'UnregisteredAttendee':
        clientType.push(ClientType.UnregisteredAttendee);
        break;
    }
  }

  // Provide default userRole if missing
  const userRole = user.userRole || "User";

  // Return the complete user object with derived clientType and default userRole
  return {
    ...user,
    userRole,
    clientType,
  } as CWLUser;
}

