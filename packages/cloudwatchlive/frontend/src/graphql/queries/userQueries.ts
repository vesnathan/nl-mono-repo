import { GraphQLResult, generateClient } from "aws-amplify/api";
import { GetCWLUserQuery, GetCWLUserQueryVariables } from "@/types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getCWLUser: "getCWLUser",
};

// getCWLUser Query
const getCWLUserQueryStr = `
    query GetCWLUser($userId: String!) {
      getCWLUser(userId: $userId) {
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
