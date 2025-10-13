import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  GetAWSEUserQuery,
  GetAWSEUserQueryVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getAWSEUser: "getAWSEUser",
};

// getAWSEUser Query
const getAWSEUserQueryStr = `
    query GetAWSEUser($userId: String!) {
      getAWSEUser(userId: $userId) {
        userId
        userAddedById
        privacyPolicy
        termsAndConditions
        userFirstName
        userLastName
        userEmail
        userPhone
        userTitle
        userCreated
        clientType
      }
    }
`;

export const getAWSEUserQueryKey = (userId: string) => [
  userQueryKeys.getAWSEUser,
  userId,
];

export const getAWSEUserQueryFn = (variables: GetAWSEUserQueryVariables) => {
  return amplifyGraphqlClient.graphql({
    query: getAWSEUserQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<GetAWSEUserQuery>>;
};
