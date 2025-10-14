import { GraphQLResult, generateClient } from "aws-amplify/api";
import { GetUserQuery, GetUserQueryVariables } from "@/types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getUser: "getUser",
};

// getUser Query
const getUserQueryStr = `
    query GetUser($userId: String!) {
      getUser(userId: $userId) {
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

export const getUserQueryKey = (userId: string) => [
  userQueryKeys.getUser,
  userId,
];

export const getUserQueryFn = (variables: GetUserQueryVariables) => {
  return amplifyGraphqlClient.graphql({
    query: getUserQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<GetUserQuery>>;
};
