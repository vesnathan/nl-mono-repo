import { GraphQLResult, generateClient } from "aws-amplify/api";
import { GetCWLUserQuery, GetCWLUserQueryVariables } from "../gqlTypes";

const amplifyGraphqlClient = generateClient();

export const userQueryKeys = {
  getCWLUser: "getCWLUser",
  profilePicture: "profilePicture",
};

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
