import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  GetANAUserQuery,
  GetANAUserQueryVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getANAUser: "getANAUser",
};

// getANAUser Query
const getANAUserQueryStr = `
    query GetANAUser($userId: String!) {
      getANAUser(userId: $userId) {
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

export const getANAUserQueryKey = (userId: string) => [
  userQueryKeys.getANAUser,
  userId,
];

export const getANAUserQueryFn = (variables: GetANAUserQueryVariables) => {
  return amplifyGraphqlClient.graphql({
    query: getANAUserQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<GetANAUserQuery>>;
};
