import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  adminSetUserMFAPreferenceMutation,
  adminSetUserMFAPreferenceMutationVariables,
  associateSoftwareTokenMutationVariables,
  associateSoftwareTokenMutation,
  verifySoftwareTokenMutation,
  verifySoftwareTokenMutationVariables,
  StandardResult,
  CWLUserInput,
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
      statusCode
      body
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
      statusCode
      body
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
    mutation SaveSuperAdminClient($input: CWLUserInput!) {
      saveSuperAdminClient(input: $input) {
        statusCode
        body
      }
    }
`;
export const saveSuperAdminClientQueryKey = () => [
  userMutationKeys.saveSuperAdminClient,
];

export const saveSuperAdminClientMutationFn = async (variables: {
  input: CWLUserInput;
}) => {
  return amplifyGraphqlClient.graphql({
    query: saveSuperAdminClientMutationStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<StandardResult>>;
};
