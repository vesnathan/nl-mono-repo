import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  GetCWLUserQuery,
  GetCWLUserQueryVariables,
  SaveSuperAdminClientInput,
  SaveSuperAdminClientResult,
} from "../gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getCWLUser: "getCWLUser",
  profilePicture: "profilePicture",
  saveSuperAdminClient: "saveSuperAdminClient",
  saveEventCompanyAdminClient: "saveEventCompanyAdminClient",
};

// getCWLUser Wuery
const getCWLUserQueryStr = `
    query GetCWLUser($userId: String!) {
      getCWLUser(userId: $userId) {
        userId
        userAddedById
        PrivacyPolicy
        TermsAndConditions
        userFirstName
        userLastName     
        userEmail
        userPhone
        userTitle
        userProfilePicture {
          Bucket
          Key
        }
        userCreated
        organizationId 
      }
    }
`;

export const getCWLUserQueryKey = (userId: string) => [
  userQueryKeys.getCWLUser,
  userId,
];

export const getCWLUserQueryFn = (variables: GetCWLUserQueryVariables) => {
  return amplifyGraphqlClient.graphql({
    query: getCWLUserQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<GetCWLUserQuery>>;
};

// saveSuperAdminClientMutationFn Mutation
const saveSuperAdminClientMutationStr = `
    mutation SaveSuperAdminClient($input: SaveSuperAdminClientInput!) {
      saveSuperAdminClient(input: $input) {
          id,
      }
    }
`;
export const saveSuperAdminClientQueryKey = () => [
  userQueryKeys.saveSuperAdminClient,
];

export const saveSuperAdminClientMutationFn = async (
  variables: SaveSuperAdminClientInput,
) => {
  return amplifyGraphqlClient.graphql({
    query: saveSuperAdminClientMutationStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<SaveSuperAdminClientResult>>;
};

// saveEventCompanyAdminClientMutationFn Mutation
const saveEventCompanyAdminClientQueryStr = `
    mutation SaveEventCompanyAdminClient($input: SaveSuperAdminClientInput!) {
      saveSuperAdminClient(input: $input) {
          id,
      }
    }
`;

export const saveEventCompanyAdminClientQueryKey = () => [
  userQueryKeys.saveEventCompanyAdminClient,
];

export const saveEventCompanyAdminClientMutationFn = async (
  variables: SaveSuperAdminClientInput,
) => {
  return amplifyGraphqlClient.graphql({
    query: saveEventCompanyAdminClientQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<SaveSuperAdminClientResult>>;
};
