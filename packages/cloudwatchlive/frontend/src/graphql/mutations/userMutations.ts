import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  adminSetUserMFAPreferenceMutation,
  adminSetUserMFAPreferenceMutationVariables,
  associateSoftwareTokenMutationVariables,
  associateSoftwareTokenMutation,
  verifySoftwareTokenMutation,
  verifySoftwareTokenMutationVariables,
  SaveClientInput,
  SaveClientResult,
} from "../gqlTypes";

export const userMutationKeys = {
  saveSuperAdminClient: "saveSuperAdminClient",
  saveEventCompanyAdminClient: "saveEventCompanyAdminClient",
};

const amplifyGraphqlClient = generateClient();

const client = generateClient();

const adminSetUserMFAPreferenceMutationStr = `
  mutation adminSetUserMFAPreference($input: AdminSetUserMFAPreferenceInput!) {
    adminSetUserMFAPreference(input: $input) {
      userId
    }
  }
`;

export const adminSetUserMFAPreferenceMutationFn = async (options: {
  variables: adminSetUserMFAPreferenceMutationVariables;
}) => {
  return client.graphql({
    query: adminSetUserMFAPreferenceMutationStr,
    variables: options.variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<adminSetUserMFAPreferenceMutation>>;
};

const associateSoftwareTokenMutationStr = `
  mutation associateSoftwareToken($accessToken: String!) {
    associateSoftwareToken(accessToken: $accessToken) {
      secretCode
    }
  }
`;

export const associateSoftwareTokenMutationFn = async (options: {
  variables: associateSoftwareTokenMutationVariables;
}) => {
  return client.graphql({
    query: associateSoftwareTokenMutationStr,
    variables: options.variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<associateSoftwareTokenMutation>>;
};

const verifySoftwareTokenMutationStr = `
  mutation verifySoftwareToken($input: VerifySoftwareTokenInput!) {
    verifySoftwareToken(input: $input) {
      success
      message
    }
  }
`;

export const verifySoftwareTokenMutationFn = async (options: {
  variables: verifySoftwareTokenMutationVariables;
}) => {
  return client.graphql({
    query: verifySoftwareTokenMutationStr,
    variables: options.variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<verifySoftwareTokenMutation>>;
};

// saveSuperAdminClientMutationFn Mutation
const saveSuperAdminClientMutationStr = `
    mutation SaveSuperAdminClient($input: SaveClientInput!) {
      saveSuperAdminClient(input: $input) {
        success
        message
      }
    }
`;
export const saveSuperAdminClientQueryKey = () => [
  userMutationKeys.saveSuperAdminClient,
];

export const saveSuperAdminClientMutationFn = async (variables: {
  input: SaveClientInput;
}) => {
  return amplifyGraphqlClient.graphql({
    query: saveSuperAdminClientMutationStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<SaveClientResult>>;
};

// saveEventCompanyAdminClientMutationFn Mutation
const saveEventCompanyAdminClientQueryStr = `
    mutation SaveEventCompanyAdminClient($input: SaveClientInput!) {
      saveSuperAdminClient(input: $input) {
          success
          message
      }
    }
`;

export const saveEventCompanyAdminClientQueryKey = () => [
  userMutationKeys.saveEventCompanyAdminClient,
];

export const saveEventCompanyAdminClientMutationFn = async (
  variables: SaveClientInput,
) => {
  return amplifyGraphqlClient.graphql({
    query: saveEventCompanyAdminClientQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<SaveClientResult>>;
};
