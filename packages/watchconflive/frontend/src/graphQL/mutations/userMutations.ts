import {

    adminSetUserMFAPreferenceMutation,
    adminSetUserMFAPreferenceMutationVariables,
    associateSoftwareTokenMutationVariables,
    associateSoftwareTokenMutation,
    verifySoftwareTokenMutation,
    verifySoftwareTokenMutationVariables,
  } from "@/graphql/gqlTypes";
  
  import { GraphQLResult, generateClient } from "aws-amplify/api";

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
        status
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
  