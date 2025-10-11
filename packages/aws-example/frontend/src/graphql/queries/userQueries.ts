import { GraphQLResult, generateClient } from "aws-amplify/api";
import {
  GetAWSBUserQuery,
  GetAWSBUserQueryVariables,
} from "../../types/gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getAWSBUser: "getAWSBUser",
};

// getAWSBUser Query
const getAWSBUserQueryStr = `
    query GetAWSBUser($userId: String!) {
      getAWSBUser(userId: $userId) {
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

export const getAWSBUserQueryKey = (userId: string) => [
  userQueryKeys.getAWSBUser,
  userId,
];

export const getAWSBUserQueryFn = (variables: GetAWSBUserQueryVariables) => {
  return amplifyGraphqlClient.graphql({
    query: getAWSBUserQueryStr,
    variables,
    authMode: "userPool",
  }) as Promise<GraphQLResult<GetAWSBUserQuery>>;
};
