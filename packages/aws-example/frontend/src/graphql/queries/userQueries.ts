import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  GetawsbUserQuery,
  GetawsbUserQueryVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getawsbUser: "getawsbUser",
};

// getawsbUser Query
const getawsbUserQueryStr = `
    query GetawsbUser($userId: String!) {
      getawsbUser(userId: $userId) {
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
        organizationId
        userRole
        clientType
      }
    }
`;

export const getawsbUserQueryKey = (userId: string) => [
  userQueryKeys.getawsbUser,
  userId,
];

export const getawsbUserQueryFn = (variables: GetawsbUserQueryVariables) => {
  return amplifyGraphqlClient.graphql({
    query: getawsbUserQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<GetawsbUserQuery>>;
};
