import { GraphQLResult, generateClient } from "aws-amplify/api";
import { GetCWLUserQuery, GetCWLUserQueryVariables } from "../gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getCWLUser: "getCWLUser",
};

// getCWLUser Wuery
const getCWLUserQueryStr = /* GraphQL */ `
  query GetCWLUser($userId: String!) {
    getCWLUser(userId: $userId) {
      __typename
      userId
      organizationId
      privacyPolicy
      termsAndConditions
      userAddedById
      userCreated
      userEmail
      userTitle
      userFirstName
      userLastName
      userPhone
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
