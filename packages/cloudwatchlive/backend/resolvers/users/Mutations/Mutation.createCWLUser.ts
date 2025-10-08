import { util, Context, AppSyncIdentityCognito } from '@aws-appsync/utils';
// 'gqlTypes' is a module alias mapped in tsconfig.json to ../frontend/src/types/gqlTypes.ts
// This allows the resolver compiler to resolve GraphQL generated types during build
import { CWLUserInput, CWLUser } from 'gqlTypes';

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

  const userId = util.autoId(); // Generate a new UUID for the user
  const now = util.time.nowISO8601();

  // Extract sendWelcomeEmail and remove it from the item (it's not stored in DB)
  const { sendWelcomeEmail, ...userInputWithoutEmail } = input;
  
  // Store sendWelcomeEmail in stash for the pipeline resolver to use
  ctx.stash.sendWelcomeEmail = sendWelcomeEmail || false;
  ctx.stash.input = input;

  const newUserItem = {
    id: userId, // Primary key for DynamoDB
    userId,
    ...userInputWithoutEmail,
    userAddedById: identity.username, // The SuperAdmin creating this user
    userCreated: now,
    privacyPolicy: false, // Default value, can be updated by user later
    termsAndConditions: false, // Default value, can be updated by user later
    userProfilePicture: {
      Bucket: "",
      Key: ""
    }, // Default empty S3 object
    // clientType is not set here; it's derived from Cognito groups by the getCWLUser query resolver
  };

  return {
    operation: 'PutItem',
    key: util.dynamodb.toMapValues({ id: userId }),
    attributeValues: util.dynamodb.toMapValues(newUserItem),
    // condition: {
    //   expression: 'attribute_not_exists(id)', // Ensure user doesn't already exist
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
    userProfilePicture: createdUser.userProfilePicture || { Bucket: "", Key: "" },
  };
}
