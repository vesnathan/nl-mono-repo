import { util, Context, AppSyncIdentityCognito } from '@aws-appsync/utils';
import { CWLUserInput, CWLUser } from '../../../../../../frontend/src/types/gqlTypes'; // Use shared frontend-generated types
import { v4 as uuidv4 } from 'uuid';

// Define Input type for the resolver
type CreateCWLUserMutationVariables = {
  input: CWLUserInput;
};

// Define Output type for the resolver - it's CWLUser as per schema
type Output = CWLUser;

// Define CTX for the response function context
type CTX = Context<CreateCWLUserMutationVariables, object, object, object, Output>;

export function request(ctx: Context<CreateCWLUserMutationVariables>) {
  const { input } = ctx.args;
  const identity = ctx.identity as AppSyncIdentityCognito;

  // Only SuperAdmins can create new users
  if (!identity.groups?.includes('SuperAdmin')) {
    util.error('Unauthorized: Only SuperAdmins can create users.', 'Unauthorized');
  }

  const userId = uuidv4(); // Generate a new UUID for the user
  const now = util.time.nowISO8601();

  const newUserItem = {
    userId,
    ...input,
    userAddedById: identity.username, // The SuperAdmin creating this user
    userCreated: now,
    privacyPolicy: false, // Default value, can be updated by user later
    termsAndConditions: false, // Default value, can be updated by user later
    // clientType is not set here; it's derived from Cognito groups by the getCWLUser query resolver
  };

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ userId }),
    attributeValues: util.dynamodb.toMapValues(newUserItem),
    // condition: {
    //   expression: 'attribute_not_exists(userId)', // Ensure user doesn't already exist
    // },
  };
}

export function response(ctx: CTX): Output {
  if (ctx.error) {
    console.error('Error in resolver:', ctx.error);
    // Handle specific DynamoDB errors if necessary, e.g., ConditionalCheckFailedException
    if (ctx.error.type === 'DynamoDB:ConditionalCheckFailedException') {
      util.error('A user with this ID already exists.', 'ConditionalCheckFailedException');
    }
    return util.error(ctx.error.message, ctx.error.type);
  }
  console.log('User creation successful, result:', JSON.stringify(ctx.result));
  // The result of PutItem is the item itself if successful and no error occurred.
  // However, AppSync typically returns the `attributeValues` passed in the request for PutItem.
  // We need to construct the CWLUser object that matches the GraphQL schema.

  // The ctx.result from a PutItem operation is usually the item that was put.
  // If you used `returnValues: 'ALL_OLD'` or similar, it might be different.
  // Assuming ctx.result directly contains the newly created user's attributes.
  const createdUser = ctx.result as any; 

  // The clientType will be dynamically added by the Query.getCWLUser resolver
  // when the user data is fetched. For the mutation response, we can return an empty array
  // or a default, as it's not part of the direct creation storage.
  return {
    __typename: "CWLUser",
    userId: createdUser.userId,
    organizationId: createdUser.organizationId,
    userEmail: createdUser.userEmail,
    userTitle: createdUser.userTitle,
    userFirstName: createdUser.userFirstName,
    userLastName: createdUser.userLastName,
    userPhone: createdUser.userPhone,
    userRole: createdUser.userRole,
    privacyPolicy: createdUser.privacyPolicy,
    termsAndConditions: createdUser.termsAndConditions,
    userAddedById: createdUser.userAddedById,
    userCreated: createdUser.userCreated,
    clientType: [], // Will be populated by getCWLUser based on Cognito groups
  };
}
