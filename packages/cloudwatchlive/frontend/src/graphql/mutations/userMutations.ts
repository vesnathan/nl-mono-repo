import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  registerClientUserUnauthMutation,
  registerClientUserUnauthMutationVariables,
  updateMyCWLUserDataMutation,
  updateMyCWLUserDataMutationVariables,
  adminSetUserMFAPreferenceMutation,
  adminSetUserMFAPreferenceMutationVariables,
  associateSoftwareTokenMutationVariables,
  associateSoftwareTokenMutation,
  verifySoftwareTokenMutation,
  verifySoftwareTokenMutationVariables,
} from "../gqlTypes";

const client = generateClient();

// ------------------- register ----------------
const registerClientUserUnauthMutationStr = `
  mutation registerClientUserUnauth($input: CreateCWLUserInput!) {
    registerClientUserUnauth(input: $input) {
      userId
    }
  }
`;

export const registerClientUserUnauthMutationFn = async (options: {
  variables: registerClientUserUnauthMutationVariables;
}) => {
  return client.graphql({
    query: registerClientUserUnauthMutationStr,
    variables: options.variables,
    authMode: "iam",
  }) as Promise<GraphQLResult<registerClientUserUnauthMutation>>;
};

// ------------------- update user data----------------

const updateMyCWLUserDataMutationStr = `
  mutation updateMyCWLUserData($input: UpdateCWLUserInput!) {
    updateMyCWLUserData(input: $input) {
      userId
    }
  }
`;

export const updateMyCWLUserDataMutationFn = async (options: {
  variables: updateMyCWLUserDataMutationVariables;
}) => {
  return client.graphql({
    query: updateMyCWLUserDataMutationStr,
    variables: options.variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<updateMyCWLUserDataMutation>>;
};

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
